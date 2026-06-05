# DraftEdge

> AI-powered fantasy football projections with uncertainty bands.
> Custom ML model + production web app.

**[Live demo →](https://fantasy-football-web-delta.vercel.app)**

---

DraftEdge is an end-to-end machine learning product that projects every fantasy-relevant NFL player for the 2026 season. Unlike conventional ranking sites that publish a single point estimate per player, DraftEdge trains three quantile regression models — floor, median, and ceiling — so users see the *range* of likely outcomes, not just the average.

The model achieves **2.88 MAE** on rolling validation across the two most recent complete NFL seasons (2023, 2024) — a **22% improvement** over the naive "next year equals last year" baseline.

This repository contains the Next.js web application. The ML training pipeline lives in a [separate repo](https://github.com/davidvass26/fantasy-football-ml-helper).

## At a glance

| | |
|---|---|
| **Players projected** | 645 (QB, RB, WR, TE) |
| **Training data** | 11 NFL seasons (2015–2025), ~3,300 player-seasons |
| **Engineered features** | 86 per player |
| **Quantile models** | 3 (p10, p50, p90) + a dedicated rookie model |
| **Validation MAE** | 2.88 PPR points/game |
| **Baseline improvement** | 22% over last-year-equals-next-year |
| **Stack** | Python (XGBoost, Polars, Optuna) · Next.js 16 · TypeScript · Tailwind |

## Why it exists

Most fantasy football projection systems publish one number per player and call it done. That hides the most important question in a draft: *how risky is this pick?* A WR projected for 240 points might range from 180 to 290 (volatile boom-or-bust) or from 220 to 260 (steady producer). Those are very different draft decisions, but a single ranking number flattens them into the same row.

DraftEdge solves this by training three separate XGBoost models on quantile regression objectives, then exposing all three projections plus a derived uncertainty band. The headline composite ranking blends median (expected), floor (safety), ceiling (upside), and Sharpe-style efficiency, so each player carries the full shape of their distribution into the ranking.

## Technical highlights

### Quantile regression for honest uncertainty

Three separate XGBoost models are trained with quantile loss at the 10th, 50th, and 90th percentiles. Quantile constraints are enforced at inference time so `p10 ≤ p50 ≤ p90` always holds. Veterans with consistent multi-year histories get tight bands; rookies and players with thin profiles get wide ones — exactly the information a drafter needs.

```python
# Excerpt from the training pipeline
for q in [0.10, 0.50, 0.90]:
    model = XGBRegressor(
        objective="reg:quantileerror",
        quantile_alpha=q,
        **best_params  # tuned via Optuna
    )
    model.fit(X_train, y_train)
    quantile_models[q] = model
```

### Tuning

Hyperparameters were searched with **50 trials of Bayesian optimization** (Optuna) on a held-out 2024 validation set. The final config favored a low learning rate (0.06), deeper trees (depth 7), and strong regularization — appropriate for a feature-rich but relatively small training set (~3,300 rows).

### Feature engineering

86 features per player, including:

- **Three-year lagged performance** — prior 3 seasons of fantasy points, opportunity, and efficiency, weighted toward the most recent year
- **Opportunity metrics** — target share, air yards share, WOPR, RACR, snap share
- **Efficiency metrics** — yards per target, yards per carry, EPA per play
- **Team context** — pass rate, carries per game, scoring environment
- **Team-change deltas** — for players who switched offenses (notably, A.J. Brown's move from PHI to NE)
- **Trajectory** — year-over-year improvement, multi-year averages
- **Demographics** — age, draft pedigree, years of experience, height, weight
- **Volatility** — prior boom rate, bust rate, games missed

### Diagnosing and fixing a real bug

While auditing the initial model's projections, I noticed several breakout players from the prior season were being heavily penalized in their next-year projections — counter to what the data clearly showed. Tracing through the feature pipeline revealed an **off-by-one lag bug**: features labeled `prev_*` were actually pulling from two years ago, not the most recent season. The most predictive feature in the entire model — last season's per-game fantasy points — was being completely ignored.

After fixing the indexing, validation MAE dropped meaningfully and the projections aligned with intuition. The lesson stuck: when projections feel wrong, check the feature engineering before tuning the model.

### A separate model for rookies

The main model performed well on veterans but systematically miscalibrated rookies, because the training data contains too few examples per rookie cohort and the model's smoothing pulls projections toward sample medians regardless of context.

The fix was a **separate quantile regression model trained only on historical rookies** (594 examples), using a simpler feature set scoped to what's actually known about an NFL rookie: draft position, team pass rate, team carries per game, and team fantasy environment. Per-position MAE on the rookie model: QB 2.89, RB 3.57, WR 2.48, TE 2.00.

The combined system routes each player to the appropriate model: vets → main model, true rookies (`is_rookie=1 AND prev_fp_per_game IS NULL`) → rookie model.

### Tiered expected games

Season totals can't just multiply per-game projections by 17. Some players miss games, and the historical rate depends heavily on player profile. Rookies get fewer games than vets (especially late-round picks). Star RBs hit injury rates above the position average.

DraftEdge uses a **tiered lookup** by position × draft tier (top 10 / 11–32 / 33–96 / 97+) for rookies, and a weighted-recent-games estimate for veterans (50%/30%/20% across the last three seasons, with a floor of 13 and cap of 16). This is one of those quiet decisions that materially affects whether the season totals make sense.

### Composite ranking with split weights

The headline ranking blends four projections via z-score normalization:

- **Veterans**: 40% median, 22% floor, 28% ceiling, 10% Sharpe
- **Rookies**: 15% median, 5% floor, 70% ceiling, 10% Sharpe

The rookie weights deliberately overweight ceiling because rookies are option plays — you draft them for the chance of an outlier outcome, not for a tight median. The split makes the ranking honest about that.

### Value Over Replacement (VOR)

All cross-position comparisons use VOR — a player's total projection minus the projection of the worst startable player at their position in a 12-team league (QB12, RB30, WR36, TE14). Without VOR, raw projections systematically overrank QBs, who project to many more total points than other positions but offer less marginal value above the waiver wire.

## The web app

Built with Next.js 16 (App Router), TypeScript, and Tailwind v4. Deployed on Vercel.

- **Rankings page** — sortable, searchable, filterable table of all 645 players with position color-coding and a neon-accented composite column
- **Player detail pages** — per-player projection breakdown, ranking by four different strategies (median / floor / ceiling / efficiency), with **dynamic team-color theming** — each player's page picks up their NFL team's primary and secondary brand colors, with a faded team logo embedded as background
- **Compare players** — side-by-side comparison grid with **per-metric winner highlighting** in each player's team color
- **Mock draft simulator** — 12-team snake draft against AI opponents (weighted random sampling from the noisy top of the available pool), with an animated "on the clock" state when it's the user's turn
- **Articles** — markdown-based blog for model explainers and weekly analysis

The frontend uses a custom dark theme with neon green as the brand primary, JetBrains Mono for stats, and Inter for prose.

## Project structure

```
fantasy-football-web/
├── app/
│   ├── page.tsx                    # Home (hero, receipts row, feature cards)
│   ├── rankings/page.tsx           # Full rankings table
│   ├── player/[name]/page.tsx      # Dynamic player detail pages
│   ├── compare/page.tsx            # Two-player comparison
│   ├── mock-draft/page.tsx         # Draft simulator
│   └── articles/                   # Markdown articles
├── components/
│   ├── rankings-table.tsx          # Sortable/filterable player table
│   ├── compare-picker.tsx          # Player picker + comparison grid
│   ├── mock-draft.tsx              # Draft state machine + UI
│   └── ...
├── lib/
│   ├── players.ts                  # CSV loader + Player type
│   ├── team-colors.ts              # NFL team brand colors lookup
│   └── ...
└── public/data/
    └── final_ranking.csv           # Output from the ML pipeline
```

## Running locally

```bash
git clone https://github.com/davidvass26/fantasy-football-web.git
cd fantasy-football-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The CSV in `public/data/final_ranking.csv` is the latest output from the [ML training pipeline](https://github.com/davidvass26/fantasy-football-ml-helper). To regenerate rankings (with refreshed weekly NFL data, applied roster updates, and overrides), run the `notebooks/regenerate_rankings.ipynb` notebook in that repo and copy the new CSV here.

## Roadmap

- [x] ML pipeline + quantile regression
- [x] Rookie-specific quantile model
- [x] Full rankings, compare, and mock draft UI
- [x] Custom dark theme + team-color theming
- [x] Production deployment
- [ ] AI-generated player comparison summaries (Claude API)
- [ ] Post-season evaluation: compare 2026 projections to actual outcomes
- [ ] Custom league scoring (half-PPR, standard, superflex)

## Tech stack

**ML pipeline**
Python · XGBoost (quantile regression) · Polars · pandas · Optuna · scikit-learn · nflreadpy

**Web app**
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · React · shadcn/ui · papaparse · react-markdown

**Deployment**
Vercel (auto-deploy on push)

---

## About me

I'm **David Vassalluzzo** — an applied ML / data engineer based in Miami. DraftEdge is one of several projects I've built that combine real machine learning with production engineering. I'm particularly drawn to problems where uncertainty matters as much as the point estimate (draft strategy, risk modeling, calibration of probabilistic forecasts) and to the data-quality work that determines whether a model is actually useful or just looks good on a validation set.

Find me on [GitHub](https://github.com/davidvass26).
