'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader as Loader2, Calendar as CalendarIcon, Package, Shield, CreditCard, CircleAlert as AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { addDays, differenceInDays, differenceInHours, differenceInWeeks, isSameDay } from 'date-fns';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const listingId = params.listingId as string;

  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  useEffect(() => {
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const { data } = (await supabase
        .from('listings')
        .select(`
          *,
          listing_images (url, is_cover),
          listing_variants (*),
          listing_add_ons (*),
          listing_availability (*),
          categories (name),
          lender_profiles (business_name, stripe_account_id),
          deposits (*)
        `)
        .eq('id', listingId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single()) as any;

      if (data) {
        setListing(data);

        const blocked = (data.listing_availability || [])
          .filter((avail: any) => !avail.is_available)
          .map((avail: any) => new Date(avail.date));
        setBlockedDates(blocked);

        const requiredAddOns = (data.listing_add_ons || [])
          .filter((addOn: any) => addOn.is_required)
          .map((addOn: any) => addOn.id);
        setSelectedAddOns(requiredAddOns);
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

  const calculateDuration = () => {
    if (!startDate || !endDate) return 0;

    switch (listing.pricing_type) {
      case 'hourly':
        return Math.max(1, differenceInHours(endDate, startDate));
      case 'weekly':
        return Math.max(1, Math.ceil(differenceInWeeks(endDate, startDate)));
      default:
        return Math.max(1, differenceInDays(endDate, startDate) + 1);
    }
  };

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;

    const duration = calculateDuration();
    let total = listing.base_price * duration * quantity;

    if (selectedVariant) {
      const variant = listing.listing_variants.find((v: any) => v.id === selectedVariant);
      if (variant) {
        total += variant.price_adjustment * duration * quantity;
      }
    }

    selectedAddOns.forEach(addOnId => {
      const addOn = listing.listing_add_ons.find((a: any) => a.id === addOnId);
      if (addOn) {
        total += addOn.price * quantity;
      }
    });

    const deposit = listing.deposits?.[0];
    if (deposit) {
      total += deposit.amount;
    }

    return total;
  };

  const handleAddOnToggle = (addOnId: string, isRequired: boolean) => {
    if (isRequired) return;

    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleCheckout = async () => {
    if (!profile) {
      toast.error('Please sign in to book');
      router.push(`/auth/login?redirect=/booking/${listingId}`);
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select rental dates');
      return;
    }

    const duration = calculateDuration();
    if (duration < listing.min_rental_duration) {
      toast.error(`Minimum rental duration is ${listing.min_rental_duration} ${listing.pricing_type}s`);
      return;
    }

    if (listing.max_rental_duration && duration > listing.max_rental_duration) {
      toast.error(`Maximum rental duration is ${listing.max_rental_duration} ${listing.pricing_type}s`);
      return;
    }

    if (quantity > listing.quantity_available) {
      toast.error(`Only ${listing.quantity_available} available`);
      return;
    }

    setIsProcessing(true);

    try {
      const variant = selectedVariant
        ? listing.listing_variants.find((v: any) => v.id === selectedVariant)
        : null;

      const addOns = listing.listing_add_ons.filter((a: any) =>
        selectedAddOns.includes(a.id)
      );

      const { data: booking, error: bookingError } = (await supabase
        .from('bookings')
        .insert({
          listing_id: listingId,
          renter_id: profile.id,
          lender_id: listing.lender_profiles.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          quantity,
          variant_id: selectedVariant,
          status: 'pending',
          total_price: calculateTotal(),
          base_price: listing.base_price * calculateDuration() * quantity,
        } as any)
        .select()
        .single()) as any;

      if (bookingError || !booking) {
        throw new Error('Failed to create booking');
      }

      if (addOns.length > 0) {
        const bookingAddOns = addOns.map((addOn: any) => ({
          booking_id: booking.id,
          add_on_id: addOn.id,
          quantity,
          price: addOn.price,
        }));
        await supabase.from('booking_add_ons').insert(bookingAddOns as any);
      }

      const deposit = listing.deposits?.[0];
      if (deposit) {
        await supabase.from('booking_deposits').insert({
          booking_id: booking.id,
          deposit_id: deposit.id,
          amount: deposit.amount,
          status: 'pending',
        } as any);
      }

      toast.success('Booking created! Redirecting to checkout...');
      router.push(`/checkout/${booking.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
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

  if (!listing) {
    return null;
  }

  const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
  const variants = listing.listing_variants || [];
  const addOns = listing.listing_add_ons || [];
  const deposit = listing.deposits?.[0];
  const duration = calculateDuration();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-serif font-bold tracking-tight">
              Evntori
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/listing/${listingId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Listing
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-serif font-bold mb-8">Complete Your Booking</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Rental Dates
                </CardTitle>
                <CardDescription>
                  Choose your start and end dates (minimum {listing.min_rental_duration}{' '}
                  {listing.pricing_type}s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="range"
                    selected={{ from: startDate, to: endDate }}
                    onSelect={(range: any) => {
                      setStartDate(range?.from);
                      setEndDate(range?.to);
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      return blockedDates.some(blocked => isSameDay(blocked, date));
                    }}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </div>

                {startDate && endDate && duration > 0 && (
                  <div className="mt-4 p-4 bg-secondary rounded-lg">
                    <div className="text-sm">
                      <div className="font-semibold mb-2">Rental Duration</div>
                      <div className="text-muted-foreground">
                        {duration} {listing.pricing_type}{duration > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Quantity & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={listing.quantity_available}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {listing.quantity_available} available
                  </p>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Variant (Optional)</Label>
                    <RadioGroup value={selectedVariant || 'none'} onValueChange={(value) => setSelectedVariant(value === 'none' ? null : value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none" className="cursor-pointer">Standard (no variant)</Label>
                      </div>
                      {variants.map((variant: any) => (
                        <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={variant.id} id={variant.id} />
                            <Label htmlFor={variant.id} className="cursor-pointer">
                              <div className="font-medium">{variant.name}</div>
                              {variant.sku && (
                                <div className="text-xs text-muted-foreground">SKU: {variant.sku}</div>
                              )}
                            </Label>
                          </div>
                          <Badge variant={variant.price_adjustment >= 0 ? 'default' : 'secondary'}>
                            {variant.price_adjustment >= 0 ? '+' : ''}${variant.price_adjustment} / {listing.pricing_type}
                          </Badge>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {addOns.length > 0 && (
                  <div className="space-y-2">
                    <Label>Add-On Services</Label>
                    <div className="space-y-2">
                      {addOns.map((addOn: any) => (
                        <div key={addOn.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id={addOn.id}
                              checked={selectedAddOns.includes(addOn.id)}
                              onCheckedChange={() => handleAddOnToggle(addOn.id, addOn.is_required)}
                              disabled={addOn.is_required}
                            />
                            <Label htmlFor={addOn.id} className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{addOn.name}</span>
                                {addOn.is_required && (
                                  <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                              </div>
                              {addOn.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {addOn.description}
                                </div>
                              )}
                            </Label>
                          </div>
                          <Badge>${addOn.price}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!profile && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please{' '}
                  <Link href={`/auth/login?redirect=/booking/${listingId}`} className="underline font-medium">
                    sign in
                  </Link>{' '}
                  to complete your booking
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {coverImage ? (
                      <img src={coverImage.url} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold line-clamp-2">{listing.title}</div>
                    <div className="text-sm text-muted-foreground">{listing.categories?.name}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span>${listing.base_price} / {listing.pricing_type}</span>
                  </div>

                  {duration > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{duration} {listing.pricing_type}{duration > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity</span>
                        <span>×{quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${(listing.base_price * duration * quantity).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {selectedVariant && (() => {
                    const variant = variants.find((v: any) => v.id === selectedVariant);
                    return variant && duration > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{variant.name}</span>
                        <span>${(variant.price_adjustment * duration * quantity).toFixed(2)}</span>
                      </div>
                    ) : null;
                  })()}

                  {selectedAddOns.map(addOnId => {
                    const addOn = addOns.find((a: any) => a.id === addOnId);
                    return addOn ? (
                      <div key={addOn.id} className="flex justify-between">
                        <span className="text-muted-foreground">{addOn.name}</span>
                        <span>${(addOn.price * quantity).toFixed(2)}</span>
                      </div>
                    ) : null;
                  })}

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

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!startDate || !endDate || isProcessing || !profile}
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Checkout
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  {deposit && `Deposit will be refunded after rental completion. `}
                  Cancellation policy: {listing.cancellation_policy}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
