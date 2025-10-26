'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpClient } from '@/lib/auth/client-actions';
import { signUpSchema, SignUpInput } from '@/lib/validations/auth';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader as Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);

    try {
      const result = await signUpClient(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Account created successfully!');
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      description="Join Evntori to discover luxury wedding rentals"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Jane Smith"
            {...register('fullName')}
            disabled={isLoading}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            {...register('phone')}
            disabled={isLoading}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password', {
              onChange: (e) => setPassword(e.target.value),
            })}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center transition-colors",
                  passwordRequirements.minLength
                    ? "bg-green-500 text-white"
                    : "bg-muted"
                )}
              >
                {passwordRequirements.minLength && <Check className="h-3 w-3" />}
              </div>
              <p
                className={cn(
                  "text-xs transition-colors",
                  passwordRequirements.minLength
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                At least 8 characters
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center transition-colors",
                  passwordRequirements.hasUppercase
                    ? "bg-green-500 text-white"
                    : "bg-muted"
                )}
              >
                {passwordRequirements.hasUppercase && <Check className="h-3 w-3" />}
              </div>
              <p
                className={cn(
                  "text-xs transition-colors",
                  passwordRequirements.hasUppercase
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                Contains uppercase letter
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center transition-colors",
                  passwordRequirements.hasLowercase
                    ? "bg-green-500 text-white"
                    : "bg-muted"
                )}
              >
                {passwordRequirements.hasLowercase && <Check className="h-3 w-3" />}
              </div>
              <p
                className={cn(
                  "text-xs transition-colors",
                  passwordRequirements.hasLowercase
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                Contains lowercase letter
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center transition-colors",
                  passwordRequirements.hasNumber
                    ? "bg-green-500 text-white"
                    : "bg-muted"
                )}
              >
                {passwordRequirements.hasNumber && <Check className="h-3 w-3" />}
              </div>
              <p
                className={cn(
                  "text-xs transition-colors",
                  passwordRequirements.hasNumber
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                Contains number
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link href="/legal/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
