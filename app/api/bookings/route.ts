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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(
          id,
          title,
          base_price,
          images:listing_images(url)
        ),
        renter:profiles!bookings_renter_id_fkey(
          id,
          full_name,
          avatar_url,
          email
        ),
        lender:profiles!bookings_lender_id_fkey(
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (type === 'renter') {
      query = query.eq('renter_id', user.id);
    } else if (type === 'lender') {
      query = query.eq('lender_id', user.id);
    } else {
      query = query.or(`renter_id.eq.${user.id},lender_id.eq.${user.id}`);
    }

    if (status) {
      query = query.eq('status', status);
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
    const {
      listing_id,
      variant_id,
      start_date,
      end_date,
      delivery_option,
      setup_option,
      special_requests,
      addons,
    } = body;

    const { data: listing } = await supabase
      .from('listings')
      .select('*, lender:profiles!listings_lender_id_fkey(id)')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.lender_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot book your own listing' },
        { status: 400 }
      );
    }

    const rentalDays = Math.ceil(
      (new Date(end_date).getTime() - new Date(start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let itemPrice = listing.base_price * rentalDays;

    if (variant_id) {
      const { data: variant } = await supabase
        .from('listing_variants')
        .select('price_modifier')
        .eq('id', variant_id)
        .single();

      if (variant) {
        itemPrice += variant.price_modifier * rentalDays;
      }
    }

    let addonsPrice = 0;
    if (addons && addons.length > 0) {
      const { data: addonData } = await supabase
        .from('listing_addons')
        .select('price')
        .in('id', addons);

      if (addonData) {
        addonsPrice = addonData.reduce((sum, addon) => sum + addon.price, 0);
      }
    }

    const deliveryFee = delivery_option ? 50 : 0;
    const setupFee = setup_option ? 75 : 0;

    const subtotal = itemPrice + addonsPrice + deliveryFee + setupFee;
    const serviceFee = subtotal * 0.1;
    const totalPrice = subtotal + serviceFee;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        listing_id,
        variant_id,
        renter_id: user.id,
        lender_id: listing.lender_id,
        start_date,
        end_date,
        rental_days: rentalDays,
        item_price: itemPrice,
        delivery_fee: deliveryFee,
        setup_fee: setupFee,
        addons_price: addonsPrice,
        service_fee: serviceFee,
        total_price: totalPrice,
        delivery_option: delivery_option || false,
        setup_option: setup_option || false,
        special_requests,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 400 });
    }

    if (addons && addons.length > 0) {
      const addonInserts = addons.map((addon_id: string) => ({
        booking_id: booking.id,
        addon_id,
      }));

      await supabase.from('booking_addons').insert(addonInserts);
    }

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
