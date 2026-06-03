// app/compare/page.tsx
// Compare two players side by side. Server component loads the player list,
// then ComparePicker (client) handles search/selection.

import { loadPlayers } from '@/lib/players';
import { ComparePicker } from '@/components/compare-picker';

export const metadata = {
  title: 'Compare Players — DraftEdge',
  description: 'Side-by-side projection comparison with AI-generated outlook',
};

export default function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const players = loadPlayers();

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Compare Players</h1>
        <p className="mt-2 text-muted-foreground">
          Pick two players to see their projections, rankings, and key tradeoffs side by side.
        </p>
      </div>

      <ComparePicker players={players} initialParams={searchParams} />
    </main>
  );
}