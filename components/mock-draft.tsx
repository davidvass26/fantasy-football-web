'use client';

// components/mock-draft.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import Link from 'next/link'
import type { Player } from '@/lib/players';
import {
  SUPPORTED_TEAM_COUNTS,
  type TeamCount,
  NUM_ROUNDS,
  totalPicks,
  type DraftState,
  type Pick,
  buildRoster,
  isDraftComplete,
  isUserTurn,
  makeAiPick,
  makeUserPick,
  teamOnTheClock,
  picksForTeam,
  roundAndPickInRound,
} from '@/lib/mock-draft';

type Phase = 'setup' | 'drafting' | 'complete';
const AI_PICK_DELAY_MS = 800;

export function MockDraft({ players }: { players: Player[] }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [numTeams, setNumTeams] = useState<TeamCount>(12);
  const [userTeam, setUserTeam] = useState(6);
  const [draftState, setDraftState] = useState<DraftState | null>(null);

  function startDraft() {
    const safeUserTeam = Math.min(userTeam, numTeams);
    setUserTeam(safeUserTeam);
    setDraftState({ numTeams, userTeam: safeUserTeam, picks: [], currentPick: 1 });
    setPhase('drafting');
  }

  function resetDraft() {
    setDraftState(null);
    setPhase('setup');
  }

  if (phase === 'setup' || !draftState) {
    return (
      <SetupScreen
        numTeams={numTeams}
        setNumTeams={(n) => {
          setNumTeams(n);
          if (userTeam > n) setUserTeam(Math.ceil(n / 2));
        }}
        userTeam={userTeam}
        setUserTeam={setUserTeam}
        onStart={startDraft}
      />
    );
  }

  return (
    <DraftRoom
      players={players}
      state={draftState}
      onStateChange={setDraftState}
      onReset={resetDraft}
      onComplete={() => setPhase('complete')}
      isComplete={phase === 'complete'}
    />
  );
}

/* -------- Setup screen -------- */

function SetupScreen({
  numTeams,
  setNumTeams,
  userTeam,
  setUserTeam,
  onStart,
}: {
  numTeams: TeamCount;
  setNumTeams: (n: TeamCount) => void;
  userTeam: number;
  setUserTeam: (n: number) => void;
  onStart: () => void;
}) {
  const safeUserTeam = Math.min(userTeam, numTeams);

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-md border bg-card p-6 space-y-6">
        <div>
          <div className="text-sm font-medium mb-2">League size</div>
          <div className="grid grid-cols-4 gap-2">
            {SUPPORTED_TEAM_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setNumTeams(n)}
                className={`py-2 rounded-md border text-sm font-medium transition-colors ${
                  numTeams === n
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Your draft slot</div>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(numTeams, 7)}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: numTeams }, (_, i) => i + 1).map((slot) => (
              <button
                key={slot}
                onClick={() => setUserTeam(slot)}
                className={`py-2 rounded-md border text-sm font-medium transition-colors ${
                  safeUserTeam === slot
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            You will pick {picksForTeam(safeUserTeam, numTeams).slice(0, 3).join(', ')}…
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          {NUM_ROUNDS} rounds · {totalPicks(numTeams)} total picks · 1QB / 2RB / 2WR / 1TE / 1FLEX / 6BENCH
        </div>

        <button
          onClick={onStart}
          className="w-full py-3 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          Start draft
        </button>
      </div>
    </div>
  );
}

/* -------- Draft room -------- */

function DraftRoom({
  players,
  state,
  onStateChange,
  onReset,
  onComplete,
  isComplete,
}: {
  players: Player[];
  state: DraftState;
  onStateChange: (s: DraftState) => void;
  onReset: () => void;
  onComplete: () => void;
  isComplete: boolean;
}) {
  const draftedNames = useMemo(
    () => new Set(state.picks.map((p) => p.player.player_display_name)),
    [state.picks]
  );

  const availablePlayers = useMemo(
    () => players.filter((p) => !draftedNames.has(p.player_display_name)),
    [players, draftedNames]
  );

  const userIsOnClock = isUserTurn(state);
  const onTheClockTeam = teamOnTheClock(state.currentPick, state.numTeams);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isDraftComplete(state)) {
      onComplete();
      return;
    }
    if (userIsOnClock) return;

    timeoutRef.current = setTimeout(() => {
      onStateChange(makeAiPick(state, availablePlayers));
    }, AI_PICK_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPick, userIsOnClock]);

  function handleUserPick(player: Player) {
    if (!userIsOnClock) return;
    onStateChange(makeUserPick(state, player));
  }

  const userPicks = state.picks.filter((p) => p.team === state.userTeam);

  return (
    <div className="space-y-6">
      <Status
        state={state}
        onTheClockTeam={onTheClockTeam}
        userIsOnClock={userIsOnClock}
        isComplete={isComplete}
        onReset={onReset}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <AvailablePlayersPanel
            available={availablePlayers}
            onPick={handleUserPick}
            canPick={userIsOnClock && !isComplete}
          />
          <DraftBoard
            picks={state.picks}
            userTeam={state.userTeam}
            numTeams={state.numTeams}
          />
        </div>

        <div>
          <UserRoster picks={userPicks} />
        </div>
      </div>
    </div>
  );
}

/* -------- Status bar -------- */

