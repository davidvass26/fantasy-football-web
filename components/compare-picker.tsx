'use client';

// components/compare-picker.tsx
// Search-as-you-type picker for two players, then renders side-by-side cards
// with each player's team color flowing through their column.

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Sparkles } from 'lucide-react';
import type { Player } from '@/lib/players';
import { getTeamLogoUrl } from '@/lib/team-logos';
import { getTeamColors, type TeamColors } from '@/lib/team-colors';

type Props = {
  players: Player[];
  initialParams: Promise<{ a?: string; b?: string }>;
};

export function ComparePicker({ players, initialParams }: Props) {
  const params = use(initialParams);
  const router = useRouter();

  const findPlayer = (name?: string): Player | null =>
    name ? players.find((p) => p.player_display_name === decodeURIComponent(name)) ?? null : null;

  const [playerA, setPlayerA] = useState<Player | null>(findPlayer(params.a));
  const [playerB, setPlayerB] = useState<Player | null>(findPlayer(params.b));

  useEffect(() => {
    const sp = new URLSearchParams();
    if (playerA) sp.set('a', playerA.player_display_name);
    if (playerB) sp.set('b', playerB.player_display_name);
    const qs = sp.toString();
    router.replace(qs ? `/compare?${qs}` : '/compare', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerA, playerB]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerSlot
          label="Player A"
          players={players}
          selected={playerA}
          onSelect={setPlayerA}
          excludeId={playerB?.player_display_name}
        />
        <PlayerSlot
          label="Player B"
          players={players}
          selected={playerB}
          onSelect={setPlayerB}
          excludeId={playerA?.player_display_name}
        />
      </div>

      {playerA && playerB && (
        <>
          <ComparisonGrid a={playerA} b={playerB} allPlayers={players} />
          <AISummarySection a={playerA} b={playerB} />
        </>
      )}

      {!playerA && !playerB && (
        <div className="text-center py-16 text-muted-foreground">
          Pick two players to start comparing.
        </div>
      )}

      {(playerA && !playerB) || (!playerA && playerB) ? (
        <div className="text-center py-12 text-muted-foreground">
          Pick a second player to see the comparison.
        </div>
      ) : null}
    </div>
  );
}

/* -------- Player slot with search-as-you-type -------- */

function PlayerSlot({
  label,
  players,
  selected,
  onSelect,
  excludeId,
}: {
  label: string;
  players: Player[];
  selected: Player | null;
  onSelect: (p: Player | null) => void;
  excludeId?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter((p) => p.player_display_name !== excludeId)
      .filter((p) => p.player_display_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, players, excludeId]);

  if (selected) {
    const colors = getTeamColors(selected.team);
    const cardStyle = {
      background: `linear-gradient(135deg, ${colors.primary}14 0%, ${colors.secondary}10 60%, transparent 100%)`,
      borderColor: `${colors.primary}40`,
    };
    return (
      <div
        className="rounded-md border p-4 relative overflow-hidden"
        style={cardStyle}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{
            background: colors.primary,
            boxShadow: `0 0 12px ${colors.primary}80`,
          }}
        />
        <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-2">
          {label}
        </div>
        <SelectedPlayerCard player={selected} onClear={() => onSelect(null)} colors={colors} />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-2">
        {label}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search players..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
            {filtered.map((p) => (
              <button
                key={p.player_display_name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(p);
                  setQuery('');
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between"
              >
                <span>{p.player_display_name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {p.position}{p.pos_rank} · {p.team}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedPlayerCard({
  player,
  onClear,
  colors,
}: {
  player: Player;
  onClear: () => void;
  colors: TeamColors;
}) {
  const logoUrl = getTeamLogoUrl(player.team);
  return (
    <div className="flex items-center gap-3">
      {logoUrl && (
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 16px 2px ${colors.primary}50, 0 0 32px 6px ${colors.secondary}25`,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={player.team}
            className="relative w-10 h-10 object-contain"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Link
          href={`/player/${encodeURIComponent(player.player_display_name)}`}
          className="font-semibold transition-colors"
          style={{ color: 'inherit' }}
        >
          {player.player_display_name}
        </Link>
        <div className="text-xs text-muted-foreground font-mono">
          <span className="font-semibold" style={{ color: colors.primary }}>
            {player.team}
          </span>
          {' · '}
          {player.position}{player.pos_rank} · Age {Math.round(player.age)}
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
        title="Clear"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------- Side-by-side comparison grid -------- */

function ComparisonGrid({ a, b, allPlayers }: { a: Player; b: Player; allPlayers: Player[] }) {
  const ranksA = variantRanks(allPlayers, a);
  const ranksB = variantRanks(allPlayers, b);
  const colorsA = getTeamColors(a.team);
  const colorsB = getTeamColors(b.team);

  // Determine winners for each metric — null = no winner (uncertainty, ranges)
  // 'a' or 'b' = that player wins
  const wins = {
    posRank: cmp(a.pos_rank, b.pos_rank, 'lower'),
    mainRank: cmp(a.main_rank, b.main_rank, 'lower'),
    composite: cmp(a.composite_score, b.composite_score, 'higher'),
    pergame: cmp(a.proj_p50, b.proj_p50, 'higher'),
    total: cmp(a.p50_total, b.p50_total, 'higher'),
    median: cmp(ranksA.median, ranksB.median, 'lower'),
    floor: cmp(ranksA.floor, ranksB.floor, 'lower'),
    ceiling: cmp(ranksA.ceiling, ranksB.ceiling, 'lower'),
    sharpe: cmp(ranksA.sharpe, ranksB.sharpe, 'lower'),
  };

  return (
    <div>
      <SectionMarker label="Head to Head" />
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="grid grid-cols-3 text-sm">
          {/* Header row */}
          <div className="p-3 bg-muted/30 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground border-r border-b border-border">
            Metric
          </div>
          <div
            className="p-3 font-semibold border-r border-b border-border relative"
            style={{
              background: `linear-gradient(135deg, ${colorsA.primary}1a 0%, ${colorsA.secondary}12 60%, transparent 100%)`,
            }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5"
              style={{
                background: colorsA.primary,
                boxShadow: `0 0 8px ${colorsA.primary}80`,
              }}
            />
            <Link
              href={`/player/${encodeURIComponent(a.player_display_name)}`}
              className="hover:underline"
              style={{ color: colorsA.primary }}
            >
              {a.player_display_name}
            </Link>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {a.team} · {a.position}{a.pos_rank}
            </div>
          </div>
          <div
            className="p-3 font-semibold border-b border-border relative"
            style={{
              background: `linear-gradient(135deg, ${colorsB.primary}1a 0%, ${colorsB.secondary}12 60%, transparent 100%)`,
            }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5"
              style={{
                background: colorsB.primary,
                boxShadow: `0 0 8px ${colorsB.primary}80`,
              }}
            />
            <Link
              href={`/player/${encodeURIComponent(b.player_display_name)}`}
              className="hover:underline"
              style={{ color: colorsB.primary }}
            >
              {b.player_display_name}
            </Link>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {b.team} · {b.position}{b.pos_rank}
            </div>
          </div>

          {/* Section header: Rankings */}
          <SubHeader label="Rankings" />

          <Row
            label="Position rank"
            valueA={<span className="font-mono">{a.position}{a.pos_rank}</span>}
            valueB={<span className="font-mono">{b.position}{b.pos_rank}</span>}
            winner={wins.posRank}
            colorsA={colorsA}
            colorsB={colorsB}
          />
          <Row
            label="Overall rank"
            valueA={<span className="font-mono">#{a.main_rank}</span>}
            valueB={<span className="font-mono">#{b.main_rank}</span>}
            winner={wins.mainRank}
            colorsA={colorsA}
            colorsB={colorsB}
          />
          <Row
            label="Composite score"
            valueA={<span className="font-mono tabular-nums">{a.composite_score.toFixed(2)}</span>}
            valueB={<span className="font-mono tabular-nums">{b.composite_score.toFixed(2)}</span>}
            winner={wins.composite}
            colorsA={colorsA}
            colorsB={colorsB}
            emphasis
          />

          {/* Section header: Projections */}
          <SubHeader label="Projections" />

          <Row
            label="Per game (p50)"
            valueA={<span className="font-mono tabular-nums">{a.proj_p50.toFixed(2)}</span>}
            valueB={<span className="font-mono tabular-nums">{b.proj_p50.toFixed(2)}</span>}
            winner={wins.pergame}
            colorsA={colorsA}
            colorsB={colorsB}
            emphasis
          />
          <Row
            label="Per game range"
            valueA={<span className="font-mono tabular-nums text-xs">{a.proj_p10.toFixed(1)}–{a.proj_p90.toFixed(1)}</span>}
            valueB={<span className="font-mono tabular-nums text-xs">{b.proj_p10.toFixed(1)}–{b.proj_p90.toFixed(1)}</span>}
            winner={null}
            colorsA={colorsA}
            colorsB={colorsB}
          />
          <Row
            label={`Season total (${a.expected_games}/${b.expected_games}G)`}
            valueA={<span className="font-mono tabular-nums">{a.p50_total.toFixed(1)}</span>}
            valueB={<span className="font-mono tabular-nums">{b.p50_total.toFixed(1)}</span>}
            winner={wins.total}
            colorsA={colorsA}
            colorsB={colorsB}
            emphasis
          />
          <Row
            label="Season total range"
            valueA={<span className="font-mono tabular-nums text-xs">{a.p10_total.toFixed(0)}–{a.p90_total.toFixed(0)}</span>}
            valueB={<span className="font-mono tabular-nums text-xs">{b.p10_total.toFixed(0)}–{b.p90_total.toFixed(0)}</span>}
            winner={null}
            colorsA={colorsA}
            colorsB={colorsB}
          />
          <Row
            label="Uncertainty"
            valueA={<span className="font-mono tabular-nums">{a.uncertainty_total.toFixed(0)}</span>}
            valueB={<span className="font-mono tabular-nums">{b.uncertainty_total.toFixed(0)}</span>}
            winner={null}
            colorsA={colorsA}
            colorsB={colorsB}
          />

          {/* Section header: Strategy ranks */}
          <SubHeader label="Strategy Ranks" />

          <Row
            label="Median"
            valueA={<span className="font-mono">#{ranksA.median}</span>}
            valueB={<span className="font-mono">#{ranksB.median}</span>}
            winner={wins.median}
            colorsA={colorsA}
            colorsB={colorsB}
          />
          <Row
            label="Floor"
            valueA={<span className="font-mono">#{ranksA.floor}</span>}
            valueB={<span className="font-mono">#{ranksB.floor}</span>}
            winner={wins.floor}
            colorsA={colorsA}
            colorsB={colorsB}
          />
          <Row
            label="Ceiling"
            valueA={<span className="font-mono">#{ranksA.ceiling}</span>}
            valueB={<span className="font-mono">#{ranksB.ceiling}</span>}
            winner={wins.ceiling}
            colorsA={colorsA}
            colorsB={colorsB}
          />
          <Row
            label="Efficiency"
            valueA={<span className="font-mono">#{ranksA.sharpe}</span>}
            valueB={<span className="font-mono">#{ranksB.sharpe}</span>}
            winner={wins.sharpe}
            colorsA={colorsA}
            colorsB={colorsB}
          />
        </div>
      </div>
    </div>
  );
}

function cmp(av: number, bv: number, mode: 'higher' | 'lower'): 'a' | 'b' | null {
  if (av === bv) return null;
  const aWins = mode === 'higher' ? av > bv : av < bv;
  return aWins ? 'a' : 'b';
}

function Row({
  label,
  valueA,
  valueB,
  winner,
  colorsA,
  colorsB,
  emphasis,
}: {
  label: string;
  valueA: React.ReactNode;
  valueB: React.ReactNode;
  winner: 'a' | 'b' | null;
  colorsA: TeamColors;
  colorsB: TeamColors;
  emphasis?: boolean;
}) {
  const aWins = winner === 'a';
  const bWins = winner === 'b';

  const cellAStyle = aWins
    ? {
        color: colorsA.primary,
        textShadow: `0 0 12px ${colorsA.primary}55`,
        background: `linear-gradient(90deg, ${colorsA.primary}10, transparent)`,
      }
    : undefined;

  const cellBStyle = bWins
    ? {
        color: colorsB.primary,
        textShadow: `0 0 12px ${colorsB.primary}55`,
        background: `linear-gradient(90deg, ${colorsB.primary}10, transparent)`,
      }
    : undefined;

  return (
    <>
      <div className={`px-3 py-2 border-r border-b border-border/60 text-muted-foreground ${emphasis ? 'font-medium' : ''}`}>
        {label}
      </div>
      <div
        className={`px-3 py-2 border-r border-b border-border/60 transition-colors ${
          emphasis ? 'font-semibold text-base' : ''
        } ${aWins ? 'font-bold' : winner === 'b' ? 'text-muted-foreground' : ''}`}
        style={cellAStyle}
      >
        {valueA}
      </div>
      <div
        className={`px-3 py-2 border-b border-border/60 transition-colors ${
          emphasis ? 'font-semibold text-base' : ''
        } ${bWins ? 'font-bold' : winner === 'a' ? 'text-muted-foreground' : ''}`}
        style={cellBStyle}
      >
        {valueB}
      </div>
    </>
  );
}

function SubHeader({ label }: { label: string }) {
  return (
    <>
      <div className="col-span-3 px-3 py-1.5 border-b border-border bg-muted/20 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
        {label}
      </div>
    </>
  );
}

function variantRanks(allPlayers: Player[], player: Player) {
  const byMedian = [...allPlayers].sort((a, b) => b.vor_median - a.vor_median);
  const byFloor = [...allPlayers].sort((a, b) => b.vor_floor - a.vor_floor);
  const byCeiling = [...allPlayers].sort((a, b) => b.vor_ceiling - a.vor_ceiling);
  const bySharpe = [...allPlayers].sort((a, b) => b.sharpe - a.sharpe);
  const idx = (list: Player[]) =>
    list.findIndex((p) => p.player_display_name === player.player_display_name) + 1;
  return {
    median: idx(byMedian),
    floor: idx(byFloor),
    ceiling: idx(byCeiling),
    sharpe: idx(bySharpe),
  };
}

/* -------- Section marker (reusable from other pages) -------- */

function SectionMarker({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px w-6 bg-primary shadow-[0_0_6px_var(--neon-glow)]" />
      <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">
        {label}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* -------- AI summary section -------- */

function AISummarySection({ a, b }: { a: Player; b: Player }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    "This feature will come later"

    setLoading(true);
    setSummary("AI Generated Summary is not yet available. Stay tuned for future updates!");
    setError(null);

  }

  return (
    <div>
      <SectionMarker label="AI Analysis" />
      <div className="rounded-md border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Comparison
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Generated summary highlighting key tradeoffs and context.
            </div>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={!loading ? { boxShadow: '0 0 16px var(--neon-glow)' } : undefined}
          >
            {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate'}
          </button>
        </div>

        {error && (
          <div className="mt-3 text-sm text-destructive p-3 rounded bg-destructive/10 border border-destructive/20">
            {error}
          </div>
        )}

        {summary && (
          <div className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{summary}</div>
        )}

        {!summary && !error && !loading && (
          <div className="mt-3 text-sm text-muted-foreground italic">
            Click Generate to produce a comparison summary.
          </div>
        )}
      </div>
    </div>
  );
}