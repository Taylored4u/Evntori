import Link from 'next/link';
import { ProfileNav } from '@/components/profile/profile-nav';
import { Button } from '@/components/ui/button';

export default function ProfileLayout({
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
              Lender Dashboard
            </Link>
            <Button asChild size="sm" variant="outline">
              <Link href="/profile">My Account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-4">
            <ProfileNav />
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
