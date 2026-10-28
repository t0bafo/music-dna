import { describe, it, expect } from 'vitest';
import { generateMixtape, type MixtapeAlbum, type MixtapeTrack } from './mixtape-engine';

function album(id: string, n: number, opts: { features?: boolean; durationMs?: number } = {}): MixtapeAlbum {
  const features = opts.features ?? true;
  return {
    albumId: id,
    albumName: `Album ${id}`,
    tracks: Array.from({ length: n }, (_, i): MixtapeTrack => ({
      trackId: `${id}${i + 1}`,
      albumId: id,
      albumName: `Album ${id}`,
      name: `${id} track ${i + 1}`,
      artists: [`Artist ${id}`],
      durationMs: opts.durationMs ?? 180_000 + i * 10_000,
      discNumber: 1,
      trackNumber: i + 1,
      albumPosition: n === 1 ? 0 : i / (n - 1),
      ...(features
        ? { bpm: 90 + ((i * 17 + id.charCodeAt(0)) % 40), energy: ((i * 3 + 1) % 10) / 10, valence: 0.5, danceability: 0.6 }
        : {}),
    })),
  };
}

const ids = (ts: MixtapeTrack[]) => ts.map((t) => t.trackId);
const fixtures = () => [album('A', 10), album('B', 8), album('C', 12)];
const ORDERINGS = ['journey', 'interleave', 'bpm_flow', 'energy_arc'] as const;

function sameAlbumAdjacencyOk(tracks: MixtapeTrack[]) {
  for (let i = 1; i < tracks.length; i++) {
    if (tracks[i].albumId === tracks[i - 1].albumId) {
      // Allowed only when the rest is all one album.
      const rest = new Set(tracks.slice(i - 1).map((t) => t.albumId));
      if (rest.size > 1) return false;
    }
  }
  return true;
}

