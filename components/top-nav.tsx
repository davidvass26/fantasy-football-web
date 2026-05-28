// components/top-nav.tsx
// Top navigation bar — appears on every page via the root layout.

import Link from 'next/link';

export function TopNav() {
  return (
    <header className="border-b sticky top-0 bg-background/80 backdrop-blur z-10">
      <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          DraftEdge
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/rankings" className="hover:underline underline-offset-4">
            Rankings
          </Link>
          <Link href="/compare" className="hover:underline underline-offset-4">
            Compare
          </Link>
          <Link href="/mock-draft" className="hover:underline underline-offset-4">
            Mock Draft
          </Link>
          <Link href="/articles" className="hover:underline underline-offset-4">
            Latest Updates
          </Link>
        </nav>
      </div>
    </header>
  );
}
