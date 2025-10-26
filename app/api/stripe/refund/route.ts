import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, reason } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
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
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (!booking.payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment found for this booking' },
        { status: 400 }
      );
    }

    if (booking.payment_status === 'refunded') {
      return NextResponse.json(
        { error: 'Booking already fully refunded' },
        { status: 400 }
      );
    }

    const refundAmount = amount ? Math.round(amount * 100) : undefined;

    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
      amount: refundAmount,
      reason: reason === 'requested_by_customer' ? 'requested_by_customer' : 'duplicate',
      metadata: {
        bookingId,
        refund_reason: reason || 'Cancellation',
      },
    });

    await supabase.from('refunds').insert({
      booking_id: bookingId,
      amount: refund.amount / 100,
      reason: reason || 'Booking cancelled',
      status: refund.status === 'succeeded' ? 'completed' : 'pending',
      stripe_refund_id: refund.id,
      processed_at: refund.status === 'succeeded' ? new Date().toISOString() : null,
    });

    await supabase
      .from('bookings')
      .update({
        payment_status: refund.amount === booking.total_price * 100 ? 'refunded' : 'partially_refunded',
      })
      .eq('id', bookingId);

    await supabase.from('audit_logs').insert({
      entity_type: 'booking',
      entity_id: bookingId,
      action: 'refund_initiated',
      changes: {
        refund_id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
