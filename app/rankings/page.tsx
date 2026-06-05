// src/app/rankings/page.tsx
// The main rankings page. Server component — loads players at build time
// and passes them to the client table component for sorting/filtering.

import { loadPlayers } from '@/lib/players';
import { RankingsTable } from '@/components/rankings-table';

export const metadata = {
  title: 'Rankings — Fantasy Football Assistant',
  description: 'AI-backed PPR fantasy football rankings with uncertainty bands',
};

export default function RankingsPage() {
  const players = loadPlayers();

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Rankings</h1>
        <p className="mt-2 text-muted-foreground">
          {players.length} players ranked by composite score
          These rankings are geared towards a 12 team league making RBs more valuable than receivers due to VOR
        </p>
      </div>

      <RankingsTable players={players} />
    </main>
  );
}
