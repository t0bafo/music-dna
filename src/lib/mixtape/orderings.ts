import { isValidBpm, isValidUnit } from './features';
import type { MixtapeAlbum, MixtapeOrdering, MixtapeTrack } from './types';

type Orderer = (albums: MixtapeAlbum[], rng: () => number) => MixtapeTrack[];

/** Openers first, closers last; ties broken by the user's album order. Stable within each album. */
export const journey: Orderer = (albums) =>
  albums
    .flatMap((a, ai) => a.tracks.map((t, ti) => ({ t, ai, ti })))
    .sort((x, y) => x.t.albumPosition - y.t.albumPosition || x.ai - y.ai || x.ti - y.ti)
    .map((x) => x.t);

/** Round-robin A, B, C, A, B, C… in each album's track order. */
export const interleave: Orderer = (albums) => {
  const out: MixtapeTrack[] = [];
  const max = Math.max(0, ...albums.map((a) => a.tracks.length));
  for (let i = 0; i < max; i++) for (const a of albums) if (a.tracks[i]) out.push(a.tracks[i]);
  return out;
};

/** Greedy nearest-neighbour on BPM from the journey opener. Tracks without BPM go last, in journey order. */
export const bpmFlow: Orderer = (albums, rng) => {
  const base = journey(albums, rng);
  const withBpm = base.filter((t) => isValidBpm(t.bpm));
  const without = base.filter((t) => !isValidBpm(t.bpm));
  if (withBpm.length === 0) return base;
  const out = [withBpm[0]];
  const pool = withBpm.slice(1);
  while (pool.length) {
    const cur = out[out.length - 1].bpm as number;
    let best = Infinity;
    let candidates: number[] = [];
    pool.forEach((t, i) => {
      const d = Math.abs((t.bpm as number) - cur);
      if (d < best) { best = d; candidates = [i]; }
      else if (d === best) candidates.push(i);
    });
    const pick = candidates[Math.floor(rng() * candidates.length)];
    out.push(pool.splice(pick, 1)[0]);
  }
  return [...out, ...without];
};

/** Build → peak → cool-down: low third ascending, high third, mid third descending. */
export const energyArc: Orderer = (albums, rng) => {
  const base = journey(albums, rng);
  const valid = base.filter((t) => isValidUnit(t.energy)).map((t) => t.energy as number).sort((a, b) => a - b);
  const median = valid.length ? valid[Math.floor(valid.length / 2)] : 0.5;
  const e = (t: MixtapeTrack) => (isValidUnit(t.energy) ? (t.energy as number) : median);
  const sorted = base
    .map((t, i) => ({ t, i, tie: rng() }))
    .sort((a, b) => e(a.t) - e(b.t) || a.tie - b.tie || a.i - b.i)
    .map((x) => x.t);
  const n = sorted.length;
  const low = sorted.slice(0, Math.ceil(n / 3));
  const mid = sorted.slice(low.length, low.length + Math.floor(n / 3));
  const high = sorted.slice(low.length + mid.length);
  return [...low, ...high, ...mid.reverse()];
};

export const ORDERINGS: Record<MixtapeOrdering, Orderer> = {
  journey,
  interleave,
  bpm_flow: bpmFlow,
  energy_arc: energyArc,
};
