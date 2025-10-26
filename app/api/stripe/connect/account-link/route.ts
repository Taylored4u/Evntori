import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAccountLink } from '@/lib/stripe/connect';

export async function POST(request: Request) {
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
      .select('stripe_account_id')
      .eq('user_id', session.user.id)
      .single();

    if (!lenderProfile?.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe account found' },
        { status: 404 }
      );
    }

    const url = await createAccountLink(lenderProfile.stripe_account_id);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error creating account link:', error);
    return NextResponse.json(
      { error: 'Failed to create account link' },
      { status: 500 }
    );
  }
}
