// components/technical-details.tsx
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function TechnicalDetails() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div>
          <div className="font-semibold">Under the hood</div>
          <div className="text-sm text-muted-foreground">
            How the projections are actually built
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-6 pt-1 space-y-4 text-sm leading-relaxed border-t">
          <Subsection title="The model">
            <p>
              DraftEdge projections come from a custom XGBoost gradient-boosting model trained on
              11 seasons of NFL data (2015–2025) covering 3,000+ player-seasons. Predictions cover
              645 fantasy-relevant players at QB, RB, WR, and TE positions.
            </p>
          </Subsection>

          <Subsection title="Feature engineering">
            <p>
              The model uses 86 engineered features per player, including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-muted-foreground">
              <li>Three-year lagged performance (stats from the previous 3 seasons, with the most recent season weighted most heavily)</li>
              <li>Opportunity metrics: target share, air yards share, WOPR, RACR</li>
              <li>Efficiency metrics: yards per target, yards per carry, EPA per play</li>
              <li>Team context: pass rate, carries per game, scoring environment</li>
              <li>Team-change deltas for players who switched offenses (passing attempts, carries, pass rate, fantasy points)</li>
              <li>Trajectory: year-over-year improvement, multi-year averages</li>
              <li>Demographics: age, draft pedigree, years of experience, height/weight</li>
              <li>Volatility: prior boom rate (QB {">"} 22, RB/WR {">"} 18, TE {">"} 14 fantasy points), bust rate ({"<"} 5), games missed</li>
            </ul>
          </Subsection>

          <Subsection title="Hyperparameter tuning">
            <p>
              The main model was tuned with 50 trials of Bayesian optimization (Optuna) on a
              held-out 2024 validation set. Tuning identified an optimal configuration of low
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
              a mean absolute error of <span className="font-mono font-medium text-foreground">2.88</span> PPR
              points per game — a <span className="font-mono font-medium text-foreground">22%</span> improvement
              over the &ldquo;next year equals last year&rdquo; baseline. On 2024 alone, MAE is{' '}
              <span className="font-mono font-medium text-foreground">2.79</span>. Validation can
              only use seasons whose next-year outcomes exist, so 2025 features are used as model
              inputs for 2026 projections rather than for validation.
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
              the weights are 55% median, 12% floor, 28% ceiling, and 5% efficiency. For true
              rookies — who are inherently boom-or-bust draft picks — the weights shift heavily
              toward ceiling (15% median, 5% floor, 75% ceiling, 5% efficiency) to reflect their
              option value. My model prioritizes booms with hopes of finding the next breakout players
              at each stage and tier of the draft.
            </p>
          </Subsection>

          <Subsection title="Replacement-level value">
            <p>
              All rankings use Value Over Replacement (VOR) — a player&apos;s projection minus the
              projection of the worst startable player at their position in a 12-team league
              (QB12, RB30, WR36, TE14). This is what makes it possible to rank a 320-point QB
              fairly against a 250-point RB.
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
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}