'use client';

// components/top-nav.tsx
// Top navigation — appears on every page via the root layout.
// Active page indicator + neon accent on hover.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/rankings', label: 'Rankings' },
  { href: '/compare', label: 'Compare' },
  { href: '/mock-draft', label: 'Mock Draft' },
  { href: '/articles', label: 'Latest Updates' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
      {/* Thin neon line at the very top for the futuristic touch */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight transition-colors hover:text-primary"
        >
          Draft<span className="text-primary">Edge</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute left-3 right-3 bottom-1 h-px bg-primary shadow-[0_0_8px_var(--neon-glow)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
