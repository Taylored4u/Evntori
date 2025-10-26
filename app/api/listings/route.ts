import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'active';

    let query = supabase
      .from('listings')
      .select(`
        *,
        lender:profiles!listings_lender_id_fkey(id, full_name, avatar_url),
        category:categories(id, name, slug),
        images:listing_images(id, url, display_order)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category_id', category);
    }

    if (minPrice) {
      query = query.gte('base_price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('base_price', parseFloat(maxPrice));
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
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
      title,
      description,
      category_id,
      base_price,
      location,
      images,
      variants,
      addons,
      delivery_available,
      setup_available,
      min_rental_period,
      max_rental_period,
    } = body;

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        lender_id: user.id,
        title,
        description,
        category_id,
        base_price,
        location,
        delivery_available: delivery_available || false,
        setup_available: setup_available || false,
        min_rental_period: min_rental_period || 1,
        max_rental_period: max_rental_period || 30,
        status: 'active',
      })
      .select()
      .single();

    if (listingError) {
      return NextResponse.json({ error: listingError.message }, { status: 400 });
    }

    if (images && images.length > 0) {
      const imageInserts = images.map((url: string, index: number) => ({
        listing_id: listing.id,
        url,
        display_order: index,
      }));

      await supabase.from('listing_images').insert(imageInserts);
    }

    if (variants && variants.length > 0) {
      const variantInserts = variants.map((variant: any) => ({
        listing_id: listing.id,
        name: variant.name,
        description: variant.description,
        price_modifier: variant.price_modifier,
        stock_quantity: variant.stock_quantity,
      }));

      await supabase.from('listing_variants').insert(variantInserts);
    }

    if (addons && addons.length > 0) {
      const addonInserts = addons.map((addon: any) => ({
        listing_id: listing.id,
        name: addon.name,
        description: addon.description,
        price: addon.price,
      }));

      await supabase.from('listing_addons').insert(addonInserts);
    }

    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
