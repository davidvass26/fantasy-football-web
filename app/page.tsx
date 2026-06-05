// app/page.tsx
// DraftEdge home page.

import Link from 'next/link';
import { ArrowRight, Brain, BarChart3, Layers, Activity } from 'lucide-react';
import { TechnicalDetails } from '@/components/technical-details';

export default function Home() {
  return (
    <main className="relative">
      {/* Subtle grid pattern for futuristic backdrop, behind everything */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 30%, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 30%, black 30%, transparent 70%)',
        }}
      />

      {/* Hero */}
      <section className="relative container mx-auto px-4 py-20 md:py-28 max-w-5xl">
        <div className="text-center space-y-6">
          {/* Eyebrow tag */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-[0.2em] border"
            style={{
              borderColor: 'var(--neon-glow)',
              background: 'oklch(0.86 0.24 145 / 5%)',
              color: 'var(--primary)',
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            2026 Season
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Your edge
            <br />
            <span
              className="text-primary"
              style={{ textShadow: '0 0 32px var(--neon-glow)' }}
            >
              in every draft.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-powered PPR fantasy football rankings with uncertainty bands.
            Built on a custom ML model trained on 11 seasons of NFL data.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/rankings"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-all hover:scale-[1.02]"
              style={{ boxShadow: '0 0 24px var(--neon-glow)' }}
            >
              View Rankings
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/mock-draft"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border bg-card/40 backdrop-blur-sm font-medium hover:border-primary/40 hover:text-primary transition-all"
            >
              Run a Mock Draft
            </Link>
          </div>

          {/* Receipts row — live stats from the project */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-px max-w-3xl mx-auto rounded-md overflow-hidden border border-border bg-border/50">
            <StatPill label="Players Projected" value="807" />
            <StatPill label="Seasons of Data" value="11" />
            <StatPill label="Validation MAE" value="2.79" />
            <StatPill label="Quantile Models" value="3" />
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="relative container mx-auto px-4 py-16 max-w-5xl">
        <SectionMarker label="What you get" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Brain className="h-5 w-5" />}
            title="Quantile Projections"
            description="Three projections per player — floor, median, and ceiling — so you know exactly what kind of bet you're making."
          />
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Composite Rankings"
            description="Blend median, floor, ceiling, and efficiency. Built for real draft decisions, not just paper projections."
          />
          <FeatureCard
            icon={<Layers className="h-5 w-5" />}
            title="Tiered Rookie Model"
            description="A separate ML model trained on historical rookies. Top-10 picks get appropriate upside; late picks get appropriate restraint."
          />
        </div>
      </section>

      {/* Workflow row — call out the three tools */}
      <section className="relative container mx-auto px-4 py-12 max-w-5xl">
        <SectionMarker label="Tools" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ToolLink
            href="/rankings"
            title="Rankings"
            description="Sortable board across all positions"
          />
          <ToolLink
            href="/compare"
            title="Compare"
            description="Side-by-side player comparison"
          />
          <ToolLink
            href="/mock-draft"
            title="Mock Draft"
            description="Practice against AI opponents"
          />
        </div>
      </section>

      {/* Technical details — expandable */}
      <section className="relative container mx-auto px-4 py-16 max-w-3xl">
        <SectionMarker label="Under the hood" />
        <TechnicalDetails />
      </section>
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-4 py-4 text-left">
      <div
        className="text-2xl md:text-3xl font-mono tabular-nums font-bold text-primary"
        style={{ textShadow: '0 0 16px var(--neon-glow)' }}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
        {label}
      </div>
    </div>
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
    <div className="group p-6 rounded-md border border-border bg-card relative overflow-hidden transition-all hover:border-primary/40 hover:bg-card/80">
      {/* Decorative corner accent on hover */}
      <div
        className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'radial-gradient(circle at top right, var(--neon-glow), transparent 70%)',
        }}
      />
      <div
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-md border mb-4 text-primary"
        style={{
          borderColor: 'var(--neon-glow)',
          background: 'oklch(0.86 0.24 145 / 5%)',
        }}
      >
        {icon}
      </div>
      <h3 className="relative font-semibold mb-2">{title}</h3>
      <p className="relative text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function ToolLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group p-4 rounded-md border border-border bg-card flex items-center justify-between transition-all hover:border-primary/40 hover:bg-card/80"
    >
      <div>
        <div className="font-semibold group-hover:text-primary transition-colors">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function SectionMarker({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px w-6 bg-primary shadow-[0_0_6px_var(--neon-glow)]" />
      <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">
        {label}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}