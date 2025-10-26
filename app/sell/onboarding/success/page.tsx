'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader as Loader2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, refreshProfile } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isMock = searchParams.get('mock') === 'true';

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await refreshProfile();

        const response = await fetch('/api/stripe/connect/account-status');
        const data = await response.json();

        if (response.ok) {
          setAccountStatus(data);
        } else {
          setError(data.error || 'Failed to check account status');
        }
      } catch (err) {
        setError('Something went wrong checking your account status');
      } finally {
        setIsChecking(false);
      }
    };

    const timer = setTimeout(checkStatus, 2000);
    return () => clearTimeout(timer);
  }, [refreshProfile]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Verifying your account...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we confirm your verification status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFullyVerified = accountStatus?.chargesEnabled && accountStatus?.payoutsEnabled;
  const isPending = accountStatus?.detailsSubmitted && !isFullyVerified;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary/20 to-background">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isFullyVerified ? (
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            ) : isPending ? (
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-serif">
            {isFullyVerified
              ? 'Welcome to KnotAgain!'
              : isPending
              ? 'Verification In Progress'
              : 'Additional Information Needed'}
          </CardTitle>
          <CardDescription className="text-base">
            {isFullyVerified
              ? 'Your lender account is fully verified and ready to go'
              : isPending
              ? 'Your information is being reviewed by Stripe'
              : 'Please complete your verification to start accepting payments'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isMock && (
            <Alert>
              <AlertDescription>
                Mock mode enabled - Stripe verification is simulated for testing
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {accountStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm font-medium">Details Submitted</span>
                {accountStatus.detailsSubmitted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm font-medium">Charges Enabled</span>
                {accountStatus.chargesEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm font-medium">Payouts Enabled</span>
                {accountStatus.payoutsEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
              </div>
            </div>
          )}

          {accountStatus?.requiresInfo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Stripe requires additional information to complete your verification.
                This is normal and helps keep the platform secure.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {isFullyVerified ? (
              <>
                <Button asChild className="w-full" size="lg">
                  <Link href="/sell/listings/new">Create Your First Listing</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/sell">Go to Lender Dashboard</Link>
                </Button>
              </>
            ) : accountStatus?.requiresInfo ? (
              <>
                <Button
                  onClick={async () => {
                    const response = await fetch('/api/stripe/connect/account-link', {
                      method: 'POST',
                    });
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  }}
                  className="w-full"
                  size="lg"
                >
                  Complete Verification
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">Go to Profile</Link>
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your verification is being processed by Stripe. This usually takes a few
                    minutes but can take up to 24 hours. We'll email you when it's complete.
                  </AlertDescription>
                </Alert>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">Go to Profile</Link>
                </Button>
              </>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Questions?{' '}
            <Link href="/help" className="text-primary hover:underline">
              Visit our Help Center
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
