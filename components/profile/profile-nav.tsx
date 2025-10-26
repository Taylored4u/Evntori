'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Heart, Calendar, MessageSquare, Settings } from 'lucide-react';

const navItems = [
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
  },
  {
    href: '/profile/favorites',
    label: 'Favorites',
    icon: Heart,
  },
  {
    href: '/bookings',
    label: 'Bookings',
    icon: Calendar,
  },
  {
    href: '/inbox',
    label: 'Messages',
    icon: MessageSquare,
  },
  {
    href: '/profile/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function ProfileNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
