import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(id, title, images:listing_images(url)),
        participant_1:profiles!conversations_participant_1_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        participant_2:profiles!conversations_participant_2_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        last_message:messages!messages_conversation_id_fkey(
          content,
          created_at,
          sender_id
        )
      `)
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { participant_id, listing_id } = body;

    if (!participant_id) {
      return NextResponse.json(
        { error: 'participant_id is required' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(participant_1_id.eq.${user.id},participant_2_id.eq.${participant_id}),and(participant_1_id.eq.${participant_id},participant_2_id.eq.${user.id})`
      )
      .eq('listing_id', listing_id || null)
      .single();

    if (existing) {
      return NextResponse.json({ data: existing }, { status: 200 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_1_id: user.id,
        participant_2_id: participant_id,
        listing_id: listing_id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
