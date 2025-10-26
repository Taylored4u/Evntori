import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAccountStatus } from '@/lib/stripe/connect';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: lenderProfile } = await supabase
      .from('lender_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!lenderProfile) {
      return NextResponse.json(
        { error: 'Lender profile not found' },
        { status: 404 }
      );
    }

    if (!lenderProfile.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe account found' },
        { status: 404 }
      );
    }

    const status = await getAccountStatus(lenderProfile.stripe_account_id);

    const shouldUpdate =
      status.chargesEnabled !== lenderProfile.stripe_charges_enabled ||
      status.payoutsEnabled !== lenderProfile.stripe_payouts_enabled ||
      status.detailsSubmitted !== lenderProfile.stripe_onboarding_completed;

    if (shouldUpdate) {
      await supabase
        .from('lender_profiles')
        .update({
          stripe_charges_enabled: status.chargesEnabled,
          stripe_payouts_enabled: status.payoutsEnabled,
          stripe_onboarding_completed: status.detailsSubmitted,
          verification_status: status.chargesEnabled && status.payoutsEnabled ? 'verified' : 'pending',
        })
        .eq('user_id', session.user.id);
    }

    return NextResponse.json({
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      requiresInfo: status.requiresInfo,
      requirements: status.requirements,
    });
  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}
