// app/page.tsx
// DraftEdge home page.

import Link from 'next/link';
import { ArrowRight, Brain, BarChart3, Sparkles } from 'lucide-react';
import { TechnicalDetails } from '@/components/technical-details';

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28 max-w-5xl">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium uppercase tracking-wide">
            <Sparkles className="h-3 w-3" />
            2026 Season
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Your edge<br />in every draft.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered PPR fantasy football rankings with uncertainty bands. Built on a custom ML model trained on 10 seasons of NFL data.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/rankings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              View Rankings
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border font-medium hover:bg-muted transition-colors"
            >
              Compare Players
            </Link>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Brain className="h-6 w-6" />}
            title="Quantile Regression"
            description="Three projections per player — floor, median, and ceiling — so you know exactly what kind of bet you're making."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Risk-Adjusted Rankings"
            description="Composite scores weight median, floor, ceiling, and efficiency. Built for real draft decisions, not just paper projections."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="777 Players Ranked"
            description="Every fantasy-relevant QB, RB, WR, and TE for 2026 — including rookies, veterans, and depth pieces."
          />
        </div>
      </section>

      {/* Technical details — expandable */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <TechnicalDetails />
      </section>

      {/* Articles section — hidden until we have articles */}
      {/* When articles exist, this will show a preview of the latest 3 */}
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-md border bg-card">
      <div className="text-foreground/80 mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}