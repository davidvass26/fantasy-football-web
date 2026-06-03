// lib/articles.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

export type ArticleMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));

  const articles: ArticleMeta[] = files.map((filename) => {
    const filePath = path.join(ARTICLES_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    return {
      slug: filename.replace(/\.md$/, ''),
      title: String(data.title ?? filename),
      date: String(data.date ?? ''),
      description: String(data.description ?? ''),
    };
  });

  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getArticleSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export function getArticle(slug: string): { meta: ArticleMeta; content: string } | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    meta: {
      slug,
      title: String(data.title ?? slug),
      date: String(data.date ?? ''),
      description: String(data.description ?? ''),
    },
    content,
  };
}