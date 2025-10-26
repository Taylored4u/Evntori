/*
  # Add Payment Tracking Fields

  1. Schema Updates
    - Add payment tracking columns to `bookings` table:
      - `payment_status` - Track payment state (pending, paid, failed, refunded, partially_refunded)
      - `payment_error` - Store payment error messages
      - `stripe_session_id` - Stripe checkout session ID
      - `payment_intent_id` - Stripe payment intent ID
    
    - Add columns to `refunds` table:
      - `stripe_refund_id` - Stripe refund ID for tracking

  2. Benefits
    - Complete payment lifecycle tracking
    - Better error handling and debugging
    - Refund reconciliation with Stripe
    - Payment status visibility for users
*/

-- Add payment tracking columns to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_error'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_error text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN stripe_session_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_intent_id text;
  END IF;
END $$;

-- Add stripe_refund_id to refunds table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'refunds' AND column_name = 'stripe_refund_id'
  ) THEN
    ALTER TABLE refunds ADD COLUMN stripe_refund_id text UNIQUE;
  END IF;
END $$;

-- Add stripe_dispute_id to disputes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' AND column_name = 'stripe_dispute_id'
  ) THEN
    ALTER TABLE disputes ADD COLUMN stripe_dispute_id text UNIQUE;
  END IF;
END $$;

-- Create indexes for payment tracking
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_refund ON refunds(stripe_refund_id);
