'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader as Loader2, Plus, Search, CreditCard as Edit, Eye, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ListingsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchListings();
  }, [profile]);

  const fetchListings = async () => {
    if (!profile) return;

    try {
      const { data: lender } = (await supabase
        .from('lender_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single()) as any;

      if (!lender) return;

      const { data } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images (url, is_cover),
          categories (name)
        `)
        .eq('lender_id', lender.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      await (supabase
        .from('listings')
        .update as any)({
        deleted_at: new Date().toISOString(),
        status: 'inactive',
      })
        .eq('id', listingId);

      toast.success('Listing deleted successfully');
      fetchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const toggleStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      await (supabase
        .from('listings')
        .update as any)({ status: newStatus })
        .eq('id', listingId);

      toast.success(`Listing ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
    }
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">My Listings</h1>
            <p className="text-muted-foreground">
              Manage your rental inventory
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/sell/listings/new">
              <Plus className="mr-2 h-5 w-5" />
              Create Listing
            </Link>
          </Button>
        </div>

        {listings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first listing to start renting out your items
              </p>
              <Button asChild>
                <Link href="/sell/listings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Listing
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => {
                const coverImage = listing.listing_images?.find((img: any) => img.is_cover);

                return (
                  <Card key={listing.id} className="overflow-hidden">
                    <div className="aspect-video relative bg-secondary">
                      {coverImage ? (
                        <img
                          src={coverImage.url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={listing.status === 'active' ? 'default' : 'secondary'}
                        >
                          {listing.status}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {listing.categories?.name}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          ${listing.base_price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {listing.pricing_type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>{' '}
                          {listing.quantity_available}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Views:</span>{' '}
                          {listing.views_count}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bookings:</span>{' '}
                          {listing.booking_count}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rating:</span>{' '}
                          {listing.rating_avg > 0 ? `${listing.rating_avg}/5` : 'No ratings'}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/listing/${listing.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/sell/listings/${listing.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatus(listing.id, listing.status)}
                        >
                          {listing.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
