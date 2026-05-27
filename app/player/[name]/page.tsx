// app/player/[name]/page.tsx
// Dynamic route for individual player detail pages.
// URL pattern: /player/Ja'Marr%20Chase (URL-encoded player name)

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { loadPlayers, type Player } from '@/lib/players';
import { getTeamLogoUrl } from '@/lib/team-logos';

type Props = {
  params: Promise<{ name: string }>;
};

// Pre-generate static pages for every player at build time (fast)
export async function generateStaticParams() {
  const players = loadPlayers();
  return players.map((p) => ({
    name: encodeURIComponent(p.player_display_name),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params;
  const playerName = decodeURIComponent(name);
  return {
    title: `${playerName} — Fantasy Football Assistant`,
    description: `2026 projections, rankings, and outlook for ${playerName}`,
  };
}

export default async function PlayerPage({ params }: Props) {
  const { name } = await params;
  const playerName = decodeURIComponent(name);

  const allPlayers = loadPlayers();
  const player = allPlayers.find((p) => p.player_display_name === playerName);

  if (!player) {
    notFound();
  }

  // Compute the player's rank in each variant
  const ranks = computeVariantRanks(allPlayers, player);

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <Link
        href="/rankings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to rankings
      </Link>

      <Header player={player} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <StatCard label="Overall Rank" value={`#${player.main_rank}`} sublabel="of 777 players" />
        <StatCard label="Position Rank" value={`${player.position}${player.pos_rank}`} sublabel={`among ${player.position}s`} />
        <StatCard label="Composite Score" value={player.composite_score.toFixed(2)} sublabel="z-score blend" />
      </div>

      <Section title="2026 Projections">
        <ProjectionGrid player={player} />
      </Section>

      <Section title="Ranking by Strategy">
        <p className="text-sm text-muted-foreground mb-4">
          Each ranking weights uncertainty differently. Median is the standard projection;
          floor protects against bust; ceiling chases upside; efficiency rewards consistency.
        </p>
        <VariantRanks ranks={ranks} />
      </Section>

      <Section title="Outlook">
        <div className="text-sm text-muted-foreground italic p-6 bg-muted/40 rounded-md border">
          AI-generated outlook coming soon. This will be a Claude-generated summary
          combining the model's projection with recent news and analysis.
        </div>
      </Section>
    </main>
  );
}

function Header({ player }: { player: Player }) {
  const logoUrl = getTeamLogoUrl(player.team);

  return (
    <div className="flex items-center gap-5 pb-6 border-b">
      {logoUrl && (
        <img
          src={logoUrl}
          alt={player.team}
          className="w-20 h-20 object-contain shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight truncate">
            {player.player_display_name}
          </h1>
          <PositionBadge position={player.position} />
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {player.team && <>{player.team} · </>}
          {player.position}{player.pos_rank} · Age {Math.round(player.age)}
          {player.prev_fp_per_game != null && (
            <> · 2025: {player.prev_fp_per_game.toFixed(1)} PPR/game</>
          )}
        </div>
      </div>
    </div>
  );
}


function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="p-4 rounded-md border bg-card">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function ProjectionGrid({ player }: { player: Player }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-5 rounded-md border bg-card">
        <div className="text-sm font-medium mb-4">Per-Game Projection</div>
        <div className="space-y-3">
          <ProjectionRow label="Floor (p10)" value={player.proj_p10} />
          <ProjectionRow label="Median (p50)" value={player.proj_p50} highlight />
          <ProjectionRow label="Ceiling (p90)" value={player.proj_p90} />
        </div>
      </div>

      <div className="p-5 rounded-md border bg-card">
        <div className="text-sm font-medium mb-4">Season Total ({player.expected_games} games)</div>
        <div className="space-y-3">
          <ProjectionRow label="Floor (p10)" value={player.p10_total} />
          <ProjectionRow label="Median (p50)" value={player.p50_total} highlight />
          <ProjectionRow label="Ceiling (p90)" value={player.p90_total} />
          <div className="pt-3 mt-3 border-t">
            <ProjectionRow label="Uncertainty (width)" value={player.uncertainty_total} muted />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectionRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <div className={`text-sm ${muted ? 'text-muted-foreground' : ''}`}>{label}</div>
      <div className={`font-mono ${highlight ? 'text-2xl font-bold' : 'text-base'}`}>
        {value.toFixed(value < 100 ? 2 : 1)}
      </div>
    </div>
  );
}

type VariantRank = {
  label: string;
  rank: number;
  description: string;
};

function computeVariantRanks(allPlayers: Player[], player: Player): VariantRank[] {
  const byMedian = [...allPlayers].sort((a, b) => b.vor_median - a.vor_median);
  const byFloor = [...allPlayers].sort((a, b) => b.vor_floor - a.vor_floor);
  const byCeiling = [...allPlayers].sort((a, b) => b.vor_ceiling - a.vor_ceiling);
  const bySharpe = [...allPlayers].sort((a, b) => b.sharpe - a.sharpe);

  return [
    {
      label: 'Median',
      description: 'Standard VOR — expected outcome',
      rank: byMedian.findIndex((p) => p.player_display_name === player.player_display_name) + 1,
    },
    {
      label: 'Floor',
      description: 'Conservative — protect against bust',
      rank: byFloor.findIndex((p) => p.player_display_name === player.player_display_name) + 1,
    },
    {
      label: 'Ceiling',
      description: 'Aggressive — chase upside',
      rank: byCeiling.findIndex((p) => p.player_display_name === player.player_display_name) + 1,
    },
    {
      label: 'Efficiency',
      description: 'Value per unit of risk',
      rank: bySharpe.findIndex((p) => p.player_display_name === player.player_display_name) + 1,
    },
  ];
}

function VariantRanks({ ranks }: { ranks: VariantRank[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ranks.map((r) => (
        <div key={r.label} className="p-4 rounded-md border bg-card">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</div>
          <div className="mt-1 text-2xl font-bold">#{r.rank}</div>
          <div className="mt-1 text-xs text-muted-foreground">{r.description}</div>
        </div>
      ))}
    </div>
  );
}

function PositionBadge({ position }: { position: Player['position'] }) {
  const colors: Record<Player['position'], string> = {
    QB: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    RB: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    WR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    TE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded ${colors[position]}`}>
      {position}
    </span>
  );
}