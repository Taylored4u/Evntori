import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');
    const userId = searchParams.get('user_id');

    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        reviewee:profiles!reviews_reviewee_id_fkey(
          id,
          full_name
        ),
        listing:listings(id, title)
      `)
      .order('created_at', { ascending: false });

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    if (userId) {
      query = query.eq('reviewee_id', userId);
    }

    const { data, error } = await query;

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
    const { booking_id, listing_id, reviewee_id, rating, comment } = body;

    if (!booking_id || !listing_id || !reviewee_id || !rating) {
      return NextResponse.json(
        { error: 'booking_id, listing_id, reviewee_id, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status, renter_id, lender_id')
      .eq('id', booking_id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only review completed bookings' },
        { status: 400 }
      );
    }

    if (booking.renter_id !== user.id && booking.lender_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('reviewer_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this booking' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        listing_id,
        reviewer_id: user.id,
        reviewee_id,
        rating,
        comment: comment || null,
      })
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
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
