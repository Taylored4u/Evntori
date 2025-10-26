'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lenderOnboardingSchema, LenderOnboardingInput } from '@/lib/validations/lender';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader as Loader2, CircleCheck as CheckCircle, DollarSign, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function LenderOnboardingPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LenderOnboardingInput>({
    resolver: zodResolver(lenderOnboardingSchema),
  });

  const onSubmit = async (data: LenderOnboardingInput) => {
    if (!profile) return;

    setIsLoading(true);
    setIsCreatingAccount(true);

    try {
      const { data: existingLender } = (await supabase
        .from('lender_profiles')
        .select('id, stripe_account_id')
        .eq('user_id', profile.id)
        .maybeSingle()) as any;

      if (!existingLender) {
        const { data: newLender, error: insertError } = (await supabase
          .from('lender_profiles')
          .insert({
            user_id: profile.id,
            business_name: data.businessName,
            business_description: data.businessDescription,
          } as any)
          .select()
          .single()) as any;

        if (insertError || !newLender) {
          throw new Error('Failed to create lender profile');
        }

        await (supabase
          .from('profiles')
          .update as any)({ role: 'lender' })
          .eq('id', profile.id);
      } else {
        await (supabase
          .from('lender_profiles')
          .update as any)({
            business_name: data.businessName,
            business_description: data.businessDescription,
          })
          .eq('id', existingLender.id);
      }

      if (existingLender?.stripe_account_id) {
        const response = await fetch('/api/stripe/connect/account-link', {
          method: 'POST',
        });

        const result = await response.json();

        if (result.url) {
          window.location.href = result.url;
          return;
        }
      } else {
        const response = await fetch('/api/stripe/connect/account', {
          method: 'POST',
        });

        const result = await response.json();

        if (result.onboardingUrl) {
          window.location.href = result.onboardingUrl;
          return;
        }

        throw new Error(result.error || 'Failed to create Stripe account');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setIsCreatingAccount(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    router.push('/auth/login?redirect=/sell/onboarding');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-serif font-bold tracking-tight">
            KnotAgain
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Become a Lender
            </h1>
            <p className="text-xl text-muted-foreground">
              Share your wedding items and earn money helping couples create their dream day
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Earn Extra Income</h3>
                  <p className="text-sm text-muted-foreground">
                    Turn your wedding items into a source of passive income
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Simple Listing</h3>
                  <p className="text-sm text-muted-foreground">
                    Easy-to-use tools to showcase your items beautifully
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Secure Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    Protected transactions with deposits and insurance
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Tell us about your business</CardTitle>
              <CardDescription>
                We'll need some information to get you set up as a lender
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    placeholder="Jane's Wedding Rentals"
                    {...register('businessName')}
                    disabled={isLoading}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This will be displayed on your listings
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="Tell couples about your items and what makes them special..."
                    rows={4}
                    {...register('businessDescription')}
                    disabled={isLoading}
                  />
                  {errors.businessDescription && (
                    <p className="text-sm text-destructive">
                      {errors.businessDescription.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Share your story and experience (20-500 characters)
                  </p>
                </div>

                {isCreatingAccount && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Creating your lender account and setting up secure payments with Stripe...
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Next Step: Stripe Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        You'll be redirected to Stripe to verify your identity and set up payouts.
                        This is required to receive payments securely.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue to Stripe Verification
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By continuing, you agree to our{' '}
                  <Link href="/legal/lender-terms" className="underline hover:text-foreground">
                    Lender Terms
                  </Link>{' '}
                  and Stripe's{' '}
                  <a
                    href="https://stripe.com/connect-account/legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Connected Account Agreement
                  </a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
