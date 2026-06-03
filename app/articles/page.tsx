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
        <h1 className="text-4xl font-bold tracking-tight">Articles</h1>
        <p className="mt-2 text-muted-foreground">
          Analysis, model explainers, and player deep-dives.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No articles yet.</div>
      ) : (
        <div className="space-y-1">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="block rounded-md border bg-card p-5 hover:bg-muted/30 transition-colors"
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                {formatDate(article.date)}
              </div>
              <div className="text-lg font-semibold mb-1">{article.title}</div>
              <div className="text-sm text-muted-foreground">{article.description}</div>
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
