import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingVote } = await supabase
      .from('review_helpful_votes')
      .select('id')
      .eq('review_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this review' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('review_helpful_votes')
      .insert({
        review_id: params.id,
        user_id: user.id,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', params.id)
      .single();

    return NextResponse.json(
      { message: 'Vote recorded', helpful_count: review?.helpful_count || 0 },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('review_helpful_votes')
      .delete()
      .eq('review_id', params.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', params.id)
      .single();

    return NextResponse.json(
      { message: 'Vote removed', helpful_count: review?.helpful_count || 0 },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
