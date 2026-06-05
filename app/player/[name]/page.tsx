// app/player/[name]/page.tsx
// Per-player theming using both team colors:
//   - Primary on stat highlights, headline numbers, section markers
//   - Secondary on the hero gradient, decorative bars, accents
// Big faded team logo off the right edge of the page as a backdrop.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { loadPlayers, type Player } from '@/lib/players';
import { getTeamLogoUrl } from '@/lib/team-logos';
import { getTeamColors } from '@/lib/team-colors';

type Props = {
  params: Promise<{ name: string }>;
};

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
    title: `${playerName} — DraftEdge`,
    description: `2026 projections, rankings, and outlook for ${playerName}`,
  };
}

export default async function PlayerPage({ params }: Props) {
  const { name } = await params;
  const playerName = decodeURIComponent(name);

  const allPlayers = loadPlayers();
  const player = allPlayers.find((p) => p.player_display_name === playerName);

  if (!player) notFound();

  const ranks = computeVariantRanks(allPlayers, player);
  const colors = getTeamColors(player.team);
  const bigLogoUrl = getTeamLogoUrl(player.team, 500);

  // Theme tokens — scoped to this page only
  const themeStyle = {
    '--team-primary': colors.primary,
    '--team-secondary': colors.secondary,
    '--primary': colors.primary,
    '--primary-foreground': '#FFFFFF',
    '--neon': colors.primary,
    '--neon-glow': `${colors.primary}55`,
    '--secondary-glow': `${colors.secondary}55`,
    '--ring': `${colors.primary}80`,
  } as React.CSSProperties;

  return (
    <div style={themeStyle} className="relative min-h-[calc(100vh-64px)]">
      {/* === Background logo, off-right, partially cut off === */}
      {bigLogoUrl && (
        <div className="pointer-events-none absolute top-12 -right-32 md:-right-24 lg:right-0 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bigLogoUrl}
            alt=""
            aria-hidden
            className="w-[420px] md:w-[520px] lg:w-[600px] opacity-[0.06] blur-[1px]"
            style={{
              filter: 'grayscale(0.2) contrast(1.1)',
            }}
          />
        </div>
      )}

      {/* === Page content === */}
      <main className="relative container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/rankings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to rankings
        </Link>

        <Header player={player} colors={colors} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <StatCard
            label="Overall Rank"
            value={`#${player.main_rank}`}
            sublabel={`of ${allPlayers.length} players`}
            accent="primary"
          />
          <StatCard
            label="Position Rank"
            value={`${player.position}${player.pos_rank}`}
            sublabel={`among ${player.position}s`}
            accent="secondary"
            secondaryColor={colors.secondary}
          />
          <StatCard
            label="Composite Score"
            value={player.composite_score.toFixed(2)}
            sublabel="z-score blend"
            accent="primary"
          />
        </div>

        <Section title="2026 Projections" secondaryColor={colors.secondary}>
          <ProjectionGrid player={player} secondaryColor={colors.secondary} />
        </Section>

        <Section title="Ranking by Strategy" secondaryColor={colors.secondary} accentSide="secondary">
          <p className="text-sm text-muted-foreground mb-4">
            Each ranking weights uncertainty differently. Median is the standard projection;
            floor protects against bust; ceiling chases upside; efficiency rewards consistency.
          </p>
          <VariantRanks ranks={ranks} secondaryColor={colors.secondary} />
        </Section>

        <Section title="Outlook" secondaryColor={colors.secondary}>
          <div className="text-sm text-muted-foreground italic p-6 bg-card rounded-md border">
            AI-generated outlook coming soon. This will be a Claude-generated summary
            combining the model&apos;s projection with recent news and analysis.
          </div>
        </Section>
      </main>
    </div>
  );
}

