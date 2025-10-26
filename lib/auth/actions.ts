'use server';

import { createActionClient } from '@/lib/supabase/server';
import { SignUpInput, SignInInput, ResetPasswordInput } from '@/lib/validations/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signUp(data: SignUpInput) {
  try {
    const supabase = createActionClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
        },
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);

      // Handle various duplicate account scenarios
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already exists') ||
        authError.message.includes('User already registered')
      ) {
        return { error: 'An account with this email already exists. Please sign in instead.' };
      }

      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Failed to create account. Please try again.' };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        phone: data.phone || null,
        role: 'customer',
      } as any);

    if (profileError) {
      console.error('Profile creation error:', profileError);

      // Handle duplicate profile (code 23505 is unique constraint violation)
      if (profileError.code === '23505') {
        return { error: 'An account with this email already exists. Please sign in instead.' };
      }

      return { error: 'Failed to complete account setup. Please try again.' };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in signUp:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function signIn(data: SignInInput) {
  try {
    const supabase = createActionClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error('Sign in error:', error);
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' };
      }
      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in signIn:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function signOut() {
  const supabase = createActionClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function resetPassword(data: ResetPasswordInput) {
  try {
    const supabase = createActionClient();

    // Get the app URL from environment variables, with fallback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${appUrl}/auth/update-password`,
    });

    if (error) {
      console.error('Reset password error:', error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in resetPassword:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = createActionClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updatePassword:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
