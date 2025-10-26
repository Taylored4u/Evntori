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
import { Loader as Loader2, Package, Calendar, User, Mail, Phone, DollarSign, Shield, CircleCheck as CheckCircle, Circle as XCircle, ArrowLeft, Clock, TriangleAlert as AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format, isPast, isFuture } from 'date-fns';

export default function LenderBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchBooking();
    }
  }, [profile, bookingId]);

  const fetchBooking = async () => {
    if (!profile?.id) return;

    try {
      const { data: lenderProfile } = (await supabase
        .from('lender_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single()) as any;

      if (!lenderProfile) {
        router.push('/sell/bookings');
        return;
      }

      const { data } = (await supabase
        .from('bookings')
        .select(`
          *,
          listings (
            *,
            listing_images (url, is_cover),
            categories (name)
          ),
          profiles!bookings_renter_id_fkey (
            full_name,
            email,
            phone
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
        .eq('lender_id', lenderProfile.id)
        .single()) as any;

      if (data) {
        setBooking(data);
      } else {
        toast.error('Booking not found');
        router.push('/sell/bookings');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking');
      router.push('/sell/bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBooking = async () => {
    setIsProcessing(true);
    try {
      const { error } = await (supabase
        .from('bookings')
        .update as any)({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking accepted! The renter has been notified.');
      fetchBooking();
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast.error('Failed to accept booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!confirm('Are you sure you want to reject this booking? This cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await (supabase
        .from('bookings')
        .update as any)({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking rejected. The renter will be refunded.');
      fetchBooking();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Failed to reject booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsActive = async () => {
    setIsProcessing(true);
    try {
      const { error } = await (supabase
        .from('bookings')
        .update as any)({
        status: 'active',
      })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking marked as active');
      fetchBooking();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!confirm('Mark this booking as completed? The security deposit will be processed.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await (supabase
        .from('bookings')
        .update as any)({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
        .eq('id', bookingId);

      if (error) throw error;

      if (booking.booking_deposits?.length > 0) {
        await (supabase
          .from('booking_deposits')
          .update as any)({ status: 'refunded' })
          .eq('booking_id', bookingId);
      }

      toast.success('Booking completed! Deposit has been refunded to renter.');
      fetchBooking();
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete booking');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const listing = booking.listings;
  const renter = booking.profiles;
  const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
  const deposit = booking.booking_deposits?.[0]?.deposits;
  const yourEarnings = booking.total_price * 0.9;
  const platformFee = booking.total_price * 0.1;

  const statusColors: any = {
    pending: 'secondary',
    confirmed: 'default',
    active: 'default',
    completed: 'default',
    cancelled: 'destructive',
  };

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const isUpcoming = isFuture(startDate);
  const isPastDue = isPast(endDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href="/sell/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-bold">Booking Details</h1>
          <p className="text-muted-foreground">ID: {bookingId.slice(0, 8)}</p>
        </div>
        <Badge variant={statusColors[booking.status]} className="text-sm px-4 py-2 capitalize">
          {booking.status}
        </Badge>
      </div>

      {booking.status === 'pending' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Action Required:</strong> This booking is awaiting your confirmation. Please review and accept or reject.
          </AlertDescription>
        </Alert>
      )}

      {booking.status === 'confirmed' && isUpcoming && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Confirmed:</strong> Rental starts on {format(startDate, 'MMMM dd, yyyy')}. Coordinate pickup/delivery with the renter.
          </AlertDescription>
        </Alert>
      )}

      {booking.status === 'active' && isPastDue && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Past Due:</strong> This rental period has ended. Please mark as completed once item is returned.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-32 h-32 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                  {coverImage ? (
                    <img src={coverImage.url} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                  <Badge variant="secondary" className="mb-2">{listing.categories?.name}</Badge>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Quantity: {booking.quantity}</div>
                    {booking.listing_variants && <div>Variant: {booking.listing_variants.name}</div>}
                    <div>Base Price: ${listing.base_price} / {listing.pricing_type}</div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/sell/listings/${listing.id}/edit`}>View Listing</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rental Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Start Date</div>
                  <div className="font-medium">{format(startDate, 'MMMM dd, yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">End Date</div>
                  <div className="font-medium">{format(endDate, 'MMMM dd, yyyy')}</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {booking.created_at && (
                  <div>
                    <span className="text-muted-foreground">Booked:</span>{' '}
                    <span className="font-medium">{format(new Date(booking.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {booking.confirmed_at && (
                  <div>
                    <span className="text-muted-foreground">Confirmed:</span>{' '}
                    <span className="font-medium">{format(new Date(booking.confirmed_at), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Renter Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{renter.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${renter.email}`} className="text-primary hover:underline">
                    {renter.email}
                  </a>
                </div>
                {renter.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${renter.phone}`} className="text-primary hover:underline">
                      {renter.phone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {booking.booking_add_ons?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Add-On Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {booking.booking_add_ons.map((ba: any) => (
                    <div key={ba.id} className="flex justify-between">
                      <span>{ba.listing_add_ons.name}</span>
                      <span className="font-medium">${ba.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Total</span>
                  <span>${booking.total_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee (10%)</span>
                  <span>-${platformFee.toFixed(2)}</span>
                </div>
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
                <span>Your Earnings</span>
                <span className="text-green-600">${yourEarnings.toFixed(2)}</span>
              </div>

              {booking.status === 'completed' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Payment has been processed and will be transferred to your Stripe account.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {booking.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleAcceptBooking}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Accept Booking
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleRejectBooking}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject Booking
                </Button>
              </CardContent>
            </Card>
          )}

          {booking.status === 'confirmed' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={handleMarkAsActive}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark as Active
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Mark as active once the item has been picked up or delivered
                </p>
              </CardContent>
            </Card>
          )}

          {booking.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={handleMarkAsCompleted}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark as Completed
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Complete the booking once the item has been returned in good condition
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
