// app/layout.tsx
// Root layout — wraps every page in the app.
// Loads global styles, fonts, nav, and footer.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DraftEdge — AI-Powered Fantasy Football',
  description: 'Custom ML projections with uncertainty bands. PPR fantasy football rankings, player comparisons, and mock drafts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <TopNav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}