'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Search } from 'lucide-react';
import type { Player } from '@/lib/players';

type SortKey =
  | 'main_rank'
  | 'pos_rank'
  | 'proj_p50'
  | 'p50_total'
  | 'uncertainty_total'
  | 'composite_score';

type SortDir = 'asc' | 'desc';

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE'] as const;
type PositionFilter = (typeof POSITIONS)[number];

export function RankingsTable({ players }: { players: Player[] }) {
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<PositionFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('main_rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    let result = players;

    if (position !== 'ALL') {
      result = result.filter((p) => p.position === position);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((p) =>
        p.player_display_name.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [players, query, position, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Rank columns default ascending (1 = best); everything else descending
      setSortDir(key === 'main_rank' || key === 'pos_rank' ? 'asc' : 'desc');
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search players…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex gap-1">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                position === pos
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} player{filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <ColHeader label="Rank" sortKey="main_rank" current={sortKey} dir={sortDir} onClick={toggleSort} align="left" />
                <th className="px-3 py-2 text-left font-medium">Player</th>
                <th className="px-3 py-2 text-left font-medium">Pos</th>
                <ColHeader label="Pos Rk" sortKey="pos_rank" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                <ColHeader label="P50/Game" sortKey="proj_p50" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                <ColHeader label="Total" sortKey="p50_total" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                <th className="px-3 py-2 text-right font-medium">Range</th>
                <ColHeader label="Uncertainty" sortKey="uncertainty_total" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                <ColHeader label="Composite" sortKey="composite_score" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <PlayerRow key={p.player_display_name + '-' + p.main_rank} player={p} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No players match your filters.
        </div>
      )}
    </div>
  );
}

function ColHeader({
  label,
  sortKey,
  current,
  dir,
  onClick,
  align,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  align: 'left' | 'right';
}) {
  const isActive = current === sortKey;
  return (
    <th className={`px-3 py-2 font-medium text-${align}`}>
      <button
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
          isActive ? 'text-foreground' : ''
        }`}
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'opacity-100' : 'opacity-40'}`} />
        {isActive && (
          <span className="ml-0.5 text-[10px]">{dir === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    </th>
  );
}

function PlayerRow({ player }: { player: Player }) {

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2 font-mono text-muted-foreground">{player.main_rank}</td>
      <td className="px-3 py-2">
        <Link
          href={`/player/${encodeURIComponent(player.player_display_name)}`}
          className="font-medium hover:underline"
        >
          {player.player_display_name}
        </Link>
      </td>
      <td className="px-3 py-2">
        <PositionBadge position={player.position} />
      </td>
      <td className="px-3 py-2 text-right font-mono">{player.pos_rank}</td>
      <td className="px-3 py-2 text-right font-mono">{player.proj_p50.toFixed(2)}</td>
      <td className="px-3 py-2 text-right font-mono font-medium">{player.p50_total.toFixed(1)}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
        {player.p10_total.toFixed(0)}–{player.p90_total.toFixed(0)}
      </td>
      <td className="px-3 py-2 text-right font-mono text-xs">{player.uncertainty_total.toFixed(0)}</td>
      <td className="px-3 py-2 text-right font-mono font-medium">{player.composite_score.toFixed(2)}</td>
    </tr>
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
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${colors[position]}`}>
      {position}
    </span>
  );
}