function Status({
  state,
  onTheClockTeam,
  userIsOnClock,
  isComplete,
  onReset,
}: {
  state: DraftState;
  onTheClockTeam: number;
  userIsOnClock: boolean;
  isComplete: boolean;
  onReset: () => void;
}) {
  const { round, pickInRound } = roundAndPickInRound(state.currentPick, state.numTeams);
  const total = totalPicks(state.numTeams);

  let label = '';
  if (isComplete) {
    label = 'Draft complete';
  } else if (userIsOnClock) {
    label = 'You are on the clock';
  } else {
    label = `Team ${onTheClockTeam} is on the clock`;
  }

  return (
    <div className="rounded-md border bg-card p-4 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {isComplete
            ? `Pick ${total}/${total}`
            : `Round ${round} · Pick ${pickInRound}/${state.numTeams} (Overall ${state.currentPick})`}
        </div>
        <div className={`text-lg font-semibold mt-1 ${userIsOnClock ? 'text-green-600 dark:text-green-400' : ''}`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          You are Team {state.userTeam} of {state.numTeams}
        </div>
      </div>
      <button
        onClick={onReset}
        className="px-3 py-2 rounded-md border bg-background text-sm hover:bg-muted transition-colors inline-flex items-center gap-1.5"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>
    </div>
  );
}

/* -------- Available players panel -------- */

function AvailablePlayersPanel({
  available,
  onPick,
  canPick,
}: {
  available: Player[];
  onPick: (p: Player) => void;
  canPick: boolean;
}) {
  const [query, setQuery] = useState('');
  const [posFilter, setPosFilter] = useState<'ALL' | 'QB' | 'RB' | 'WR' | 'TE'>('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available
      .filter((p) => posFilter === 'ALL' || p.position === posFilter)
      .filter((p) => !q || p.player_display_name.toLowerCase().includes(q))
      .sort((a, b) => b.composite_score - a.composite_score)
      .slice(0, 50);
  }, [available, query, posFilter]);

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="p-3 border-b flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {(['ALL', 'QB', 'RB', 'WR', 'TE'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPosFilter(p)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                posFilter === p
                  ? 'bg-foreground text-background'
                  : 'bg-muted hover:bg-muted/70'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card border-b">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Pos</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Composite</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.player_display_name} className="border-b hover:bg-muted/30">
                <td className="px-3 py-2 text-muted-foreground">{p.main_rank}</td>
                <td className="px-3 py-2 font-medium">
                    <Link
                        href={`/player/${encodeURIComponent(p.player_display_name)}`}
                        target="_blank"
                        className="hover:underline"
                    >
                        {p.player_display_name}
                    </Link>
                    </td>
                <td className="px-3 py-2">
                  <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-muted">
                    {p.position}{p.pos_rank}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">{p.p50_total.toFixed(0)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{p.composite_score.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => onPick(p)}
                    disabled={!canPick}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                  >
                    Draft
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------- Draft board (rounds × teams grid) -------- */

function DraftBoard({
  picks,
  userTeam,
  numTeams,
}: {
  picks: Pick[];
  userTeam: number;
  numTeams: TeamCount;
}) {
  const pickLookup: Record<string, Pick> = {};
  for (const p of picks) {
    pickLookup[`${p.round}-${p.team}`] = p;
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="p-3 border-b">
        <div className="font-semibold">Draft Board</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-2 py-1.5 text-left text-muted-foreground">R</th>
              {Array.from({ length: numTeams }, (_, i) => i + 1).map((team) => (
                <th
                  key={team}
                  className={`px-2 py-1.5 text-center min-w-[80px] ${team === userTeam ? 'text-green-600 dark:text-green-400 font-bold' : 'text-muted-foreground'}`}
                >
                  T{team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: NUM_ROUNDS }, (_, i) => i + 1).map((round) => (
              <tr key={round} className="border-t">
                <td className="px-2 py-1.5 text-muted-foreground font-medium">{round}</td>
                {Array.from({ length: numTeams }, (_, i) => i + 1).map((team) => {
                  const p = pickLookup[`${round}-${team}`];
                  const isUserCell = team === userTeam;
                  return (
                    <td
                      key={team}
                      className={`px-2 py-1.5 text-center border-l ${isUserCell ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                    >
                      {p ? (
                        <Link
                            href={`/player/${encodeURIComponent(p.player.player_display_name)}`}
                            target="_blank"
                            className="block hover:underline"
                        >
                            <div className="truncate font-medium" title={p.player.player_display_name}>
                            {shortName(p.player.player_display_name)}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                            {p.player.position}
                            </div>
                        </Link>
                        ) : (
                        <span className="text-muted-foreground/30">—</span>
                        )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function shortName(full: string) {
  const parts = full.split(' ');
  if (parts.length < 2) return full;
  return `${parts[0].charAt(0)}.${parts.slice(1).join(' ')}`;
}

/* -------- User roster panel -------- */

function UserRoster({ picks }: { picks: Pick[] }) {
  const roster = buildRoster(picks);
  const totalProj = picks.reduce((sum, p) => sum + p.player.p50_total, 0);

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="p-3 border-b">
        <div className="font-semibold">Your roster</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {picks.length} picks · {totalProj.toFixed(0)} projected total
        </div>
      </div>
      <div className="divide-y">
        {roster.map((slot, i) => (
          <div key={i} className="px-3 py-2 flex items-center justify-between text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground w-14 shrink-0">
              {slot.slot}
            </div>
            <div className="flex-1 text-right">
              {slot.player ? (
                <Link
                    href={`/player/${encodeURIComponent(slot.player.player_display_name)}`}
                    target="_blank"
                    className="block hover:underline"
                >
                    <div className="font-medium">{slot.player.player_display_name}</div>
                    <div className="text-xs text-muted-foreground">
                    {slot.player.position}{slot.player.pos_rank} · {slot.player.team} · {slot.player.p50_total.toFixed(0)} pts
                    </div>
                </Link>
                ) : (
                <span className="text-muted-foreground/40">empty</span>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}