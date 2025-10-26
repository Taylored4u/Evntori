'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasswordClient } from '@/lib/auth/client-actions';
import { updatePasswordSchema, UpdatePasswordInput } from '@/lib/validations/auth';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader as Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  useEffect(() => {
    if (!authLoading) {
      setIsVerifying(false);
    }
  }, [authLoading]);

  const onSubmit = async (data: UpdatePasswordInput) => {
    setIsLoading(true);

    try {
      const result = await updatePasswordClient(data.password);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Password updated successfully!');
        router.push('/');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <AuthCard
        title="Set new password"
        description="Verifying your reset link..."
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthCard>
    );
  }

  if (!user) {
    return (
      <AuthCard
        title="Invalid or expired link"
        description="This password reset link is no longer valid"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The password reset link you used is invalid or has expired. Please request a new password reset link.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/auth/reset-password')}
          >
            Request New Reset Link
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      description="Choose a strong password for your account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Password
        </Button>
      </form>
    </AuthCard>
  );
}
