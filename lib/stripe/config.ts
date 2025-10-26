import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_build';

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  useMock: process.env.USE_MOCK_STRIPE === 'true',
  platformFeePercentage: 10,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
