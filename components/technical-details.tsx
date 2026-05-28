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
              10 seasons of NFL data (2015–2025) covering 2,987 player-seasons. Predictions are made
              for 777 fantasy-relevant players at QB, RB, WR, and TE positions.
            </p>
          </Subsection>

          <Subsection title="Feature engineering">
            <p>
              The model uses 86 engineered features per player, including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-muted-foreground">
              <li>Three-year lagged performance (stats from the previous 3 seasons)</li>
              <li>Opportunity metrics: target share, air yards share, WOPR, RACR</li>
              <li>Efficiency metrics: yards per target, yards per carry</li>
              <li>Team context: pass rate, carries per game, scoring environment</li>
              <li>Team-change deltas in categories like passing attempts for players who switched offenses</li>
              <li>Trajectory: year-over-year improvement, multi-year averages</li>
              <li>Demographics: age, draft pedigree, years of experience, height/weight</li>
              <li>Volatility: prior boom rate(QB {">"} 22, RB, WR {">"} 18, TE {">"} 14), bust ({"<"} 5), games missed</li>
            </ul>
          </Subsection>

          <Subsection title="Hyperparameter tuning">
            <p>
              The model was tuned with 50 trials of Bayesian optimization (Optuna) on a held-out
              2025 validation set. The final configuration uses learning rate 0.012, max depth 10,
              and 716 trees with L1/L2 regularization.
            </p>
          </Subsection>

          <Subsection title="Uncertainty quantification">
            <p>
              Most projection systems give you a single number. DraftEdge gives you three —
              floor (10th percentile), median (50th), and ceiling (90th) — by training
              separate quantile regression models. The width of the band reflects how confidently
              the model can predict each player. Established veterans get tight bands; rookies
              and players with thin profiles get wide ones.
            </p>
          </Subsection>

          <Subsection title="Validation">
            <p>
              Rolling validation across the two most recent complete seasons (2024, 2025) gives a
              mean absolute error of <span className="font-mono font-medium text-foreground">2.89</span> PPR
              points per game — a <span className="font-mono font-medium text-foreground">22%</span> improvement
              over the &ldquo;next year equals last year&rdquo; baseline. On 2025 alone, MAE is{' '}
              <span className="font-mono font-medium text-foreground">2.79</span>.
            </p>
          </Subsection>

          <Subsection title="Composite ranking">
            <p>
              The headline ranking is a weighted blend of four different rankings:
              40% median VOR, 22% floor VOR, 28% ceiling VOR, and 10% Sharpe (efficiency).
              Each variant is z-score normalized before blending so they contribute on comparable
              scales. The floor VOR and ceiling VOR are from the quantile regression models. This rewards players who score well across multiple perspectives, not just
              those with the highest expected outcome.
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
              It is difficult to create a model that responds to real time updates. When news breaks about an injury, 
              or a player is traded, or a depth chart changes, the rankings may not immediately reflect that. They will 
              be manually updated or retrained.  
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
