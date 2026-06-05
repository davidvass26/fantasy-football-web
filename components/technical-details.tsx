// components/technical-details.tsx
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function TechnicalDetails() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden transition-colors hover:border-primary/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-primary/[0.03]"
      >
        <div>
          <div className="font-semibold">Under the hood</div>
          <div className="text-sm text-muted-foreground mt-0.5">
            How the projections are actually built
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 transition-all ${
            open ? 'rotate-180 text-primary' : 'text-muted-foreground'
          }`}
          style={open ? { filter: 'drop-shadow(0 0 4px var(--neon-glow))' } : undefined}
        />
      </button>

      {open && (
        <div className="px-5 pb-6 pt-1 space-y-5 text-sm leading-relaxed border-t border-border">
          <Subsection title="The model">
            <p>
              DraftEdge projections come from a custom XGBoost gradient-boosting model trained on{' '}
              <Stat>11 seasons</Stat> of NFL data (2015–2025) covering{' '}
              <Stat>3,000+ player-seasons</Stat>. Predictions cover{' '}
              <Stat>645 fantasy-relevant players</Stat> at QB, RB, WR, and TE positions.
            </p>
          </Subsection>

          <Subsection title="Feature engineering">
            <p>
              The model uses <Stat>86 engineered features</Stat> per player, including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-muted-foreground marker:text-primary/60">
              <li>Three-year lagged performance (stats from the previous 3 seasons, with the most recent season weighted most heavily)</li>
              <li>Opportunity metrics: target share, air yards share, WOPR, RACR</li>
              <li>Efficiency metrics: yards per target, yards per carry, EPA per play</li>
              <li>Team context: pass rate, carries per game, scoring environment</li>
              <li>Team-change deltas for players who switched offenses (passing attempts, carries, pass rate, fantasy points)</li>
              <li>Trajectory: year-over-year improvement, multi-year averages</li>
              <li>Demographics: age, draft pedigree, years of experience, height/weight</li>
              <li>
                Volatility: prior boom rate (QB {'>'} 22, RB/WR {'>'} 18, TE {'>'} 14 fantasy points),
                bust rate ({'<'} 5), games missed
              </li>
            </ul>
          </Subsection>

          <Subsection title="Hyperparameter tuning">
            <p>
              The main model was tuned with <Stat>50 trials</Stat> of Bayesian optimization (Optuna)
              on a held-out 2024 validation set. Tuning identified an optimal configuration of low
              learning rate with deeper trees and strong regularization — appropriate for the
              feature-rich, relatively small training set.
            </p>
          </Subsection>

          <Subsection title="Uncertainty quantification">
            <p>
              Most projection systems give you a single number. DraftEdge gives you three —
              floor (10th percentile), median (50th), and ceiling (90th) — by training separate
              quantile regression models. The width of the band reflects how confidently the model
              can predict each player. Established veterans coming off consistent seasons get
              tight bands; rookies and players with thin profiles get wide ones.
            </p>
          </Subsection>

          <Subsection title="Validation">
            <p>
              Rolling validation across the two most recent complete seasons (2023 and 2024) gives
              a mean absolute error of <Stat>2.88</Stat> PPR points per game — a{' '}
              <Stat>22%</Stat> improvement over the &ldquo;next year equals last year&rdquo; baseline.
              On 2024 alone, MAE is <Stat>2.79</Stat>. Validation can only use seasons whose
              next-year outcomes exist, so 2025 features are used as model inputs for 2026
              projections rather than for validation.
            </p>
          </Subsection>

          <Subsection title="Rookie handling">
            <p>
              True rookies (no prior NFL stats) are handled by a separate quantile regression model
              trained on historical rookie outcomes by draft position and team context. This
              prevents the main model from over- or under-projecting rookies based on outlier
              examples in the training data. Top-10 picks get appropriately strong projections;
              late-round picks get appropriately conservative ones.
            </p>
          </Subsection>

          <Subsection title="Composite ranking">
            <p>
              The headline ranking is a weighted blend of four perspectives on each player&apos;s
              value — median, floor, ceiling, and Sharpe (efficiency). For established players,
              the weights are <Stat>55%</Stat> median, <Stat>12%</Stat> floor, <Stat>28%</Stat>{' '}
              ceiling, and <Stat>5%</Stat> efficiency. For true rookies — who are inherently
              boom-or-bust draft picks — the weights shift heavily toward ceiling (<Stat>15%</Stat>{' '}
              median, <Stat>5%</Stat> floor, <Stat>75%</Stat> ceiling, <Stat>5%</Stat> efficiency)
              to reflect their option value. The model prioritizes booms with hopes of finding the
              next breakout players at each stage and tier of the draft.
            </p>
          </Subsection>

          <Subsection title="Replacement-level value">
            <p>
              All rankings use Value Over Replacement (VOR) — a player&apos;s projection minus the
              projection of the worst startable player at their position in a 12-team league
              (<Stat>QB12</Stat>, <Stat>RB30</Stat>, <Stat>WR36</Stat>, <Stat>TE14</Stat>). This is
              what makes it possible to rank a 320-point QB fairly against a 250-point RB.
            </p>
          </Subsection>

          <Subsection title="Manual adjustments">
            <p>
              No statistical model can react in real time to injuries, trades, suspensions, or
              depth chart changes. When acute news drops, projections are manually adjusted on top
              of the model output. Adjusted players are noted on their detail page with the
              reasoning behind the change.
            </p>
          </Subsection>
        </div>
      )}
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px w-3 bg-primary/60" />
        <div className="text-[10px] uppercase tracking-[0.2em] font-mono font-semibold text-muted-foreground">
          {title}
        </div>
      </div>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

// Inline stat highlight — neon green mono number/value
function Stat({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono font-semibold text-primary tabular-nums"
      style={{ textShadow: '0 0 8px var(--neon-glow)' }}
    >
      {children}
    </span>
  );
}