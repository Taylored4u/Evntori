import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createConnectAccount } from '@/lib/stripe/connect';

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: existingLender } = await supabase
      .from('lender_profiles')
      .select('stripe_account_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existingLender?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stripe account already exists' },
        { status: 400 }
      );
    }

    const account = await createConnectAccount(profile.email, session.user.id);

    const { error: updateError } = await supabase
      .from('lender_profiles')
      .update({
        stripe_account_id: account.id,
      })
      .eq('user_id', session.user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update lender profile' }, { status: 500 });
    }

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: account.onboardingUrl,
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe account' },
      { status: 500 }
    );
  }
}
