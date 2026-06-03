// app/mock-draft/page.tsx
import { loadPlayers } from '@/lib/players';
import { MockDraft } from '@/components/mock-draft';

export const metadata = {
  title: 'Mock Draft — DraftEdge',
  description: 'Run a 12-team snake draft against AI opponents using DraftEdge rankings.',
};

export default function MockDraftPage() {
  const players = loadPlayers();

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Mock Draft</h1>
        <p className="mt-2 text-muted-foreground">
          PPR snake draft against AI opponents. 1 QB, 2 RB, 3 WR, 1 TE, 1 FLEX, 6 bench.
        </p>
      </div>

      <MockDraft players={players} />
    </main>
  );
}