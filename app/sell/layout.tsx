import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-serif font-bold tracking-tight">
            KnotAgain
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/search" className="text-sm hover:text-primary transition">
              Browse
            </Link>
            <Link href="/sell" className="text-sm hover:text-primary transition">
              Dashboard
            </Link>
            <Link href="/sell/analytics" className="text-sm hover:text-primary transition">
              Analytics
            </Link>
            <Button asChild size="sm" variant="outline">
              <Link href="/profile">My Account</Link>
            </Button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
