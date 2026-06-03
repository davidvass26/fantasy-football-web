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
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to articles
      </Link>

      <header className="mb-8 pb-6 border-b">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          {formatDate(meta.date)}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{meta.title}</h1>
        {meta.description && (
          <p className="mt-3 text-lg text-muted-foreground">{meta.description}</p>
        )}
      </header>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
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