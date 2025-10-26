import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <span className="text-foreground">evnt</span>
                <span className="text-primary">o</span>
                <span className="text-foreground">ri</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The premier marketplace for wedding & event rentals. Rent unique items for your special day.
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@evntori.com"
                className="text-muted-foreground hover:text-foreground transition"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Renters</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground transition">
                  Browse Rentals
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="text-muted-foreground hover:text-foreground transition">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-muted-foreground hover:text-foreground transition">
                  Favorites
                </Link>
              </li>
              <li>
                <Link href="/messages" className="text-muted-foreground hover:text-foreground transition">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Lenders</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sell" className="text-muted-foreground hover:text-foreground transition">
                  Lender Dashboard
                </Link>
              </li>
              <li>
                <Link href="/sell/onboarding" className="text-muted-foreground hover:text-foreground transition">
                  Become a Lender
                </Link>
              </li>
              <li>
                <Link href="/sell/listings" className="text-muted-foreground hover:text-foreground transition">
                  My Listings
                </Link>
              </li>
              <li>
                <Link href="/sell/analytics" className="text-muted-foreground hover:text-foreground transition">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {currentYear} Evntori. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
