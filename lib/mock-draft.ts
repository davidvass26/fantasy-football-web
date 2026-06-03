// lib/mock-draft.ts
// Pure functions for the mock draft. No React, no DOM.
//
// Configurable league size (8/10/12/14 teams), 13 rounds:
// 1 QB / 2 RB / 2 WR / 1 TE / 1 FLEX (RB/WR/TE) / 6 BENCH

import type { Player } from './players';

export const SUPPORTED_TEAM_COUNTS = [8, 10, 12, 14] as const;
export type TeamCount = typeof SUPPORTED_TEAM_COUNTS[number];

export const NUM_ROUNDS = 13;

export const ROSTER_SLOTS = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1, // RB/WR/TE
  BENCH: 6,
};

export type Pick = {
  overall: number;
  round: number;
  pickInRound: number;
  team: number;
  player: Player;
};

export type DraftState = {
  numTeams: TeamCount;
  userTeam: number;
  picks: Pick[];
  currentPick: number;
};

export function totalPicks(numTeams: TeamCount): number {
  return numTeams * NUM_ROUNDS;
}

/** Snake order: odd rounds pick 1..N, even rounds pick N..1. */
export function teamOnTheClock(overallPick: number, numTeams: TeamCount): number {
  const round = Math.ceil(overallPick / numTeams);
  const pickInRound = ((overallPick - 1) % numTeams) + 1;
  return round % 2 === 1 ? pickInRound : numTeams - pickInRound + 1;
}

export function roundAndPickInRound(overallPick: number, numTeams: TeamCount) {
  const round = Math.ceil(overallPick / numTeams);
  const pickInRound = ((overallPick - 1) % numTeams) + 1;
  return { round, pickInRound };
}

/** All overall pick numbers a team gets in a snake draft. */
export function picksForTeam(team: number, numTeams: TeamCount): number[] {
  const picks: number[] = [];
  for (let r = 1; r <= NUM_ROUNDS; r++) {
    const pickInRound = r % 2 === 1 ? team : numTeams - team + 1;
    picks.push((r - 1) * numTeams + pickInRound);
  }
  return picks;
}

export type RosterSlot = {
  slot: 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'BENCH';
  player: Player | null;
};

/** Fill drafted picks into roster slots, best players going to starting slots first. */
export function buildRoster(picks: Pick[]): RosterSlot[] {
  const slots: RosterSlot[] = [
    ...Array(ROSTER_SLOTS.QB).fill(0).map(() => ({ slot: 'QB' as const, player: null })),
    ...Array(ROSTER_SLOTS.RB).fill(0).map(() => ({ slot: 'RB' as const, player: null })),
    ...Array(ROSTER_SLOTS.WR).fill(0).map(() => ({ slot: 'WR' as const, player: null })),
    ...Array(ROSTER_SLOTS.TE).fill(0).map(() => ({ slot: 'TE' as const, player: null })),
    ...Array(ROSTER_SLOTS.FLEX).fill(0).map(() => ({ slot: 'FLEX' as const, player: null })),
    ...Array(ROSTER_SLOTS.BENCH).fill(0).map(() => ({ slot: 'BENCH' as const, player: null })),
  ];

  const sorted = [...picks].sort((a, b) => b.player.composite_score - a.player.composite_score);

  for (const pick of sorted) {
    const pos = pick.player.position;
    const positionSlot = slots.find((s) => s.slot === pos && s.player === null);
    if (positionSlot) {
      positionSlot.player = pick.player;
      continue;
    }
    if (pos === 'RB' || pos === 'WR' || pos === 'TE') {
      const flexSlot = slots.find((s) => s.slot === 'FLEX' && s.player === null);
      if (flexSlot) {
        flexSlot.player = pick.player;
        continue;
      }
    }
    const benchSlot = slots.find((s) => s.slot === 'BENCH' && s.player === null);
    if (benchSlot) benchSlot.player = pick.player;
  }

  return slots;
}

function positionCounts(picks: Pick[]) {
  const counts: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  for (const p of picks) counts[p.player.position] = (counts[p.player.position] || 0) + 1;
  return counts;
}

const POSITION_CAPS = { QB: 2, RB: 7, WR: 7, TE: 2 };

function isPositionViable(position: string, picks: Pick[]): boolean {
  const counts = positionCounts(picks);
  const cap = POSITION_CAPS[position as keyof typeof POSITION_CAPS] ?? 99;
  return (counts[position] || 0) < cap;
}

/** Weighted random pick from top 10 available, filtered for sane position counts. */
export function aiPick(availablePlayers: Player[], teamPicks: Pick[]): Player {
  const viable = availablePlayers.filter((p) => isPositionViable(p.position, teamPicks));
  const sorted = [...viable].sort((a, b) => b.composite_score - a.composite_score);
  const topN = sorted.slice(0, 10);

  if (topN.length === 0) {
    return [...availablePlayers].sort((a, b) => b.composite_score - a.composite_score)[0];
  }

  const weights = topN.map((_, i) => topN.length - i);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < topN.length; i++) {
    r -= weights[i];
    if (r <= 0) return topN[i];
  }
  return topN[topN.length - 1];
}

export function makeAiPick(state: DraftState, availablePlayers: Player[]): DraftState {
  const team = teamOnTheClock(state.currentPick, state.numTeams);
  const teamPicks = state.picks.filter((p) => p.team === team);
  const player = aiPick(availablePlayers, teamPicks);
  const { round, pickInRound } = roundAndPickInRound(state.currentPick, state.numTeams);

  return {
    ...state,
    picks: [...state.picks, { overall: state.currentPick, round, pickInRound, team, player }],
    currentPick: state.currentPick + 1,
  };
}

export function makeUserPick(state: DraftState, player: Player): DraftState {
  const team = teamOnTheClock(state.currentPick, state.numTeams);
  const { round, pickInRound } = roundAndPickInRound(state.currentPick, state.numTeams);

  return {
    ...state,
    picks: [...state.picks, { overall: state.currentPick, round, pickInRound, team, player }],
    currentPick: state.currentPick + 1,
  };
}

export function isDraftComplete(state: DraftState): boolean {
  return state.currentPick > totalPicks(state.numTeams);
}

export function isUserTurn(state: DraftState): boolean {
  if (isDraftComplete(state)) return false;
  return teamOnTheClock(state.currentPick, state.numTeams) === state.userTeam;
}