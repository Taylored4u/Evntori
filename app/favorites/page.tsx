'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, Heart, Package, MapPin, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { FavoriteButton } from '@/components/listing/favorite-button';
import { toast } from 'sonner';

export default function FavoritesPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/favorites');
      return;
    }

    if (profile) {
      fetchFavorites();
    }
  }, [profile, authLoading, router]);

  const fetchFavorites = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          listing:listings (
            id,
            title,
            description,
            base_price,
            pricing_type,
            status,
            listing_images (url, is_cover),
            categories (name),
            lender_profiles (
              business_name,
              rating_avg,
              city,
              state
            )
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-serif font-bold tracking-tight">
              KnotAgain
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/search" className="text-sm hover:text-primary transition">
                Browse
              </Link>
              <Link href="/favorites" className="text-sm hover:text-primary transition">
                Favorites
              </Link>
              <Button asChild size="sm" variant="outline">
                <Link href="/profile">My Account</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <div>
              <h1 className="text-3xl font-serif font-bold">My Favorites</h1>
              <p className="text-muted-foreground mt-1">
                {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>

          {favorites.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start browsing and click the heart icon on items you love to save them here
                </p>
                <Button asChild>
                  <Link href="/search">Browse Listings</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => {
                const listing = favorite.listing;
                if (!listing) return null;

                const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
                const lender = listing.lender_profiles;
                const isUnavailable = listing.status !== 'active';

                return (
                  <div key={favorite.id} className="relative">
                    <Link href={`/listing/${listing.id}`}>
                      <Card className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full ${isUnavailable ? 'opacity-60' : ''}`}>
                        <div className="aspect-[4/3] relative bg-secondary">
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

                          <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                            <div className="flex flex-col gap-2">
                              {listing.categories && (
                                <Badge variant="secondary" className="bg-background/80 backdrop-blur w-fit">
                                  {listing.categories.name}
                                </Badge>
                              )}
                              {isUnavailable && (
                                <Badge variant="destructive" className="bg-background/80 backdrop-blur w-fit">
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                            <div className="bg-background/80 backdrop-blur rounded-full">
                              <FavoriteButton listingId={listing.id} />
                            </div>
                          </div>
                        </div>

                        <CardHeader>
                          <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {listing.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">
                              ${listing.base_price}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              / {listing.pricing_type}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {lender?.city && lender?.state
                                  ? `${lender.city}, ${lender.state}`
                                  : lender?.business_name || 'Verified Lender'}
                              </span>
                            </div>
                            {lender?.rating_avg > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">
                                  {lender.rating_avg.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
