'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader as Loader2 } from 'lucide-react';

export default function OnboardingRefreshPage() {
  useEffect(() => {
    const redirectToOnboarding = async () => {
      try {
        const response = await fetch('/api/stripe/connect/account-link', {
          method: 'POST',
        });
        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          window.location.href = '/sell/onboarding';
        }
      } catch (error) {
        window.location.href = '/sell/onboarding';
      }
    };

    redirectToOnboarding();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Redirecting...</h3>
              <p className="text-sm text-muted-foreground">
                Taking you back to complete your verification
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
