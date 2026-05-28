// components/footer.tsx
// Site footer — appears on every page via the root layout.

export function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="container mx-auto px-4 py-6 max-w-7xl text-sm text-muted-foreground flex justify-between flex-wrap gap-3">
        <div>© 2026 DraftEdge</div>
        <div>Built with custom ML projections. PPR scoring · 12-team league.</div>
      </div>
    </footer>
  );
}
