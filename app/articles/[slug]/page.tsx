// app/articles/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { getArticle, getArticleSlugs } from '@/lib/articles';

export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'Not found — DraftEdge' };
  return {
    title: `${article.meta.title} — DraftEdge`,
    description: article.meta.description,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const { meta, content } = article;

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/articles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to articles
      </Link>

      <header className="mb-10 pb-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-6 bg-primary shadow-[0_0_6px_var(--neon-glow)]" />
          <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
            {formatDate(meta.date)}
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
          {meta.title}
        </h1>
        {meta.description && (
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {meta.description}
          </p>
        )}
      </header>

      <article
        className="
          prose prose-invert max-w-none
          prose-headings:tracking-tight prose-headings:font-bold
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-1
          prose-h2:border-b prose-h2:border-border/60
          prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
          prose-p:leading-relaxed prose-p:text-foreground/85
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground prose-strong:font-semibold
          prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5
          prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-code:font-mono prose-code:text-sm
          prose-blockquote:border-l-primary prose-blockquote:border-l-2
          prose-blockquote:bg-card/40 prose-blockquote:py-1 prose-blockquote:rounded-r
          prose-blockquote:text-foreground/80 prose-blockquote:not-italic
          prose-li:text-foreground/85 prose-li:marker:text-primary/60
          prose-hr:border-border/60
          prose-table:text-sm
          prose-th:text-muted-foreground prose-th:font-mono prose-th:text-xs
          prose-th:uppercase prose-th:tracking-wider prose-th:font-medium
        "
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </main>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}