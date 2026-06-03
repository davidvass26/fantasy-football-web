---
title: How the DraftEdge rankings are built
date: 2026-06-03
description: An honest walkthrough of the model, the data, and the design choices behind every projection.
---

Most fantasy football rankings either come from a single analyst's gut or get spit out of a black-box algorithm. DraftEdge is the second category, but I want to show you what's inside the box.

## The model

The projections come from an XGBoost gradient-boosting model — a tree-based machine learning model — trained on 11 seasons of NFL data (2015 through 2025). That's about 3,000 player-seasons in the training set. The model only covers QB, RB, WR, and TE; kickers and defenses are a different problem and not included.

For each player, the model uses 86 engineered features, including:

- **Three-year lagged performance**: stats from the previous 1, 2, and 3 seasons, with the most recent year weighted most heavily.
- **Opportunity metrics**: target share, air yards share, WOPR, RACR.
- **Efficiency metrics**: yards per target, yards per carry, EPA per play.
- **Team context**: pass rate, carries per game, scoring environment.
- **Team-change deltas**: How does the current team's offense compare to the old one? Important for team changes.
- **Trajectory**: year-over-year change, multi-year averages.
- **Demographics**: age, draft pedigree, years of experience, height, weight.
- **Volatility**: boom rate (the percent of weeks above a position threshold), bust rate, games missed.

## What the model predicts

The model doesn't predict total season points directly. It predicts **fantasy points per game**. We then multiply by an expected games played number — based on the player's recent injury history — to get a season total.

This matters because fantasy football is mostly about per-game production. If you know a player is healthy and producing 18 fp/game, you don't really care whether last year he played 14 or 16 games. The per-game rate is the real signal.

## Why three projections instead of one

Most ranking sites give you one number. DraftEdge gives you three: a 10th percentile floor, a 50th percentile median, and a 90th percentile ceiling. Each comes from a separate quantile regression model.

The width of the band tells you how confidently the model can predict each player. An established veteran with stable usage has a tight band. A rookie or a player switching teams has a wide one. The band is honest about uncertainty in a way a single number can't be.

## How rookies are handled

True rookies — players with no prior NFL stats — get their own dedicated model. The main model would otherwise over- or under-project them based on outlier examples in the training data.

The rookie model predicts year-1 outcomes from just four features: draft position, team pass rate, team carries per game, and team's overall scoring. It's intentionally simple because rookies are unpredictable and the most reliable signals are draft pedigree and the offense they're joining.

Top-10 picks get appropriately strong projections. Day 3 picks get appropriately conservative ones.

## The composite ranking

The headline overall rank isn't just "rank by projected points." It's a blend of four perspectives on each player's value:

- **Median VOR**: how much they project to outscore the worst startable player at their position, at the 50th percentile.
- **Floor VOR**: same thing at the 10th percentile. Rewards players with stable production.
- **Ceiling VOR**: at the 90th percentile. Rewards players with breakout upside.
- **Sharpe**: median VOR divided by uncertainty. Rewards efficiency — strong projection relative to noise.

For established players, the weights are 55% median, 12% floor, 28% ceiling, 5% efficiency.

For rookies — who are essentially lottery tickets in fantasy drafts — the weights shift hard toward ceiling: 15% median, 5% floor, 70% ceiling, 10% efficiency. A late-round dart at a rookie RB isn't valued by the safest projection; it's valued by the chance they break out.

## Value over replacement

VOR is what makes it possible to compare a QB to a RB on the same scale. Each player's projection is measured against the replacement level at their position — the worst startable player in a 12-team league. We use QB12, RB30, WR36, TE14.

A QB projecting 320 points isn't more valuable than a RB projecting 250 points if the QB12 also projects 280 and the RB30 projects 90. The RB's VOR (160) crushes the QB's (40).

## Manual adjustments

No model reacts to real-time news. When a player gets injured, traded, or moved up or down the depth chart, the projections don't automatically update. Adjustments are applied manually on top of the model output. Affected players are flagged on their detail page with the reasoning behind the change.

This is the honest part. The model is the foundation, but it's not the whole story.

## What this isn't

DraftEdge doesn't try to predict weekly outcomes — that's a different problem. It doesn't try to handicap your specific league settings beyond standard PPR. It doesn't know about your trade strategy or your opponent's roster. It's a draft-time tool that does one thing well: project a full season for every fantasy-relevant player at every position, with honest uncertainty bands, and let you compare them against replacement level on a unified scale.

That's it. No magic. Just data, transparent choices, and a few specific opinions about how to value uncertainty.
