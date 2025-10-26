import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        lender:profiles!listings_lender_id_fkey(
          id,
          full_name,
          avatar_url,
          rating,
          total_reviews
        ),
        category:categories(id, name, slug),
        images:listing_images(id, url, display_order),
        variants:listing_variants(*),
        addons:listing_addons(*),
        reviews:reviews(
          id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('id', params.id)
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

    const { data: existingListing } = await supabase
      .from('listings')
      .select('lender_id')
      .eq('id', params.id)
      .single();

    if (!existingListing || existingListing.lender_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { images, variants, addons, ...listingData } = body;

    const { data: listing, error: updateError } = await supabase
      .from('listings')
      .update(listingData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    if (images) {
      await supabase
        .from('listing_images')
        .delete()
        .eq('listing_id', params.id);

      if (images.length > 0) {
        const imageInserts = images.map((url: string, index: number) => ({
          listing_id: params.id,
          url,
          display_order: index,
        }));

        await supabase.from('listing_images').insert(imageInserts);
      }
    }

    if (variants) {
      await supabase
        .from('listing_variants')
        .delete()
        .eq('listing_id', params.id);

      if (variants.length > 0) {
        const variantInserts = variants.map((variant: any) => ({
          listing_id: params.id,
          name: variant.name,
          description: variant.description,
          price_modifier: variant.price_modifier,
          stock_quantity: variant.stock_quantity,
        }));

        await supabase.from('listing_variants').insert(variantInserts);
      }
    }

    if (addons) {
      await supabase
        .from('listing_addons')
        .delete()
        .eq('listing_id', params.id);

      if (addons.length > 0) {
        const addonInserts = addons.map((addon: any) => ({
          listing_id: params.id,
          name: addon.name,
          description: addon.description,
          price: addon.price,
        }));

        await supabase.from('listing_addons').insert(addonInserts);
      }
    }

    return NextResponse.json({ data: listing }, { status: 200 });
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

    const { data: existingListing } = await supabase
      .from('listings')
      .select('lender_id')
      .eq('id', params.id)
      .single();

    if (!existingListing || existingListing.lender_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('listings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Listing deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
