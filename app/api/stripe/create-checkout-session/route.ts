import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add your STRIPE_SECRET_KEY to the .env file.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-09-30.clover',
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase service role key not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        listings (
          title,
          lender_id,
          listing_images (url, is_cover)
        ),
        lender_profiles!bookings_lender_id_fkey (
          stripe_account_id,
          stripe_charges_enabled
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status === 'confirmed' || booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Booking already paid' },
        { status: 400 }
      );
    }

    const listing = booking.listings as any;
    const lenderProfile = booking.lender_profiles as any;
    const coverImage = listing?.listing_images?.find((img: any) => img.is_cover);

    if (!lenderProfile?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Lender payment account not configured' },
        { status: 400 }
      );
    }

    if (!lenderProfile.stripe_charges_enabled) {
      return NextResponse.json(
        { error: 'Lender is not able to accept payments yet' },
        { status: 400 }
      );
    }

    const rentalAmount = Math.round((booking.subtotal || 0) * 100);
    const depositAmount = Math.round((booking.deposit_amount || 0) * 100);
    const totalAmount = rentalAmount + depositAmount;

    const platformFeePercent = 0.10;
    const platformFeeAmount = Math.round(rentalAmount * platformFeePercent);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing?.title || 'Rental Item',
            images: coverImage ? [coverImage.url] : [],
            description: `Rental from ${new Date(booking.start_date).toLocaleDateString()} to ${new Date(booking.end_date).toLocaleDateString()}`,
          },
          unit_amount: rentalAmount,
        },
        quantity: 1,
      },
    ];

    if (depositAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Security Deposit (Refundable)',
            description: 'Held and released after rental completion',
          },
          unit_amount: depositAmount,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/bookings/${bookingId}?payment=success`,
      cancel_url: `${request.nextUrl.origin}/checkout/${bookingId}?payment=cancelled`,
      customer_email: booking.renter_email || undefined,
      metadata: {
        bookingId,
        renterId: booking.renter_id,
        lenderId: booking.lender_id,
        rentalAmount: rentalAmount.toString(),
        depositAmount: depositAmount.toString(),
      },
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: lenderProfile.stripe_account_id,
        },
        metadata: {
          bookingId,
          type: 'rental_payment',
        },
        description: `Rental: ${listing?.title}`,
      },
    });

    await supabase
      .from('bookings')
      .update({
        stripe_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
      })
      .eq('id', bookingId);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
