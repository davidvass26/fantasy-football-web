'use client';

// components/mock-draft.tsx
// Mock draft UI with neon-themed status, on-the-clock pulse, and color-coded position badges.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { Player } from '@/lib/players';
import { playerUrl } from '@/lib/player-url';
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
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
            League size
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SUPPORTED_TEAM_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setNumTeams(n)}
                className={`py-2 rounded-md border text-sm font-mono tabular-nums font-medium transition-all ${
                  numTeams === n
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_16px_var(--neon-glow)]'
                    : 'bg-background border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
            Your draft slot
          </div>
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
                className={`py-2 rounded-md border text-sm font-mono tabular-nums font-medium transition-all ${
                  safeUserTeam === slot
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_16px_var(--neon-glow)]'
                    : 'bg-background border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2 font-mono">
            You will pick {picksForTeam(safeUserTeam, numTeams).slice(0, 3).join(', ')}…
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t border-border pt-3 font-mono">
          {NUM_ROUNDS} rounds · {totalPicks(numTeams)} total picks · 1QB / 2RB / 2WR / 1TE / 1FLEX / 6BENCH
        </div>

        <button
          onClick={onStart}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold transition-all hover:scale-[1.01]"
          style={{ boxShadow: '0 0 24px var(--neon-glow)' }}
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

  return (
    <div
      className={`relative rounded-md border bg-card p-4 flex items-center justify-between overflow-hidden transition-all ${
        userIsOnClock ? 'border-primary' : 'border-border'
      }`}
      style={
        userIsOnClock
          ? { boxShadow: '0 0 24px var(--neon-glow), inset 0 0 16px oklch(0.86 0.24 145 / 8%)' }
          : undefined
      }
    >
      {/* Animated scan line on the user's turn */}
      {userIsOnClock && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
      )}

      <div className="relative">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
          {isComplete
            ? `Pick ${total}/${total}`
            : `Round ${round} · Pick ${pickInRound}/${state.numTeams} · Overall ${state.currentPick}`}
        </div>

        <div className="mt-2 flex items-center gap-2.5">
          {!isComplete && (
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  userIsOnClock ? 'animate-ping bg-primary' : 'bg-muted-foreground'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  userIsOnClock ? 'bg-primary' : 'bg-muted-foreground'
                }`}
              />
            </span>
          )}
          <div
            className={`text-xl font-bold tracking-tight ${
              userIsOnClock ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
            }`}
            style={userIsOnClock ? { textShadow: '0 0 16px var(--neon-glow)' } : undefined}
          >
            {isComplete
              ? 'Draft complete'
              : userIsOnClock
              ? 'YOU ARE ON THE CLOCK'
              : `Team ${onTheClockTeam} thinking…`}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 font-mono">
          You are Team {state.userTeam} of {state.numTeams}
        </div>
      </div>

      <button
        onClick={onReset}
        className="relative px-3 py-2 rounded-md border border-border bg-background text-sm hover:border-primary/40 hover:text-primary transition-all inline-flex items-center gap-1.5"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>

      <style>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-scan {
          animation: scan 2.5s linear infinite;
        }
      `}</style>
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
      <div className="p-3 border-b border-border flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
          />
        </div>
        <div className="flex gap-1">
          {(['ALL', 'QB', 'RB', 'WR', 'TE'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPosFilter(p)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                posFilter === p
                  ? 'bg-primary text-primary-foreground shadow-[0_0_12px_var(--neon-glow)]'
                  : 'bg-muted/60 hover:bg-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/30 border-b border-border z-10">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 font-medium">Pos</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium">Composite</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.map((p) => (
              <tr key={p.player_display_name} className="group hover:bg-primary/5 transition-colors">
                <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                  {p.main_rank}
                </td>
                <td className="px-3 py-2 font-medium">
                  <Link
                    href={playerUrl(p.player_display_name)}
                    target="_blank"
                    className="hover:text-primary transition-colors"
                  >
                    {p.player_display_name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <PositionBadge position={p.position} posRank={p.pos_rank} />
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-xs">
                  {p.p50_total.toFixed(0)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-xs font-semibold text-primary">
                  {p.composite_score.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => onPick(p)}
                    disabled={!canPick}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-primary text-primary-foreground transition-all hover:scale-[1.04] disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={canPick ? { boxShadow: '0 0 12px var(--neon-glow)' } : undefined}
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

/* -------- Draft board -------- */

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
      <div className="p-3 border-b border-border flex items-center gap-3">
        <div className="h-px w-6 bg-primary shadow-[0_0_6px_var(--neon-glow)]" />
        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">
          Draft Board
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-2 py-2 text-left text-muted-foreground font-medium">R</th>
              {Array.from({ length: numTeams }, (_, i) => i + 1).map((team) => (
                <th
                  key={team}
                  className={`px-2 py-2 text-center min-w-[80px] font-mono ${
                    team === userTeam
                      ? 'text-primary font-bold'
                      : 'text-muted-foreground'
                  }`}
                  style={team === userTeam ? { textShadow: '0 0 8px var(--neon-glow)' } : undefined}
                >
                  T{team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: NUM_ROUNDS }, (_, i) => i + 1).map((round) => (
              <tr key={round} className="border-t border-border/50">
                <td className="px-2 py-1.5 text-muted-foreground font-mono">{round}</td>
                {Array.from({ length: numTeams }, (_, i) => i + 1).map((team) => {
                  const p = pickLookup[`${round}-${team}`];
                  const isUserCell = team === userTeam;
                  return (
                    <td
                      key={team}
                      className={`px-2 py-1.5 text-center border-l border-border/50 ${
                        isUserCell ? 'bg-primary/[0.06]' : ''
                      }`}
                    >
                      {p ? (
                        <Link
                          href={playerUrl(p.player.player_display_name)}
                          target="_blank"
                          className="block group/cell"
                        >
                          <div
                            className="truncate font-medium group-hover/cell:text-primary transition-colors"
                            title={p.player.player_display_name}
                          >
                            {shortName(p.player.player_display_name)}
                          </div>
                          <div className="text-muted-foreground text-[10px] font-mono">
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
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-px w-6 bg-primary shadow-[0_0_6px_var(--neon-glow)]" />
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">
            Your Roster
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2 font-mono">
          {picks.length} picks ·{' '}
          <span
            className="text-primary font-semibold"
            style={{ textShadow: '0 0 8px var(--neon-glow)' }}
          >
            {totalProj.toFixed(0)}
          </span>{' '}
          projected total
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {roster.map((slot, i) => (
          <div key={i} className="px-3 py-2 flex items-center justify-between text-sm">
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground w-14 shrink-0">
              {slot.slot}
            </div>
            <div className="flex-1 text-right">
              {slot.player ? (
                <Link
                  href={playerUrl(slot.player.player_display_name)}
                  target="_blank"
                  className="block group/slot"
                >
                  <div className="font-medium group-hover/slot:text-primary transition-colors">
                    {slot.player.player_display_name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {slot.player.position}{slot.player.pos_rank} · {slot.player.team} ·{' '}
                    <span className="text-foreground">{slot.player.p50_total.toFixed(0)}</span>
                  </div>
                </Link>
              ) : (
                <span className="text-muted-foreground/40 italic text-xs">empty</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------- Position badge -------- */

function PositionBadge({ position, posRank }: { position: Player['position']; posRank: number }) {
  const styles: Record<Player['position'], string> = {
    QB: 'text-[oklch(0.7_0.2_25)] border-[oklch(0.7_0.2_25/40%)] bg-[oklch(0.7_0.2_25/10%)]',
    RB: 'text-[oklch(0.78_0.2_145)] border-[oklch(0.78_0.2_145/40%)] bg-[oklch(0.78_0.2_145/10%)]',
    WR: 'text-[oklch(0.72_0.2_250)] border-[oklch(0.72_0.2_250/40%)] bg-[oklch(0.72_0.2_250/10%)]',
    TE: 'text-[oklch(0.78_0.18_80)] border-[oklch(0.78_0.18_80/40%)] bg-[oklch(0.78_0.18_80/10%)]',
  };
  return (
    <span
      className={`inline-flex items-center justify-center text-[11px] font-mono font-semibold tracking-wide px-2 py-0.5 rounded border ${styles[position]}`}
    >
      {position}{posRank}
    </span>
  );
}