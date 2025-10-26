import { supabase } from '@/lib/supabase/client';
import { SignUpInput, SignInInput, ResetPasswordInput } from '@/lib/validations/auth';

export async function signUpClient(data: SignUpInput) {
  try {
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
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);

      if (profileError.code === '23505') {
        return { error: 'An account with this email already exists. Please sign in instead.' };
      }

      return { error: 'Failed to complete account setup. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in signUp:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function signInClient(data: SignInInput) {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error('Sign in error:', error);

      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' };
      }

      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in signIn:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function signOutClient() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in signOut:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function resetPasswordClient(data: ResetPasswordInput) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
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

export async function updatePasswordClient(password: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('Update password error:', error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updatePassword:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
