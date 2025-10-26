'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader as Loader2, Plus, Package, DollarSign, TrendingUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { PayoutDashboard } from '@/components/payments/payout-dashboard';

export default function LenderDashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [lenderProfile, setLenderProfile] = useState<any>(null);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLenderData = async () => {
      if (!profile) return;

      try {
        const { data: lender } = (await supabase
          .from('lender_profiles')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle()) as any;

        setLenderProfile(lender);

        if (lender?.stripe_account_id) {
          const response = await fetch('/api/stripe/connect/account-status');
          if (response.ok) {
            const status = await response.json();
            setAccountStatus(status);
          }
        }
      } catch (error) {
        console.error('Error fetching lender data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchLenderData();
    }
  }, [profile, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    router.push('/auth/login?redirect=/sell');
    return null;
  }

  if (!lenderProfile) {
    return (
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif">Become a Lender</CardTitle>
            <CardDescription>
              Start earning by renting out your wedding items to couples
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Earn Income</p>
              </div>
              <div className="text-center p-4">
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Easy Listing</p>
              </div>
              <div className="text-center p-4">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Secure Payments</p>
              </div>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link href="/sell/onboarding">Start Lender Onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isFullyVerified = accountStatus?.chargesEnabled && accountStatus?.payoutsEnabled;
  const needsVerification = !isFullyVerified && lenderProfile.stripe_account_id;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Lender Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {lenderProfile.business_name || profile.full_name}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/sell/listings/new">
              <Plus className="mr-2 h-5 w-5" />
              Create Listing
            </Link>
          </Button>
        </div>

        {needsVerification && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Your account verification is pending. Complete it to start accepting bookings.
              </span>
              <Button
                asChild
                size="sm"
                variant="outline"
              >
                <Link href="/sell/onboarding/success">Check Status</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isFullyVerified && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your account is fully verified and ready to accept bookings!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
              {isFullyVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isFullyVerified ? 'Verified' : 'Pending'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isFullyVerified
                  ? 'Ready to accept bookings'
                  : 'Complete verification to go live'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first listing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lenderProfile.total_bookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your lender profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Business Name</div>
              <div className="font-medium">{lenderProfile.business_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Description</div>
              <div className="font-medium">{lenderProfile.business_description}</div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Rating</div>
                <div className="font-medium">
                  {lenderProfile.rating_avg > 0
                    ? `${lenderProfile.rating_avg}/5.0 (${lenderProfile.rating_count} reviews)`
                    : 'No reviews yet'}
                </div>
              </div>
            </div>
            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href="/sell/onboarding">Edit Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="h-auto py-6 justify-start">
              <Link href="/sell/listings">
                <Package className="mr-3 h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Manage Listings</div>
                  <div className="text-sm text-muted-foreground">
                    View and edit your rental items
                  </div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-6 justify-start">
              <Link href="/sell/bookings">
                <TrendingUp className="mr-3 h-6 w-6" />
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

        {isFullyVerified && lenderProfile.id && (
          <div className="mt-8">
            <h2 className="text-2xl font-serif font-bold mb-6">Earnings & Payouts</h2>
            <PayoutDashboard lenderId={lenderProfile.id} />
          </div>
        )}
      </div>
    </main>
  );
}
