'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader as Loader2, Star, MapPin, Package, Shield, Calendar, Clock, DollarSign, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { ReviewList } from '@/components/reviews/review-list';
import { useAuth } from '@/lib/auth/context';
import { toast } from 'sonner';
import { FavoriteButton } from '@/components/listing/favorite-button';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const listingId = params.id as string;
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const { data } = (await supabase
        .from('listings')
        .select(`
          *,
          listing_images (*),
          listing_variants (*),
          listing_add_ons (*),
          categories (name, slug),
          lender_profiles (business_name, business_description, rating_avg, rating_count, total_bookings),
          deposits (*)
        `)
        .eq('id', listingId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single()) as any;

      if (data) {
        setListing(data);

        await (supabase
          .from('listings')
          .update as any)({ views_count: (data.views_count || 0) + 1 })
          .eq('id', listingId);
      } else {
        router.push('/search');
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      router.push('/search');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const images = listing.listing_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const currentImage = images[currentImageIndex];
  const variants = listing.listing_variants || [];
  const addOns = listing.listing_add_ons || [];
  const deposit = listing.deposits?.[0];
  const lender = listing.lender_profiles;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleContactLender = async () => {
    if (!profile) {
      router.push(`/auth/login?redirect=/listing/${listingId}`);
      return;
    }

    if (profile.id === listing.lender_id) {
      toast.error("You can't message yourself");
      return;
    }

    setIsStartingConversation(true);
    try {
      const { data: existingConversation } = (await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1_id.eq.${profile.id},participant_2_id.eq.${listing.lender_id},listing_id.eq.${listingId}),and(participant_1_id.eq.${listing.lender_id},participant_2_id.eq.${profile.id},listing_id.eq.${listingId})`
        )
        .maybeSingle()) as any;

      if (existingConversation) {
        router.push(`/messages?conversation=${existingConversation.id}`);
        return;
      }

      const { data: newConversation, error } = (await (supabase as any)
        .from('conversations')
        .insert({
          participant_1_id: profile.id,
          participant_2_id: listing.lender_id,
          listing_id: listingId,
        })
        .select()
        .single()) as any;

      if (error) throw error;

      router.push(`/messages?conversation=${newConversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setIsStartingConversation(false);
    }
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const cancellationPolicyText = {
    flexible: 'Full refund 24 hours before the event',
    moderate: 'Full refund 7 days before the event',
    strict: '50% refund 14 days before the event',
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <span className="text-foreground">evnt</span>
                <span className="text-primary">o</span>
                <span className="text-foreground">ri</span>
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/search" className="text-sm hover:text-primary transition">
                Browse
              </Link>
              <Link href="/sell" className="text-sm hover:text-primary transition">
                Become a Lender
              </Link>
              <Button asChild size="sm">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/search">
              ← Back to Search
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="relative aspect-square bg-secondary rounded-lg overflow-hidden">
              {currentImage ? (
                <>
                  <img
                    src={currentImage.url}
                    alt={currentImage.alt_text}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur hover:bg-background rounded-full p-2 transition"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur hover:bg-background rounded-full p-2 transition"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((img: any, index: number) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                      currentImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt_text}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <Badge>{listing.categories?.name}</Badge>
                <FavoriteButton listingId={listing.id} variant="default" size="default" />
              </div>
              <h1 className="text-4xl font-serif font-bold mb-2">{listing.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {lender?.business_name}
                </div>
                {lender?.rating_avg > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {lender.rating_avg.toFixed(1)}
                    </span>
                    <span>({lender.rating_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold">${listing.base_price}</span>
                <span className="text-xl text-muted-foreground">/ {listing.pricing_type}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="font-medium">Min. {listing.min_rental_duration}</div>
                    <div className="text-muted-foreground">{listing.pricing_type}s</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="font-medium">{listing.quantity_available} available</div>
                    <div className="text-muted-foreground">In stock</div>
                  </div>
                </div>
              </div>

              {deposit && (
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <div className="text-sm">
                    <span className="font-medium">${deposit.amount}</span> refundable security deposit
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/booking/${listing.id}`}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Check Availability & Book
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={handleContactLender}
                  disabled={isStartingConversation}
                >
                  {isStartingConversation ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Contact Lender
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Protection & Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancellation Policy:</span>
                  <span className="font-medium capitalize">{listing.cancellation_policy}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {cancellationPolicyText[listing.cancellation_policy as keyof typeof cancellationPolicyText]}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="description" className="max-w-4xl">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            {variants.length > 0 && <TabsTrigger value="variants">Variants</TabsTrigger>}
            {addOns.length > 0 && <TabsTrigger value="addons">Add-Ons</TabsTrigger>}
            <TabsTrigger value="lender">About Lender</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Item Description</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="whitespace-pre-wrap">{listing.description}</p>
                {listing.condition && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Condition</h4>
                    <p>{listing.condition}</p>
                  </div>
                )}
                {listing.replacement_value && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Replacement Value</h4>
                    <p>${listing.replacement_value}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {variants.length > 0 && (
            <TabsContent value="variants" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Variants</CardTitle>
                  <CardDescription>Choose from different options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {variants.map((variant: any) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-semibold">{variant.name}</div>
                          {variant.sku && (
                            <div className="text-xs text-muted-foreground">SKU: {variant.sku}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={variant.price_adjustment >= 0 ? 'default' : 'secondary'}>
                            {variant.price_adjustment >= 0 ? '+' : ''}${variant.price_adjustment}
                          </Badge>
                          <Badge variant="outline">{variant.quantity} available</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {addOns.length > 0 && (
            <TabsContent value="addons" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Add-On Services</CardTitle>
                  <CardDescription>Optional services to enhance your rental</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {addOns.map((addOn: any) => (
                      <div
                        key={addOn.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold">{addOn.name}</div>
                            {addOn.is_required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                          </div>
                          {addOn.description && (
                            <div className="text-sm text-muted-foreground">{addOn.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {addOn.type && (
                            <Badge variant="outline" className="capitalize">
                              {addOn.type}
                            </Badge>
                          )}
                          <Badge className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {addOn.price}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="lender" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{lender?.business_name}</CardTitle>
                {lender?.rating_avg > 0 && (
                  <CardDescription className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{lender.rating_avg.toFixed(1)}</span>
                    <span>({lender.rating_count} reviews)</span>
                    <span className="ml-2">·</span>
                    <span>{lender.total_bookings} completed rentals</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{lender?.business_description}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ReviewList listingId={listingId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
