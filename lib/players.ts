// src/lib/players.ts
// Data layer for player rankings. Loads final_ranking.csv at build time and
// exposes a typed Player[] for use in pages and components.

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

/**
 * One player row from final_ranking.csv. Field names match the CSV exactly.
 * If you change the CSV schema, update this type too.
 */
export type Player = {
  main_rank: number;
  pos_rank: number;
  player_display_name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  age: number;
  is_rookie: 0 | 1;
  prev_fp_per_game: number | null;
  proj_p10: number;
  proj_p50: number;
  proj_p90: number;
  p10_total: number;
  p50_total: number;
  p90_total: number;
  uncertainty_total: number;
  vor_median: number;
  vor_floor: number;
  vor_ceiling: number;
  sharpe: number;
  composite_score: number;
  expected_games: number;
  // Override metadata (may be empty strings for most rows)
  override_applied?: string;
  override_note?: string;
};

/**
 * Load and parse final_ranking.csv from public/data/.
 * Runs at build time on the server. Don't call this from client components.
 */
export function loadPlayers(): Player[] {
  const csvPath = path.join(process.cwd(), 'public', 'data', 'final_ranking.csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.error('CSV parse errors:', parsed.errors);
  }

  return parsed.data
    .map((row): Player => ({
      main_rank: Number(row.main_rank),
      pos_rank: Number(row.pos_rank),
      player_display_name: row.player_display_name,
      position: row.position as Player['position'],
      age: Number(row.age),
      is_rookie: Number(row.is_rookie) as 0 | 1,
      prev_fp_per_game: row.prev_fp_per_game ? Number(row.prev_fp_per_game) : null,
      proj_p10: Number(row.proj_p10),
      proj_p50: Number(row.proj_p50),
      proj_p90: Number(row.proj_p90),
      p10_total: Number(row.p10_total),
      p50_total: Number(row.p50_total),
      p90_total: Number(row.p90_total),
      uncertainty_total: Number(row.uncertainty_total),
      vor_median: Number(row.vor_median),
      vor_floor: Number(row.vor_floor),
      vor_ceiling: Number(row.vor_ceiling),
      sharpe: Number(row.sharpe),
      composite_score: Number(row.composite_score),
      expected_games: Number(row.expected_games),
      override_applied: row.override_applied || undefined,
      override_note: row.override_note || undefined,
    }))
    // Only keep fantasy-relevant rows. The CSV includes some low-projection
    // rows we don't want to display.
    .filter((p) => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
    .filter((p) => !isNaN(p.main_rank))
    .sort((a, b) => a.main_rank - b.main_rank);
}

/**
 * Convenience: best players at a given position.
 */
export function loadByPosition(position: Player['position']): Player[] {
  return loadPlayers().filter((p) => p.position === position);
}