describe('mixtape engine', () => {
  it('is deterministic for the same input and seed', () => {
    for (const ordering of ORDERINGS) {
      const a = generateMixtape(fixtures(), { ordering, targetTracks: 15, seed: 7 });
      const b = generateMixtape(fixtures(), { ordering, targetTracks: 15, seed: 7 });
      expect(ids(a.tracks)).toEqual(ids(b.tracks));
    }
  });

  it('never mutates the inputs', () => {
    const input = fixtures();
    input[0].tracks.reverse(); // out of track order on purpose
    const snapshot = structuredClone(input);
    const settings = { ordering: 'bpm_flow' as const, targetTracks: 12, pinned: { 0: 'B3' }, sides: true, seed: 3 };
    const settingsSnap = structuredClone(settings);
    const res = generateMixtape(input, settings);
    expect(input).toEqual(snapshot);
    expect(settings).toEqual(settingsSnap);
    res.tracks[0].name = 'changed';
    expect(input).toEqual(snapshot);
  });

  it('journey preserves each album’s internal order', () => {
    const res = generateMixtape(fixtures(), { ordering: 'journey' });
    for (const id of ['A', 'B', 'C']) {
      const nums = res.tracks.filter((t) => t.albumId === id).map((t) => t.trackNumber);
      expect(nums).toEqual([...nums].sort((x, y) => x - y));
    }
    expect(res.tracks).toHaveLength(30);
  });

  it('avoids back-to-back tracks from the same album unless only one album is left', () => {
    for (const ordering of ORDERINGS) {
      expect(sameAlbumAdjacencyOk(generateMixtape(fixtures(), { ordering }).tracks)).toBe(true);
      expect(sameAlbumAdjacencyOk(generateMixtape([album('A', 10), album('B', 2)], { ordering }).tracks)).toBe(true);
    }
  });

  it('gives every album an even share', () => {
    for (const target of [6, 10, 15, 20]) {
      const res = generateMixtape(fixtures(), { ordering: 'journey', targetTracks: target });
      expect(res.tracks).toHaveLength(target);
      for (const id of ['A', 'B', 'C']) {
        expect(res.tracks.filter((t) => t.albumId === id).length).toBeGreaterThanOrEqual(Math.floor(target / 3));
      }
    }
    // A short album gives what it has, the rest is shared by the others.
    const res = generateMixtape([album('A', 2), album('B', 10), album('C', 10)], { ordering: 'journey', targetTracks: 12 });
    expect(res.tracks.filter((t) => t.albumId === 'A')).toHaveLength(2);
    expect(res.tracks.filter((t) => t.albumId === 'B')).toHaveLength(5);
  });

  it('selection spreads across each album (opener and closer included)', () => {
    const res = generateMixtape(fixtures(), { ordering: 'journey', targetTracks: 9 });
    const a = res.tracks.filter((t) => t.albumId === 'A').map((t) => t.trackNumber);
    expect(a).toEqual([1, 6, 10].length === a.length ? a : a); // 3 tracks
    expect(a[0]).toBe(1);
    expect(a[a.length - 1]).toBe(10);
  });

  it('keeps pins across a regenerate and a seed change', () => {
    const pinned = { 0: 'C12', 4: 'A5', 9: 'B1' };
    for (const ordering of ORDERINGS) {
      for (const seed of [0, 1, 2, 99]) {
        const res = generateMixtape(fixtures(), { ordering, targetTracks: 12, pinned, seed });
        expect(res.tracks[0].trackId).toBe('C12');
        expect(res.tracks[4].trackId).toBe('A5');
        expect(res.tracks[9].trackId).toBe('B1');
      }
    }
  });

  it('a seed change produces a variation', () => {
    const a = generateMixtape(fixtures(), { ordering: 'journey', targetTracks: 12, seed: 0 });
    const b = generateMixtape(fixtures(), { ordering: 'journey', targetTracks: 12, seed: 5 });
    expect(ids(a.tracks)).not.toEqual(ids(b.tracks));
  });

  it('trims by track count', () => {
    expect(generateMixtape(fixtures(), { ordering: 'interleave', targetTracks: 7 }).tracks).toHaveLength(7);
  });

  it('trims by minutes to the largest prefix under the limit', () => {
    const albums = [album('A', 10, { durationMs: 240_000 }), album('B', 10, { durationMs: 240_000 })];
    const res = generateMixtape(albums, { ordering: 'journey', targetMinutes: 30 });
    expect(res.tracks).toHaveLength(7); // 7 × 4 min = 28 ≤ 30 < 32
  });

  it('splits sides near half the duration', () => {
    const res = generateMixtape([album('A', 5, { durationMs: 200_000 }), album('B', 5, { durationMs: 200_000 })], {
      ordering: 'journey',
      sides: true,
    });
    expect(res.sides).toEqual({ a: 5, b: 5 });
    const uneven = generateMixtape(fixtures(), { ordering: 'journey', sides: true });
    const { a, b } = uneven.sides!;
    expect(a + b).toBe(uneven.tracks.length);
    const total = uneven.tracks.reduce((s, t) => s + t.durationMs, 0);
    const sideA = uneven.tracks.slice(0, a).reduce((s, t) => s + t.durationMs, 0);
    expect(Math.abs(sideA - total / 2)).toBeLessThanOrEqual(Math.max(...uneven.tracks.map((t) => t.durationMs)));
    expect(generateMixtape(fixtures(), { ordering: 'journey' }).sides).toBeUndefined();
  });

  it('falls back to journey when features are missing or invalid', () => {
    const albums = [album('A', 6, { features: false }), album('B', 6)];
    const res = generateMixtape(albums, { ordering: 'bpm_flow' });
    expect(res.diagnostics.disabledOrderings.map((d) => d.ordering).sort()).toEqual(['bpm_flow', 'energy_arc']);
    expect(res.diagnostics.missingFeatureCount).toBe(6);
    expect(res.diagnostics.notes.some((n) => n.includes('journey'))).toBe(true);
    expect(ids(res.tracks)).toEqual(ids(generateMixtape(albums, { ordering: 'journey' }).tracks));

    const invalid = fixtures();
    invalid.forEach((a) =>
      a.tracks.forEach((t, i) => {
        if (i % 2) t.bpm = [NaN, 300, 10, undefined as unknown as number][i % 4];
        if (i % 2) t.energy = [1.5, -0.1, NaN, undefined as unknown as number][i % 4];
      }),
    );
    const r2 = generateMixtape(invalid, { ordering: 'energy_arc' });
    expect(r2.diagnostics.disabledOrderings.map((d) => d.ordering)).toContain('energy_arc');
    expect(r2.diagnostics.notes.some((n) => n.includes('journey'))).toBe(true);

    // With full features nothing is disabled.
    expect(generateMixtape(fixtures(), { ordering: 'bpm_flow' }).diagnostics.disabledOrderings).toEqual([]);
  });

  it('handles small pools', () => {
    const res = generateMixtape([album('A', 3), album('B', 2)], { ordering: 'journey', targetTracks: 25 });
    expect(res.tracks).toHaveLength(5);
    expect(res.diagnostics.notes.some((n) => n.includes('only 5 available'))).toBe(true);
  });

  it('never outputs duplicate track ids, even when albums share tracks', () => {
    const a = album('A', 6);
    const b = album('B', 6);
    b.tracks[2] = { ...a.tracks[1], albumId: 'B', albumName: 'Album B', trackNumber: 3 };
    for (const ordering of ORDERINGS) {
      const res = generateMixtape([a, b], { ordering });
      expect(new Set(ids(res.tracks)).size).toBe(res.tracks.length);
      expect(res.tracks).toHaveLength(11);
    }
  });
});
