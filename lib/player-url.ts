// lib/player-url.ts
// Single source of truth for player page URLs.
//
// Why this exists: encodeURIComponent() does NOT encode apostrophes
// (they're valid URL characters). Vercel's static page matching is
// strict about exact path comparison, so we must encode apostrophes
// the SAME WAY in both:
//   - the href on the link
//   - the path returned from generateStaticParams()
//
// Encoding apostrophes as %27 in both places keeps them in sync.

/** Returns an encoded URL slug for a player. Use in href attributes. */
export function playerUrl(name: string): string {
  return `/player/${encodePlayerName(name)}`;
}

/** Returns the encoded path segment for a player name. Use in generateStaticParams. */
export function encodePlayerName(name: string): string {
  return encodeURIComponent(name).replace(/'/g, '%27');
}
