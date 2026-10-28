import type { MixtapeTrack } from './types';

/** Place pinned tracks at their slots; everything else keeps its order around them. */
export function applyPins(ordered: MixtapeTrack[], pins: Map<number, MixtapeTrack>): MixtapeTrack[] {
  const pinnedIds = new Set([...pins.values()].map((t) => t.trackId));
  const free = ordered.filter((t) => !pinnedIds.has(t.trackId));
  const out: MixtapeTrack[] = [];
  for (let i = 0; i < ordered.length; i++) out.push(pins.get(i) ?? (free.shift() as MixtapeTrack));
  return out;
}

/**
 * Break up back-to-back tracks from the same album by pulling the nearest later
 * track from a different album forward. Pinned slots never move. Moving (not swapping)
 * keeps each album's relative order intact.
 */
export function avoidBackToBack(tracks: MixtapeTrack[], pinnedSlots: Set<number>): MixtapeTrack[] {
  const out = [...tracks];
  const free = out.map((_, i) => i).filter((i) => !pinnedSlots.has(i));
  for (let k = 0; k < free.length; k++) {
    const p = free[k];
    if (p === 0 || out[p].albumId !== out[p - 1].albumId) continue;
    const prevAlbum = out[p - 1].albumId;
    let m = k + 1;
    while (m < free.length && out[free[m]].albumId === prevAlbum) m++;
    if (m >= free.length) continue;
    const moved = out[free[m]];
    for (let j = m; j > k; j--) out[free[j]] = out[free[j - 1]];
    out[p] = moved;
  }
  return out;
}

/** Largest prefix within `minutes`, never shorter than `minLength` (to keep pinned slots). */
export function trimToMinutes(tracks: MixtapeTrack[], minutes: number, minLength: number): MixtapeTrack[] {
  const limit = minutes * 60_000;
  let total = 0;
  let n = 0;
  while (n < tracks.length && total + tracks[n].durationMs <= limit) total += tracks[n++].durationMs;
  return tracks.slice(0, Math.max(n, minLength));
}

/** Split at the track boundary closest to half the total duration. */
export function splitSides(tracks: MixtapeTrack[]): { a: number; b: number } {
  if (tracks.length < 2) return { a: tracks.length, b: 0 };
  const total = tracks.reduce((s, t) => s + t.durationMs, 0);
  let cum = 0;
  let best = 1;
  let bestDiff = Infinity;
  for (let k = 1; k < tracks.length; k++) {
    cum += tracks[k - 1].durationMs;
    const d = Math.abs(cum - total / 2);
    if (d < bestDiff) { bestDiff = d; best = k; }
  }
  return { a: best, b: tracks.length - best };
}
