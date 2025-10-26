import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-serif font-bold tracking-tight">
            KnotAgain
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-secondary/20 to-background">
        <div className="w-full max-w-md animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
