/**
 * "Search by memory" prototype. Pure and local: no model calls, no Spotify data.
 * Matches only against text the user wrote (crate name, liner notes, track notes)
 * and returns the exact evidence for every match.
 */
export interface MemoryTrack { id: string; title: string; artist: string; note?: string }
export interface MemoryCrate { name: string; note?: string; tracks: MemoryTrack[] }

export interface Interpretation { term: string; label: string }
export interface MemoryMatch { track: MemoryTrack; evidence: { field: 'track note' | 'crate note' | 'crate name'; snippet: string }[] }

const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'that', 'was', 'is', 'it', 'my', 'me', 'i', 'song', 'songs', 'track', 'tracks', 'one', 'from']);

// Small, explicit synonym map — each expansion is shown and removable.
const SYNONYMS: Record<string, string[]> = {
  night: ['midnight', 'late', 'after dark'],
  late: ['midnight', 'night'],
  drive: ['driving', 'road', 'bridge', 'windows down'],
  driving: ['drive', 'road'],
  calm: ['unhurried', 'slow', 'warm', 'soft'],
  chill: ['unhurried', 'slow', 'calm'],
  slow: ['unhurried', 'calm'],
  sad: ['heartbreak', 'missing', 'lonely'],
  party: ['dance', 'club', 'turn up'],
  morning: ['sunrise', 'early'],
};

export function interpret(query: string): Interpretation[] {
  const words = query.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  const out: Interpretation[] = [];
  const seen = new Set<string>();
  for (const w of words) if (!seen.has(w)) { seen.add(w); out.push({ term: w, label: w }); }
  for (const w of words) {
    for (const syn of SYNONYMS[w] ?? []) {
      if (!seen.has(syn)) { seen.add(syn); out.push({ term: syn, label: `${syn} (from “${w}”)` }); }
    }
  }
  return out;
}

const snippet = (text: string, term: string) => {
  const i = text.toLowerCase().indexOf(term);
  const start = Math.max(0, i - 24);
  const end = Math.min(text.length, i + term.length + 24);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
};

export function searchByMemory(crate: MemoryCrate, terms: Interpretation[]): MemoryMatch[] {
  if (terms.length === 0) return [];
  const crateHits = (field: 'crate note' | 'crate name', text?: string) =>
    text ? terms.filter((t) => text.toLowerCase().includes(t.term)).map((t) => ({ field, snippet: snippet(text, t.term) })) : [];
  const shared = [...crateHits('crate name', crate.name), ...crateHits('crate note', crate.note)];
  const matches: MemoryMatch[] = [];
  for (const track of crate.tracks) {
    const own = track.note
      ? terms.filter((t) => track.note!.toLowerCase().includes(t.term)).map((t) => ({ field: 'track note' as const, snippet: snippet(track.note!, t.term) }))
      : [];
    if (own.length) matches.push({ track, evidence: own });
  }
  // Crate-level evidence alone applies to every track; only use it when no track note matched.
  if (matches.length === 0 && shared.length) return crate.tracks.map((track) => ({ track, evidence: shared }));
  return matches;
}
