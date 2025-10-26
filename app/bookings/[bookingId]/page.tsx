'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader as Loader2, Package, Calendar, MapPin, Mail, Phone, DollarSign, Shield, CircleCheck as CheckCircle, ArrowLeft, Circle as XCircle, Clock, Store, Download, Star } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format, isPast, isFuture, differenceInDays } from 'date-fns';
import { ReviewForm } from '@/components/reviews/review-form';
import { PaymentSummary } from '@/components/payments/payment-summary';
import { PaymentTimeline } from '@/components/payments/payment-timeline';
import { RefundRequestDialog } from '@/components/payments/refund-request-dialog';

export default function CustomerBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [refunds, setRefunds] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchBooking();
    }
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
            categories (name)
          ),
          lender_profiles (
            *,
            profiles (
              full_name,
              email,
              phone
            )
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
        setBooking(data);

        const { data: reviewData } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', bookingId)
          .single();

        setHasReview(!!reviewData);

        const { data: refundData } = await supabase
          .from('refunds')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false });

        if (refundData) {
          setRefunds(refundData);
        }
      } else {
        toast.error('Booking not found');
        router.push('/bookings');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking');
      router.push('/bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking? You will receive a full refund if cancelled at least 48 hours before the start date.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const startDate = new Date(booking.start_date);
      const daysUntilStart = differenceInDays(startDate, new Date());
      const isFullRefund = daysUntilStart >= 2;

      const { error } = await (supabase
        .from('bookings')
        .update as any)({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(
        isFullRefund
          ? 'Booking cancelled successfully. You will receive a full refund.'
          : 'Booking cancelled. Refund may be partial due to late cancellation.'
      );
      fetchBooking();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
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
  const lender = booking.lender_profiles;
  const lenderUser = lender?.profiles;
  const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
  const deposit = booking.booking_deposits?.[0]?.deposits;

  const statusColors: any = {
    pending: 'secondary',
    confirmed: 'default',
    active: 'default',
    completed: 'default',
    cancelled: 'destructive',
  };

  const statusLabels: any = {
    pending: 'Awaiting Confirmation',
    confirmed: 'Confirmed',
    active: 'Active Rental',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const isUpcoming = isFuture(startDate);
  const canCancel = booking.status === 'pending' || (booking.status === 'confirmed' && isUpcoming);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href="/bookings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bookings
              </Link>
            </Button>
            <h1 className="text-3xl font-serif font-bold">Booking Details</h1>
            <p className="text-muted-foreground">Confirmation #{bookingId.slice(0, 8).toUpperCase()}</p>
          </div>
          <Badge variant={statusColors[booking.status]} className="text-sm px-4 py-2">
            {statusLabels[booking.status]}
          </Badge>
        </div>

        {booking.status === 'pending' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Awaiting Confirmation</AlertTitle>
            <AlertDescription className="text-yellow-800">
              The lender is reviewing your booking request. You'll be notified once they confirm.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'confirmed' && isUpcoming && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Booking Confirmed!</AlertTitle>
            <AlertDescription className="text-green-800">
              Your rental starts on {format(startDate, 'MMMM dd, yyyy')}. The lender will contact you about pickup/delivery.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'active' && (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertTitle>Active Rental</AlertTitle>
            <AlertDescription>
              Please return the item by {format(endDate, 'MMMM dd, yyyy')} to receive your security deposit refund.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Rental Completed</AlertTitle>
            <AlertDescription className="text-green-800">
              Thank you for renting with us! Your security deposit has been refunded.
            </AlertDescription>
          </Alert>
        )}

        {booking.status === 'cancelled' && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Booking Cancelled</AlertTitle>
            <AlertDescription className="text-red-800">
              This booking has been cancelled. Refund processing may take 5-7 business days.
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
                      <div>Price: ${listing.base_price} / {listing.pricing_type}</div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link href={`/listing/${listing.id}`}>View Listing</Link>
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
                    <div className="text-sm text-muted-foreground mb-1">Pickup Date</div>
                    <div className="font-medium">{format(startDate, 'MMMM dd, yyyy')}</div>
                    <div className="text-sm text-muted-foreground">{format(startDate, 'EEEE')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Return Date</div>
                    <div className="font-medium">{format(endDate, 'MMMM dd, yyyy')}</div>
                    <div className="text-sm text-muted-foreground">{format(endDate, 'EEEE')}</div>
                  </div>
                </div>
                <Separator />
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Days:</span>{' '}
                  <span className="font-medium">{differenceInDays(endDate, startDate) + 1} days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Lender Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Business Name</div>
                  <div className="font-medium">{lender.business_name}</div>
                </div>
                {lender.business_description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">About</div>
                    <div className="text-sm">{lender.business_description}</div>
                  </div>
                )}
                {lender.rating_avg > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{lender.rating_avg.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({lender.rating_count} reviews)</span>
                  </div>
                )}
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Contact</div>
                  <div className="space-y-2">
                    {lenderUser?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${lenderUser.email}`} className="text-primary hover:underline">
                          {lenderUser.email}
                        </a>
                      </div>
                    )}
                    {lenderUser?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${lenderUser.phone}`} className="text-primary hover:underline">
                          {lenderUser.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                {lender.address && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                      <div className="text-sm">
                        {lender.address}, {lender.city}, {lender.state} {lender.zip_code}
                      </div>
                    </div>
                  </>
                )}
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
            <PaymentSummary booking={booking} refunds={refunds} />

            <PaymentTimeline booking={booking} refunds={refunds} />

            {booking.payment_status === 'paid' && booking.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Refund</CardTitle>
                  <CardDescription>
                    Submit a refund request if you need to cancel or have issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RefundRequestDialog
                    bookingId={bookingId}
                    totalAmount={booking.total_price}
                    depositAmount={booking.deposit_amount || 0}
                    onSuccess={() => {
                      fetchBooking();
                      toast.success('Refund request submitted');
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {canCancel && (
              <Card>
                <CardHeader>
                  <CardTitle>Cancel Booking</CardTitle>
                  <CardDescription>
                    {differenceInDays(startDate, new Date()) >= 2
                      ? 'Free cancellation available'
                      : 'Cancellation may result in partial refund'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Booking
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cancel at least 48 hours before start date for full refund
                  </p>
                </CardContent>
              </Card>
            )}

            {booking.status === 'completed' && !hasReview && !showReviewForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Leave a Review</CardTitle>
                  <CardDescription>Share your rental experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setShowReviewForm(true)}>
                    <Star className="mr-2 h-4 w-4" />
                    Write Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {booking.status === 'completed' && hasReview && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Submitted</CardTitle>
                  <CardDescription>Thank you for your feedback!</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>You have already reviewed this booking</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {showReviewForm && booking.status === 'completed' && !hasReview && (
          <div className="mt-6">
            <ReviewForm
              bookingId={bookingId}
              listingId={booking.listing_id}
              listingTitle={listing.title}
              reviewerId={profile!.id}
              onSuccess={() => {
                setShowReviewForm(false);
                setHasReview(true);
                toast.success('Review submitted successfully!');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
