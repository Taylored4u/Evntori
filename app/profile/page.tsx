'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader as Loader2, Star, Shield, Calendar, Package } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { profile, loading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchBookings();
    }
  }, [profile]);

  const fetchBookings = async () => {
    if (!profile?.id) return;

    try {
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          listings (title, listing_images (url, is_cover))
        `)
        .eq('renter_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view your profile</p>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-serif">{profile.full_name}</CardTitle>
              <CardDescription className="mt-1">{profile.email}</CardDescription>
            </div>
            <Badge variant={profile.is_verified ? 'default' : 'secondary'}>
              {profile.is_verified ? (
                <>
                  <Shield className="mr-1 h-3 w-3" />
                  Verified
                </>
              ) : (
                'Unverified'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Member Since</span>
              </div>
              <p className="font-semibold">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="h-4 w-4" />
                <span className="text-sm">Role</span>
              </div>
              <p className="font-semibold capitalize">{profile.role}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Status</span>
              </div>
              <p className="font-semibold">
                {profile.is_verified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Account Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-medium">{profile.email}</dd>
              </div>
              {profile.phone && (
                <div>
                  <dt className="text-sm text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{profile.phone}</dd>
                </div>
              )}
            </dl>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/profile/settings">Edit Profile</Link>
            </Button>
            {profile.role === 'customer' && (
              <Button asChild>
                <Link href="/sell/onboarding">Become a Lender</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>Your recent rental reservations</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/search">Browse Rentals</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No bookings yet</p>
              <Button asChild>
                <Link href="/search">Find Rentals</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const listing = booking.listings as any;
                const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
                const statusColors: any = {
                  pending: 'secondary',
                  confirmed: 'default',
                  active: 'default',
                  completed: 'default',
                  cancelled: 'destructive',
                };

                return (
                  <Link key={booking.id} href={`/bookings/${booking.id}`}>
                    <div className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition cursor-pointer">
                      <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        {coverImage ? (
                          <img src={coverImage.url} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{listing.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(booking.start_date), 'MMM dd')} -{' '}
                          {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={statusColors[booking.status]} className="capitalize">
                          {booking.status}
                        </Badge>
                        <span className="font-bold text-sm">${booking.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {profile.role !== 'customer' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your listings and bookings</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href="/sell/listings">
                <div className="text-left">
                  <div className="font-semibold">Manage Listings</div>
                  <div className="text-sm text-muted-foreground">
                    View and edit your rental items
                  </div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href="/sell/bookings">
                <div className="text-left">
                  <div className="font-semibold">View Bookings</div>
                  <div className="text-sm text-muted-foreground">
                    Manage your rentals
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