function Header({ player, colors }: { player: Player; colors: { primary: string; secondary: string } }) {
  const logoUrl = getTeamLogoUrl(player.team);

  // Header background uses BOTH team colors as a gradient
  const headerStyle = {
    background: `linear-gradient(135deg, ${colors.primary}24 0%, ${colors.secondary}18 50%, transparent 100%)`,
    borderColor: `${colors.primary}30`,
  };

  return (
    <div style={headerStyle} className="relative rounded-lg border p-6 overflow-hidden backdrop-blur-sm">
      {/* Left edge dual-color bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 flex flex-col">
        <div
          className="flex-1"
          style={{
            background: colors.primary,
            boxShadow: `0 0 16px ${colors.primary}80`,
          }}
        />
        <div
          className="flex-1"
          style={{
            background: colors.secondary,
            boxShadow: `0 0 16px ${colors.secondary}80`,
          }}
        />
      </div>

      <div className="flex items-center gap-5 relative">
        {logoUrl && (
          <div className="relative shrink-0">
            {/* Outer glow ring uses secondary color */}
            <div
              className="absolute inset-0 rounded-full animate-pulse-glow"
              style={{
                boxShadow: `0 0 24px 4px ${colors.primary}70, 0 0 56px 12px ${colors.secondary}40`,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={player.team}
              className="relative w-24 h-24 object-contain"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {player.player_display_name}
            </h1>
            <PositionBadge position={player.position} />
          </div>
          <div className="mt-2 text-sm text-muted-foreground font-mono">
            {player.team && (
              <span className="font-semibold" style={{ color: colors.primary }}>
                {player.team}
              </span>
            )}
            {player.team && ' · '}
            {player.position}{player.pos_rank} · Age {Math.round(player.age)}
            {player.prev_fp_per_game != null && (
              <>
                {' · 2025: '}
                <span className="text-foreground font-semibold">
                  {player.prev_fp_per_game.toFixed(1)}
                </span>
                {' PPR/G'}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
  secondaryColor,
}: {
  label: string;
  value: string;
  sublabel: string;
  accent: 'primary' | 'secondary';
  secondaryColor?: string;
}) {
  const useSecondary = accent === 'secondary' && secondaryColor;
  return (
    <div
      className="p-4 rounded-md border bg-card relative overflow-hidden"
      style={
        useSecondary
          ? { borderColor: `${secondaryColor}30` }
          : undefined
      }
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className="mt-1 text-3xl font-bold font-mono tabular-nums"
        style={
          useSecondary
            ? {
                color: secondaryColor,
                textShadow: `0 0 16px ${secondaryColor}55`,
              }
            : {
                color: 'var(--primary)',
                textShadow: '0 0 16px var(--neon-glow)',
              }
        }
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>
    </div>
  );
}

function Section({
  title,
  children,
  secondaryColor,
  accentSide,
}: {
  title: string;
  children: React.ReactNode;
  secondaryColor: string;
  accentSide?: 'primary' | 'secondary';
}) {
  const useSecondary = accentSide === 'secondary';
  const accentColor = useSecondary ? secondaryColor : 'var(--primary)';
  const accentGlow = useSecondary ? `${secondaryColor}55` : 'var(--neon-glow)';

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-px w-6"
          style={{
            background: accentColor,
            boxShadow: `0 0 6px ${accentGlow}`,
          }}
        />
        <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">
          {title}
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </section>
  );
}

function ProjectionGrid({
  player,
  secondaryColor,
}: {
  player: Player;
  secondaryColor: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-5 rounded-md border bg-card">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
          Per-Game Projection
        </div>
        <div className="space-y-3">
          <ProjectionRow label="Floor (p10)" value={player.proj_p10} />
          <ProjectionRow label="Median (p50)" value={player.proj_p50} highlight />
          <ProjectionRow label="Ceiling (p90)" value={player.proj_p90} />
        </div>
      </div>

      <div
        className="p-5 rounded-md border bg-card"
        style={{ borderColor: `${secondaryColor}25` }}
      >
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
          Season Total · {player.expected_games} games
        </div>
        <div className="space-y-3">
          <ProjectionRow label="Floor (p10)" value={player.p10_total} />
          <ProjectionRow
            label="Median (p50)"
            value={player.p50_total}
            highlight
            color={secondaryColor}
          />
          <ProjectionRow label="Ceiling (p90)" value={player.p90_total} />
          <div className="pt-3 mt-3 border-t border-border/60">
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
  color,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
  color?: string;
}) {
  const accentColor = color ?? 'var(--primary)';
  const accentGlow = color ? `${color}55` : 'var(--neon-glow)';

  return (
    <div className="flex items-baseline justify-between">
      <div className={`text-sm ${muted ? 'text-muted-foreground' : ''}`}>{label}</div>
      <div
        className={`font-mono tabular-nums ${highlight ? 'text-2xl font-bold' : 'text-base'}`}
        style={
          highlight
            ? { color: accentColor, textShadow: `0 0 12px ${accentGlow}` }
            : undefined
        }
      >
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

function VariantRanks({
  ranks,
  secondaryColor,
}: {
  ranks: VariantRank[];
  secondaryColor: string;
}) {
  // Alternate primary / secondary across the 4 cards for visual rhythm
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ranks.map((r, i) => {
        const useSecondary = i % 2 === 1;
        const color = useSecondary ? secondaryColor : undefined;
        const glow = color ? `${color}55` : 'var(--neon-glow)';
        return (
          <div
            key={r.label}
            className="p-4 rounded-md border bg-card relative overflow-hidden transition-colors"
            style={
              color
                ? { borderColor: `${color}25` }
                : undefined
            }
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{r.label}</div>
            <div
              className="mt-1 text-2xl font-bold font-mono tabular-nums"
              style={{
                color: color ?? 'var(--primary)',
                textShadow: `0 0 12px ${glow}`,
              }}
            >
              #{r.rank}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{r.description}</div>
          </div>
        );
      })}
    </div>
  );
}

function PositionBadge({ position }: { position: Player['position'] }) {
  const styles: Record<Player['position'], string> = {
    QB: 'text-[oklch(0.7_0.2_25)] border-[oklch(0.7_0.2_25/40%)] bg-[oklch(0.7_0.2_25/10%)]',
    RB: 'text-[oklch(0.78_0.2_145)] border-[oklch(0.78_0.2_145/40%)] bg-[oklch(0.78_0.2_145/10%)]',
    WR: 'text-[oklch(0.72_0.2_250)] border-[oklch(0.72_0.2_250/40%)] bg-[oklch(0.72_0.2_250/10%)]',
    TE: 'text-[oklch(0.78_0.18_80)] border-[oklch(0.78_0.18_80/40%)] bg-[oklch(0.78_0.18_80/10%)]',
  };
  return (
    <span className={`inline-flex items-center justify-center text-xs font-semibold tracking-wide px-2.5 py-1 rounded border ${styles[position]}`}>
      {position}
    </span>
  );
}