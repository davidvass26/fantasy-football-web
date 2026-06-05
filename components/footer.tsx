// components/footer.tsx
// Site footer — appears on every page via the root layout.

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-border/60">
      {/* Thin neon line at the very top to match the top nav */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link
              href="/"
              className="text-lg font-bold tracking-tight inline-block transition-colors hover:opacity-90"
            >
              Draft<span className="text-primary">Edge</span>
            </Link>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              © 2026 · PPR Fantasy Football · ML-powered projections
            </div>
          </div>

          <nav className="flex items-center gap-5 text-xs uppercase tracking-[0.15em] font-medium text-muted-foreground">
            <Link href="/rankings" className="hover:text-primary transition-colors">
              Rankings
            </Link>
            <Link href="/compare" className="hover:text-primary transition-colors">
              Compare
            </Link>
            <Link href="/mock-draft" className="hover:text-primary transition-colors">
              Mock Draft
            </Link>
            <Link href="/articles" className="hover:text-primary transition-colors">
              Articles
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}