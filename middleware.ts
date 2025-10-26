import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith('/profile') ||
    req.nextUrl.pathname.startsWith('/bookings') ||
    req.nextUrl.pathname.startsWith('/sell') ||
    req.nextUrl.pathname.startsWith('/inbox') ||
    req.nextUrl.pathname.startsWith('/admin');

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage && session && req.nextUrl.pathname !== '/auth/update-password') {
    const redirect = req.nextUrl.searchParams.get('redirect');
    return NextResponse.redirect(new URL(redirect || '/', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/profile/:path*',
    '/bookings/:path*',
    '/sell/:path*',
    '/inbox/:path*',
    '/admin/:path*',
  ],
};
