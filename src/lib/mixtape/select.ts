import type { MixtapeAlbum, MixtapeTrack } from './types';

/** Split `target` across albums as evenly as their sizes allow. */
export function albumQuotas(sizes: number[], target: number): number[] {
  const quotas = sizes.map(() => 0);
  let left = Math.min(target, sizes.reduce((a, b) => a + b, 0));
  while (left > 0) {
    let progressed = false;
    for (let i = 0; i < sizes.length && left > 0; i++) {
      if (quotas[i] < sizes[i]) {
        quotas[i]++;
        left--;
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return quotas;
}

/** Pick `k` indices spread across 0..n-1 (opener → closer). `jitter` in [0,1) shifts the sampling grid. */
function spreadIndices(n: number, k: number, jitter: number): number[] {
  if (k >= n) return Array.from({ length: n }, (_, i) => i);
  if (k <= 0) return [];
  const picked = new Set<number>();
  for (let i = 0; i < k; i++) {
    const base = k === 1 ? (n - 1) / 2 : (i * (n - 1)) / (k - 1);
    const step = (n - 1) / Math.max(k - 1, 1);
    let idx = Math.round(base + (jitter - 0.5) * step * 0.5);
    idx = Math.max(0, Math.min(n - 1, idx));
    while (picked.has(idx) && idx < n - 1) idx++;
    while (picked.has(idx) && idx > 0) idx--;
    picked.add(idx);
  }
  return [...picked].sort((a, b) => a - b);
}

/**
 * Keep an even share per album, sampling across each album's length.
 * Pinned track ids are always kept and count toward their album's share.
 */
export function selectTracks(
  albums: MixtapeAlbum[],
  target: number,
  pinnedIds: Set<string>,
  rng: () => number,
  useJitter: boolean,
): MixtapeAlbum[] {
  const quotas = albumQuotas(albums.map((a) => a.tracks.length), target);
  return albums.map((album, ai) => {
    const pinned = album.tracks.filter((t) => pinnedIds.has(t.trackId));
    const rest = album.tracks.filter((t) => !pinnedIds.has(t.trackId));
    const need = Math.max(0, quotas[ai] - pinned.length);
    const jitter = useJitter ? rng() : 0.5;
    const chosen = new Set<MixtapeTrack>([...pinned, ...spreadIndices(rest.length, need, jitter).map((i) => rest[i])]);
    return { ...album, tracks: album.tracks.filter((t) => chosen.has(t)) };
  });
}
