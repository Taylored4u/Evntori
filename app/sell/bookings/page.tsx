'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader as Loader2, Package, Search, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function LenderBookingsPage() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    activeBookings: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (profile) {
      fetchBookings();
    }
  }, [profile]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    if (!profile?.id) return;

    try {
      const { data: lenderProfile } = (await supabase
        .from('lender_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single()) as any;

      if (!lenderProfile) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          listings (
            title,
            base_price,
            listing_images (url, is_cover)
          ),
          profiles!bookings_renter_id_fkey (
            full_name,
            email,
            phone
          )
        `)
        .eq('lender_id', lenderProfile.id)
        .order('created_at', { ascending: false });

      if (data) {
        setBookings(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (bookings: any[]) => {
    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      activeBookings: bookings.filter(b => b.status === 'active').length,
      totalEarnings: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_price * 0.9), 0),
    };
    setStats(stats);
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(b => {
        const listing = b.listings as any;
        const renter = b.profiles as any;
        return (
          listing?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          renter?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          renter?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    setFilteredBookings(filtered);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusColors: any = {
    pending: 'secondary',
    confirmed: 'default',
    active: 'default',
    completed: 'default',
    cancelled: 'destructive',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Booking Management</h1>
        <p className="text-muted-foreground">Track and manage your rental bookings</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">Currently rented</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">After platform fees</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>Manage your rental reservations</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({bookings.filter(b => b.status === 'active').length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({bookings.filter(b => ['completed', 'cancelled'].includes(b.status)).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              <div className="space-y-3">
                {filteredBookings
                  .filter(b => ['pending', 'confirmed'].includes(b.status))
                  .map((booking) => {
                    const listing = booking.listings as any;
                    const renter = booking.profiles as any;
                    const coverImage = listing?.listing_images?.find((img: any) => img.is_cover);

                    return (
                      <Link key={booking.id} href={`/sell/bookings/${booking.id}`}>
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition cursor-pointer">
                          <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                            {coverImage ? (
                              <img src={coverImage.url} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{listing?.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {renter?.full_name} • {format(new Date(booking.start_date), 'MMM dd')} - {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Qty: {booking.quantity}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={statusColors[booking.status]} className="capitalize">
                              {booking.status}
                            </Badge>
                            <div className="text-sm font-bold">${(booking.total_price * 0.9).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Your earnings</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                {filteredBookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming bookings
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <div className="space-y-3">
                {filteredBookings
                  .filter(b => b.status === 'active')
                  .map((booking) => {
                    const listing = booking.listings as any;
                    const renter = booking.profiles as any;
                    const coverImage = listing?.listing_images?.find((img: any) => img.is_cover);

                    return (
                      <Link key={booking.id} href={`/sell/bookings/${booking.id}`}>
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition cursor-pointer">
                          <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                            {coverImage ? (
                              <img src={coverImage.url} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{listing?.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {renter?.full_name} • {format(new Date(booking.start_date), 'MMM dd')} - {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={statusColors[booking.status]}>Active</Badge>
                            <div className="text-sm font-bold">${(booking.total_price * 0.9).toFixed(2)}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                {filteredBookings.filter(b => b.status === 'active').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active rentals
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              <div className="space-y-3">
                {filteredBookings
                  .filter(b => ['completed', 'cancelled'].includes(b.status))
                  .map((booking) => {
                    const listing = booking.listings as any;
                    const renter = booking.profiles as any;
                    const coverImage = listing?.listing_images?.find((img: any) => img.is_cover);

                    return (
                      <Link key={booking.id} href={`/sell/bookings/${booking.id}`}>
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition cursor-pointer">
                          <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                            {coverImage ? (
                              <img src={coverImage.url} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{listing?.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {renter?.full_name} • {format(new Date(booking.start_date), 'MMM dd')} - {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={statusColors[booking.status]} className="capitalize">
                              {booking.status}
                            </Badge>
                            {booking.status === 'completed' && (
                              <>
                                <div className="text-sm font-bold">${(booking.total_price * 0.9).toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">Earned</div>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                {filteredBookings.filter(b => ['completed', 'cancelled'].includes(b.status)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No past bookings
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
