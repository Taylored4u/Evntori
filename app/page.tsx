'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Sparkles, Package, Star, MapPin, ArrowRight, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function Home() {
  const router = useRouter();
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedListings();
    fetchCategories();
  }, []);

  const fetchFeaturedListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select(`
        *,
        listing_images (url, is_cover),
        categories (name),
        lender_profiles (
          business_name,
          rating_avg,
          user_id,
          profiles!lender_profiles_user_id_fkey (
            addresses (city, state)
          )
        )
      `)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('booking_count', { ascending: false })
      .limit(6);

    setFeaturedListings(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
      .limit(8);

    setCategories(data || []);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
          </div>

          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-wide mb-6 leading-tight">
              Luxury Event<br />Rentals
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-light mb-12 max-w-3xl mx-auto leading-relaxed text-white/90">
              Curated collection of premium event decor and furniture. Create unforgettable moments without the premium price
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-white/90 text-base px-8 py-6 h-auto"
              >
                <Link href="/search" className="flex items-center gap-2">
                  Explore Collection
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white bg-white/95 text-black hover:bg-white backdrop-blur-sm text-base px-8 py-6 h-auto"
              >
                <Link href="#story" className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Watch Story
                </Link>
              </Button>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
              <div className="w-px h-12 bg-white/50" />
            </div>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="py-20 px-4 bg-white">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-light tracking-wide mb-4">Browse by Category</h2>
                <div className="w-24 h-px bg-primary mx-auto" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/search?category=${category.id}`}
                    className="group"
                  >
                    <div className="relative h-48 overflow-hidden rounded-lg">
                      <div className="absolute inset-0 bg-secondary group-hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-12 w-12 text-white/80 mb-2 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                        <h4 className="text-white font-light text-lg tracking-wide">{category.name}</h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {featuredListings.length > 0 && (
          <section className="py-20 px-4 bg-secondary/5">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-light tracking-wide mb-4">Featured Collection</h2>
                <div className="w-24 h-px bg-primary mx-auto mb-6" />
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Discover our most sought-after pieces for your special day
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {featuredListings.map((listing) => {
                  const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
                  const lender = listing.lender_profiles;
                  return (
                    <Link key={listing.id} href={`/listing/${listing.id}`} className="group">
                      <div className="overflow-hidden rounded-lg">
                        <div className="aspect-[4/3] relative bg-secondary overflow-hidden">
                          {coverImage ? (
                            <img
                              src={coverImage.url}
                              alt={listing.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-4 right-4">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                              {listing.categories?.name}
                            </Badge>
                          </div>
                        </div>
                        <div className="pt-4 space-y-2">
                          <h3 className="text-xl font-light tracking-wide line-clamp-1">{listing.title}</h3>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-light">${listing.base_price}</span>
                            <span className="text-sm text-muted-foreground">/ {listing.pricing_type}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-2">
                            {lender?.profiles?.addresses?.[0]?.city && lender?.profiles?.addresses?.[0]?.state && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{lender.profiles.addresses[0].city}, {lender.profiles.addresses[0].state}</span>
                              </div>
                            )}
                            {lender?.rating_avg > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">
                                  {lender.rating_avg.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="text-center">
                <Button asChild size="lg" variant="outline" className="px-8">
                  <Link href="/search">View All Rentals</Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        <section className="py-24 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light tracking-wide mb-4">Why Choose Evntori</h2>
              <div className="w-24 h-px bg-primary mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/5 mb-6">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-light tracking-wide mb-3">Curated Collection</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every item is carefully selected and vetted to ensure exceptional quality and timeless elegance for your celebration.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/5 mb-6">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-light tracking-wide mb-3">Secure & Protected</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All transactions are protected with secure payments, insurance coverage, and deposits held until completion.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/5 mb-6">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-light tracking-wide mb-3">White Glove Service</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Seamless booking experience with dedicated support, ensuring every detail is perfect for your special day.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-32 px-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=2070)',
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 container mx-auto max-w-4xl text-center text-white">
            <h2 className="text-4xl md:text-5xl font-light tracking-wide mb-6">Ready to Create Magic?</h2>
            <p className="text-lg md:text-xl font-light mb-10 text-white/90 max-w-2xl mx-auto">
              Join thousands of couples and lenders creating unforgettable moments on Evntori.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 px-8">
                <Link href="/search">Browse Collection</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm px-8">
                <Link href="/sell/onboarding">Become a Lender</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
