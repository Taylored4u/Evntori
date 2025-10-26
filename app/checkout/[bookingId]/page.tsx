'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader as Loader2, CreditCard, Shield, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.push('/auth/login');
      return;
    }
    fetchBooking();
  }, [profile, bookingId]);

  const fetchBooking = async () => {
    if (!profile?.id) return;

    try {
      const { data } = (await supabase
        .from('bookings')
        .select(`
          *,
          listings (
            *,
            listing_images (url, is_cover),
            categories (name),
            lender_profiles (business_name, stripe_account_id)
          ),
          listing_variants (name, sku),
          booking_add_ons (
            *,
            listing_add_ons (name, price)
          ),
          booking_deposits (
            *,
            deposits (amount, type, refundable)
          )
        `)
        .eq('id', bookingId)
        .eq('renter_id', profile.id)
        .single()) as any;

      if (data) {
        if (data.status === 'confirmed') {
          router.push(`/bookings/${bookingId}`);
          return;
        }
        setBooking(data);
      } else {
        toast.error('Booking not found');
        router.push('/search');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking');
      router.push('/search');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const listing = booking.listings;
  const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
  const deposit = booking.booking_deposits?.[0]?.deposits;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-serif font-bold tracking-tight">
            Evntori
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold mb-2">Secure Checkout</h1>
          <p className="text-muted-foreground">Complete your payment to confirm booking</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-24 h-24 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {coverImage ? (
                      <img src={coverImage.url} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{listing.title}</div>
                    <Badge variant="secondary">{listing.categories?.name}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rental Dates</span>
                    <span className="font-medium text-right">
                      {format(new Date(booking.start_date), 'MMM dd')} -{' '}
                      {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium">{booking.quantity}</span>
                  </div>
                  {booking.listing_variants && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variant</span>
                      <span className="font-medium">{booking.listing_variants.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lender</span>
                    <span className="font-medium">{listing.lender_profiles.business_name}</span>
                  </div>
                </div>

                {booking.booking_add_ons?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="font-semibold mb-2 text-sm">Add-On Services</div>
                      <div className="space-y-1">
                        {booking.booking_add_ons.map((ba: any) => (
                          <div key={ba.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {ba.listing_add_ons.name}
                            </span>
                            <span>${ba.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Secure Payment:</strong> Your payment is processed securely through Stripe.
                {deposit && ` The ${deposit.amount} security deposit will be held and refunded after rental completion.`}
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cancellation Policy:</strong> {listing.cancellation_policy === 'flexible' && 'Full refund 24 hours before'}
                {listing.cancellation_policy === 'moderate' && 'Full refund 7 days before'}
                {listing.cancellation_policy === 'strict' && '50% refund 14 days before'}
              </AlertDescription>
            </Alert>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Rental</span>
                    <span>${booking.base_price.toFixed(2)}</span>
                  </div>

                  {booking.booking_add_ons?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Add-Ons</span>
                      <span>
                        $
                        {booking.booking_add_ons
                          .reduce((sum: number, ba: any) => sum + ba.price, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}

                  {deposit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Security Deposit
                      </span>
                      <span>${deposit.amount}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span>${booking.total_price.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay ${booking.total_price.toFixed(2)}
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>By completing this booking, you agree to the rental terms and conditions.</p>
                  {deposit && (
                    <p className="flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3" />
                      Security deposit is {deposit.refundable ? 'refundable' : 'non-refundable'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
