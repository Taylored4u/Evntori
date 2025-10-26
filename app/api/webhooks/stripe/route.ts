import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getBookingConfirmationEmail, getNewBookingLenderEmail } from '@/lib/emails/templates';
import { sendEmail } from '@/lib/emails/send';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature || !STRIPE_CONFIG.webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase.from('webhook_events').insert({
    provider: 'stripe',
    event_type: event.type,
    event_id: event.id,
    payload: event.data.object as any,
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          await supabase
            .from('bookings')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              payment_status: 'paid',
            })
            .eq('id', bookingId);

          await supabase.from('audit_logs').insert({
            entity_type: 'booking',
            entity_id: bookingId,
            action: 'payment_completed',
            changes: {
              session_id: session.id,
              payment_status: session.payment_status,
              amount_total: session.amount_total,
            },
          });

          const { data: booking } = await supabase
            .from('bookings')
            .select(`
              *,
              renter:profiles!bookings_renter_id_fkey(id, email, full_name),
              lender:profiles!bookings_lender_id_fkey(id, email, full_name),
              listing:listings(title)
            `)
            .eq('id', bookingId)
            .single();

          if (booking && booking.renter && booking.lender && booking.listing) {
            const emailData = {
              renterName: booking.renter.full_name || 'Renter',
              lenderName: booking.lender.full_name || 'Lender',
              listingTitle: booking.listing.title,
              startDate: new Date(booking.start_date).toLocaleDateString(),
              endDate: new Date(booking.end_date).toLocaleDateString(),
              totalPrice: booking.total_price,
              bookingId: booking.id,
            };

            await sendEmail(
              booking.renter.email,
              'Booking Confirmed - Evntori',
              getBookingConfirmationEmail(emailData),
              'booking'
            );

            await sendEmail(
              booking.lender.email,
              'New Booking Received - Evntori',
              getNewBookingLenderEmail(emailData),
              'booking'
            );
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        if (bookingId) {
          await supabase
            .from('bookings')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              payment_status: 'paid',
              payment_intent_id: paymentIntent.id,
            })
            .eq('id', bookingId);

          await supabase.from('audit_logs').insert({
            entity_type: 'booking',
            entity_id: bookingId,
            action: 'payment_succeeded',
            changes: {
              payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
            },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        if (bookingId) {
          await supabase
            .from('bookings')
            .update({
              payment_status: 'failed',
              payment_error: paymentIntent.last_payment_error?.message || 'Payment failed',
            })
            .eq('id', bookingId);

          await supabase.from('audit_logs').insert({
            entity_type: 'booking',
            entity_id: bookingId,
            action: 'payment_failed',
            changes: {
              payment_intent_id: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message,
            },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        const { data: booking } = await supabase
          .from('bookings')
          .select('id')
          .eq('payment_intent_id', paymentIntentId)
          .single();

        if (booking) {
          await supabase.from('refunds').insert({
            booking_id: booking.id,
            amount: charge.amount_refunded / 100,
            reason: 'Refund processed',
            status: 'completed',
            stripe_refund_id: charge.refunds?.data[0]?.id,
            processed_at: new Date().toISOString(),
          });

          await supabase
            .from('bookings')
            .update({
              payment_status: charge.refunded ? 'refunded' : 'partially_refunded',
            })
            .eq('id', booking.id);

          await supabase.from('audit_logs').insert({
            entity_type: 'booking',
            entity_id: booking.id,
            action: 'refund_processed',
            changes: {
              amount_refunded: charge.amount_refunded,
              charge_id: charge.id,
            },
          });
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        const { data: lenderProfile } = await supabase
          .from('lender_profiles')
          .select('user_id, id')
          .eq('stripe_account_id', account.id)
          .single();

        if (lenderProfile) {
          await supabase
            .from('lender_profiles')
            .update({
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
              stripe_onboarding_completed: account.details_submitted,
              verification_status: account.charges_enabled && account.payouts_enabled ? 'verified' : 'pending',
            })
            .eq('stripe_account_id', account.id);

          await supabase.from('audit_logs').insert({
            user_id: lenderProfile.user_id,
            entity_type: 'lender_profile',
            entity_id: lenderProfile.id,
            action: 'stripe_account_updated',
            changes: {
              charges_enabled: account.charges_enabled,
              payouts_enabled: account.payouts_enabled,
              details_submitted: account.details_submitted,
            },
          });
        }
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;

        await supabase
          .from('payouts')
          .update({
            status: 'paid',
            paid_at: new Date(payout.arrival_date * 1000).toISOString(),
          })
          .eq('stripe_payout_id', payout.id);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;

        await supabase
          .from('payouts')
          .update({
            status: 'failed',
            failure_message: payout.failure_message || 'Payout failed',
          })
          .eq('stripe_payout_id', payout.id);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = dispute.charge as string;

        const charge = await stripe.charges.retrieve(chargeId);
        const paymentIntentId = charge.payment_intent as string;

        const { data: booking } = await supabase
          .from('bookings')
          .select('id, renter_id, lender_id')
          .eq('payment_intent_id', paymentIntentId)
          .single();

        if (booking) {
          await supabase.from('disputes').insert({
            booking_id: booking.id,
            raised_by_id: booking.renter_id,
            reason: 'other',
            description: `Stripe dispute: ${dispute.reason}`,
            status: 'under_review',
            stripe_dispute_id: dispute.id,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    await supabase
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);

    await supabase
      .from('webhook_events')
      .update({
        processed: false,
        processing_error: error.message,
      })
      .eq('event_id', event.id);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
