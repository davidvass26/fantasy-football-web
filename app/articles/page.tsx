// app/articles/page.tsx
import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';

export const metadata = {
  title: 'Articles — DraftEdge',
  description: 'Analysis, model explainers, and player deep-dives.',
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-6 bg-primary shadow-[0_0_6px_var(--neon-glow)]" />
          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">
            Writing
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Articles</h1>
        <p className="mt-2 text-muted-foreground">
          Analysis, model explainers, and player deep-dives.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No articles yet.</div>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group block rounded-md border border-border bg-card p-5 relative overflow-hidden transition-all hover:border-primary/40 hover:bg-card/80"
            >
              {/* Glowing left edge accent on hover */}
              <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_var(--neon-glow)]" />

              <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground mb-2">
                {formatDate(article.date)}
              </div>
              <div className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                {article.title}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {article.description}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}