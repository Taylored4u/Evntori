'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader as Loader2, TrendingUp, Download } from 'lucide-react';
import { RevenueStatsComponent } from '@/components/analytics/revenue-stats';
import { BookingStatsComponent } from '@/components/analytics/booking-stats';
import { TopListings } from '@/components/analytics/top-listings';
import { RecentActivityComponent } from '@/components/analytics/recent-activity';
import {
  getRevenueStats,
  getBookingStats,
  getTopPerformingListings,
  getRecentActivity,
  getBookingTrends,
  type RevenueStats,
  type BookingStats,
  type ListingPerformance,
  type RecentActivity,
} from '@/lib/analytics/queries';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function AnalyticsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [lenderProfile, setLenderProfile] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('30');

  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    pendingRevenue: 0,
    completedRevenue: 0,
    refundedRevenue: 0,
  });

  const [bookingStats, setBookingStats] = useState<BookingStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    averageBookingValue: 0,
  });

  const [topListings, setTopListings] = useState<ListingPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/sell/analytics');
      return;
    }

    if (profile) {
      fetchLenderProfile();
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (lenderProfile) {
      fetchAnalytics();
    }
  }, [lenderProfile, timeRange]);

  const fetchLenderProfile = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('lender_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (data) {
      setLenderProfile(data);
    } else {
      router.push('/sell/onboarding');
    }
  };

  const fetchAnalytics = async () => {
    if (!lenderProfile) return;

    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [revenue, bookings, listings, activity, trendData] = await Promise.all([
        getRevenueStats(lenderProfile.id, startDate),
        getBookingStats(lenderProfile.id, startDate),
        getTopPerformingListings(lenderProfile.id, 5),
        getRecentActivity(lenderProfile.id, 10),
        getBookingTrends(lenderProfile.id, days),
      ]);

      setRevenueStats(revenue);
      setBookingStats(bookings);
      setTopListings(listings);
      setRecentActivity(activity);
      setTrends(trendData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const data = {
      revenue: revenueStats,
      bookings: bookingStats,
      topListings,
      recentActivity,
      trends,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported');
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your business performance and insights
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <RevenueStatsComponent stats={revenueStats} />

        <BookingStatsComponent stats={bookingStats} />

        {trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Booking Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Trend visualization (last {timeRange} days)</p>
                <p className="text-xs mt-2">
                  {trends.length} data points collected
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <TopListings listings={topListings} />
          <RecentActivityComponent activities={recentActivity} />
        </div>
      </div>
    </div>
  );
}
