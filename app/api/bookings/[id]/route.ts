import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
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

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(
          id,
          title,
          description,
          base_price,
          location,
          images:listing_images(url, display_order)
        ),
        variant:listing_variants(id, name, price_modifier),
        renter:profiles!bookings_renter_id_fkey(
          id,
          full_name,
          avatar_url,
          email,
          phone
        ),
        lender:profiles!bookings_lender_id_fkey(
          id,
          full_name,
          avatar_url,
          email,
          phone
        ),
        addons:booking_addons(
          addon:listing_addons(id, name, price)
        )
      `)
      .eq('id', params.id)
      .or(`renter_id.eq.${user.id},lender_id.eq.${user.id}`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('renter_id, lender_id, status')
      .eq('id', params.id)
      .single();

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isRenter = existingBooking.renter_id === user.id;
    const isLender = existingBooking.lender_id === user.id;

    if (!isRenter && !isLender) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, cancellation_reason } = body;

    const allowedUpdates: any = {};

    if (status) {
      if (status === 'confirmed' && isLender && existingBooking.status === 'pending') {
        allowedUpdates.status = 'confirmed';
      } else if (status === 'cancelled' && (isRenter || isLender)) {
        allowedUpdates.status = 'cancelled';
        allowedUpdates.cancelled_at = new Date().toISOString();
        if (cancellation_reason) {
          allowedUpdates.cancellation_reason = cancellation_reason;
        }
      } else if (status === 'active' && isLender && existingBooking.status === 'confirmed') {
        allowedUpdates.status = 'active';
      } else if (status === 'completed' && isLender && existingBooking.status === 'active') {
        allowedUpdates.status = 'completed';
        allowedUpdates.completed_at = new Date().toISOString();
      } else {
        return NextResponse.json(
          { error: 'Invalid status transition' },
          { status: 400 }
        );
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(allowedUpdates)
      .eq('id', params.id)
      .select()
      .single();

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
