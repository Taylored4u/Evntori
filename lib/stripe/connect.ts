import { stripe, STRIPE_CONFIG } from './config';
import Stripe from 'stripe';

export async function createConnectAccount(email: string, userId: string) {
  if (STRIPE_CONFIG.useMock) {
    return {
      id: `acct_mock_${userId}`,
      onboardingUrl: `${STRIPE_CONFIG.appUrl}/sell/onboarding/success?mock=true`,
    };
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      user_id: userId,
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${STRIPE_CONFIG.appUrl}/sell/onboarding/refresh`,
    return_url: `${STRIPE_CONFIG.appUrl}/sell/onboarding/success`,
    type: 'account_onboarding',
  });

  return {
    id: account.id,
    onboardingUrl: accountLink.url,
  };
}

export async function createAccountLink(accountId: string, type: 'account_onboarding' | 'account_update' = 'account_onboarding') {
  if (STRIPE_CONFIG.useMock) {
    return `${STRIPE_CONFIG.appUrl}/sell/onboarding/success?mock=true`;
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${STRIPE_CONFIG.appUrl}/sell/onboarding/refresh`,
    return_url: `${STRIPE_CONFIG.appUrl}/sell/onboarding/success`,
    type,
  });

  return accountLink.url;
}

export async function getAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requiresInfo: boolean;
  requirements?: Stripe.Account.Requirements;
}> {
  if (STRIPE_CONFIG.useMock) {
    return {
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      requiresInfo: false,
    };
  }

  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requiresInfo: (account.requirements?.currently_due?.length || 0) > 0 ||
                  (account.requirements?.eventually_due?.length || 0) > 0,
    requirements: account.requirements,
  };
}

export async function createLoginLink(accountId: string) {
  if (STRIPE_CONFIG.useMock) {
    return `${STRIPE_CONFIG.appUrl}/sell/dashboard?mock=true`;
  }

  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}
