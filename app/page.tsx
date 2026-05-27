import Link from 'next/link';

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Fantasy Football Assistant</h1>
      <p className="mb-4">v0 build. The real home page comes later.</p>
      <Link href="/rankings" className="underline text-blue-600">
        → Rankings
      </Link>
    </main>
  );
}