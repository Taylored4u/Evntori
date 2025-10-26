'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader as Loader2, Users, Package, ShoppingCart, DollarSign, TriangleAlert as AlertTriangle, Activity, TrendingUp, Shield } from 'lucide-react';
import { checkIsAdmin, getPlatformOverview, getRecentActivity, getContentReports } from '@/lib/admin/queries';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/admin');
      return;
    }

    if (profile) {
      checkAdminAccess();
    }
  }, [profile, authLoading, router]);

  const checkAdminAccess = async () => {
    if (!profile) return;

    try {
      const adminStatus = await checkIsAdmin(profile.id);

      if (!adminStatus) {
        toast.error('Access denied: Admin privileges required');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Failed to verify admin access');
      router.push('/');
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [overviewData, activityData, reportsData] = await Promise.all([
        getPlatformOverview(),
        getRecentActivity(10),
        getContentReports('pending'),
      ]);

      setOverview(overviewData);
      setRecentActivity(activityData);
      setPendingReports(reportsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: overview.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Listings',
      value: overview.totalListings,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Bookings',
      value: overview.totalBookings,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Revenue',
      value: `$${overview.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <h1 className="text-2xl font-serif font-bold">Admin Dashboard</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/admin/users" className="text-sm hover:text-primary transition">
                Users
              </Link>
              <Link href="/admin/listings" className="text-sm hover:text-primary transition">
                Listings
              </Link>
              <Link href="/admin/reports" className="text-sm hover:text-primary transition">
                Reports
              </Link>
              <Link href="/" className="text-sm hover:text-primary transition">
                Back to Site
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`rounded-full p-2 ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {pendingReports.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Pending Reports
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  {pendingReports.length} report(s) requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/admin/reports"
                  className="text-sm font-medium text-yellow-800 hover:underline"
                >
                  View All Reports →
                </Link>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">
                <Activity className="h-4 w-4 mr-2" />
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Platform Activity</CardTitle>
                  <CardDescription>
                    Latest actions across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <Badge variant={activity.type === 'user' ? 'default' : 'secondary'}>
                          {activity.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Trends</CardTitle>
                  <CardDescription>
                    Growth and usage analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Trend analytics coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
