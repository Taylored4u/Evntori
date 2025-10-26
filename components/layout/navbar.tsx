'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Heart,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Package,
  LayoutDashboard,
  Menu,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchUnreadMessages();

      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${profile.id}`,
          },
          () => {
            fetchUnreadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchUnreadMessages = async () => {
    if (!profile) return;

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', profile.id)
      .eq('is_read', false);

    setUnreadMessages(count || 0);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const navLinks = profile
    ? [
        { href: '/search', label: 'Browse' },
        { href: '/sell', label: 'Become a Lender' },
      ]
    : [
        { href: '/search', label: 'Browse' },
        { href: '/auth/register', label: 'Become a Lender' },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center hover:opacity-80 transition">
              <Image
                src="/evntori-logo.svg"
                alt="Evntori"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === link.href ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {profile ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hidden md:flex"
                  asChild
                >
                  <Link href="/favorites">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hidden md:flex"
                  asChild
                >
                  <Link href="/messages">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadMessages}
                      </Badge>
                    )}
                  </Link>
                </Button>

                <div className="hidden md:block">
                  <NotificationsDropdown userId={profile.id} />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">My Account</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {profile.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/bookings" className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="cursor-pointer">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Messages
                        {unreadMessages > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {unreadMessages}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/sell" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Lender Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72">
                    <div className="flex flex-col gap-4 mt-8">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(profile.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{profile.email}</p>
                        </div>
                      </div>

                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm font-medium py-2 hover:text-primary transition"
                        >
                          {link.label}
                        </Link>
                      ))}

                      <div className="border-t pt-4 space-y-2">
                        <Link
                          href="/bookings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm py-2 hover:text-primary transition"
                        >
                          <Package className="h-4 w-4" />
                          My Bookings
                        </Link>
                        <Link
                          href="/favorites"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm py-2 hover:text-primary transition"
                        >
                          <Heart className="h-4 w-4" />
                          Favorites
                        </Link>
                        <Link
                          href="/messages"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm py-2 hover:text-primary transition"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Messages
                          {unreadMessages > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {unreadMessages}
                            </Badge>
                          )}
                        </Link>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <Link
                          href="/sell"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm py-2 hover:text-primary transition"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Lender Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm py-2 hover:text-primary transition"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          href="/profile/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm py-2 hover:text-primary transition"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </div>

                      <div className="border-t pt-4">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive hover:text-destructive"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSignOut();
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>

                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72">
                    <div className="flex flex-col gap-4 mt-8">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-sm font-medium py-2 hover:text-primary transition"
                        >
                          {link.label}
                        </Link>
                      ))}

                      <div className="border-t pt-4 space-y-2">
                        <Button className="w-full" asChild>
                          <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                            Get Started
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                            Sign In
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
