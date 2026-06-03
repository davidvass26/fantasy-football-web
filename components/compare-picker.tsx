'use client';

// components/compare-picker.tsx
// Search-as-you-type picker for two players, then renders side-by-side cards.

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Sparkles } from 'lucide-react';
import type { Player } from '@/lib/players';
import { getTeamLogoUrl } from '@/lib/team-logos';

type Props = {
  players: Player[];
  initialParams: Promise<{ a?: string; b?: string }>;
};

export function ComparePicker({ players, initialParams }: Props) {
  const params = use(initialParams);
  const router = useRouter();
  const searchParams = useSearchParams();

  const findPlayer = (name?: string): Player | null =>
    name ? players.find((p) => p.player_display_name === decodeURIComponent(name)) ?? null : null;

  const [playerA, setPlayerA] = useState<Player | null>(findPlayer(params.a));
  const [playerB, setPlayerB] = useState<Player | null>(findPlayer(params.b));

  // Sync URL when selections change so the comparison is shareable
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
    return (
      <div className="rounded-md border bg-card p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
        <SelectedPlayerCard player={selected} onClear={() => onSelect(null)} />
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
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
          className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 flex items-center justify-between"
              >
                <span>{p.player_display_name}</span>
                <span className="text-xs text-muted-foreground">
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
}: {
  player: Player;
  onClear: () => void;
}) {
  const logoUrl = getTeamLogoUrl(player.team);
  return (
    <div className="flex items-center gap-3">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={player.team} className="w-10 h-10 object-contain shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <Link
          href={`/player/${encodeURIComponent(player.player_display_name)}`}
          className="font-semibold hover:underline"
        >
          {player.player_display_name}
        </Link>
        <div className="text-xs text-muted-foreground">
          {player.team} · {player.position}{player.pos_rank} · Age {Math.round(player.age)}
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

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="grid grid-cols-3 text-sm">
        {/* Header row */}
        <div className="p-3 bg-muted/40 font-medium text-xs uppercase tracking-wide text-muted-foreground border-r border-b">
          Metric
        </div>
        <div className="p-3 bg-muted/40 font-semibold border-r border-b">
          {a.player_display_name}
        </div>
        <div className="p-3 bg-muted/40 font-semibold border-b">
          {b.player_display_name}
        </div>

        <Row label="Position rank">
          <span>{a.position}{a.pos_rank}</span>
          <span>{b.position}{b.pos_rank}</span>
        </Row>
        <Row label="Overall rank">
          <span>#{a.main_rank}</span>
          <span>#{b.main_rank}</span>
        </Row>
        <Row label="Composite score">
          <span className="font-mono">{a.composite_score.toFixed(2)}</span>
          <span className="font-mono">{b.composite_score.toFixed(2)}</span>
        </Row>

        <Row label="Per game (p50)" emphasis>
          <span className="font-mono">{a.proj_p50.toFixed(2)}</span>
          <span className="font-mono">{b.proj_p50.toFixed(2)}</span>
        </Row>
        <Row label="Per game range (p10–p90)">
          <span className="font-mono text-xs">{a.proj_p10.toFixed(1)}–{a.proj_p90.toFixed(1)}</span>
          <span className="font-mono text-xs">{b.proj_p10.toFixed(1)}–{b.proj_p90.toFixed(1)}</span>
        </Row>

        <Row label={`Season total (${a.expected_games}/${b.expected_games} games)`} emphasis>
          <span className="font-mono">{a.p50_total.toFixed(1)}</span>
          <span className="font-mono">{b.p50_total.toFixed(1)}</span>
        </Row>
        <Row label="Season total range">
          <span className="font-mono text-xs">{a.p10_total.toFixed(0)}–{a.p90_total.toFixed(0)}</span>
          <span className="font-mono text-xs">{b.p10_total.toFixed(0)}–{b.p90_total.toFixed(0)}</span>
        </Row>
        <Row label="Uncertainty">
          <span className="font-mono">{a.uncertainty_total.toFixed(0)}</span>
          <span className="font-mono">{b.uncertainty_total.toFixed(0)}</span>
        </Row>

        <Row label="Median rank">
          <span>#{ranksA.median}</span>
          <span>#{ranksB.median}</span>
        </Row>
        <Row label="Floor rank">
          <span>#{ranksA.floor}</span>
          <span>#{ranksB.floor}</span>
        </Row>
        <Row label="Ceiling rank">
          <span>#{ranksA.ceiling}</span>
          <span>#{ranksB.ceiling}</span>
        </Row>
        <Row label="Efficiency rank">
          <span>#{ranksA.sharpe}</span>
          <span>#{ranksB.sharpe}</span>
        </Row>
      </div>
    </div>
  );
}

function Row({
  label,
  emphasis,
  children,
}: {
  label: string;
  emphasis?: boolean;
  children: React.ReactNode;
}) {
  const [colA, colB] = Array.isArray(children) ? children : [null, null];
  return (
    <>
      <div className={`px-3 py-2 border-r border-b text-muted-foreground ${emphasis ? 'font-medium text-foreground' : ''}`}>
        {label}
      </div>
      <div className={`px-3 py-2 border-r border-b ${emphasis ? 'font-medium' : ''}`}>{colA}</div>
      <div className={`px-3 py-2 border-b ${emphasis ? 'font-medium' : ''}`}>{colB}</div>
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

/* -------- AI summary section (placeholder) -------- */

function AISummarySection({ a, b }: { a: Player; b: Player }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch('/api/compare-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a, b }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      setSummary(data.summary ?? '');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Comparison
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Generated summary highlighting key tradeoffs and context.
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Generating...' : summary ? 'Regenerate' : 'Generate'}
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
  );
}