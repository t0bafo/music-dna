import type { CrateTrack } from '@/lib/crates-api';

/** Popularity below this Spotify value counts toward the "Spotify popularity signal". */
export const LOW_POPULARITY_THRESHOLD = 50;
export const MIN_ENERGY_TRACKS = 3;

const hasEnergy = (t: Pick<CrateTrack, 'energy'>) => typeof t.energy === 'number' && !Number.isNaN(t.energy);
const hasPopularity = (t: Pick<CrateTrack, 'popularity'>) => typeof t.popularity === 'number';

export interface Coverage { available: number; total: number }

export function energyCoverage(tracks: Pick<CrateTrack, 'energy'>[]): Coverage {
  return { available: tracks.filter(hasEnergy).length, total: tracks.length };
}

/** Flow (0-3): only measured between adjacent tracks that both have energy. null = not enough data. */
export function flowScore(tracks: Pick<CrateTrack, 'energy'>[]): number | null {
  const pairs: [number, number][] = [];
  for (let i = 1; i < tracks.length; i++) {
    const a = tracks[i - 1].energy, b = tracks[i].energy;
    if (hasEnergy({ energy: a }) && hasEnergy({ energy: b })) pairs.push([a!, b!]);
  }
  if (energyCoverage(tracks).available < MIN_ENERGY_TRACKS || pairs.length < 2) return null;
  const jumps = pairs.filter(([a, b]) => Math.abs(b - a) > 0.3).length;
  return Number(Math.max(0, 3 - jumps * 0.5).toFixed(1));
}

/** Balance (0-3): variety in energy. null = not enough data. */
export function balanceScore(tracks: Pick<CrateTrack, 'energy'>[]): number | null {
  const values = tracks.filter(hasEnergy).map((t) => t.energy!);
  if (values.length < MIN_ENERGY_TRACKS) return null;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const variety = values.filter((v) => Math.abs(v - avg) > 0.2).length / values.length;
  if (variety < 0.2) return 1.5;
  if (variety < 0.4) return 2.5;
  return 3;
}

export interface PopularitySignal { percentLow: number | null; coverage: Coverage }

/** Share of tracks (with known popularity) below the threshold. Missing popularity is unknown, not 0. */
export function popularitySignal(tracks: Pick<CrateTrack, 'popularity'>[]): PopularitySignal {
  const known = tracks.filter(hasPopularity);
  const coverage = { available: known.length, total: tracks.length };
  if (known.length === 0) return { percentLow: null, coverage };
  const low = known.filter((t) => t.popularity! < LOW_POPULARITY_THRESHOLD).length;
  return { percentLow: Math.round((low / known.length) * 100), coverage };
}

export function undergroundPoints(percentLow: number | null): number | null {
  if (percentLow === null) return null;
  if (percentLow < 20) return 0.5;
  if (percentLow < 40) return 1;
  if (percentLow < 60) return 1.5;
  return 2;
}

export interface DurationInfo { totalMs: number; isEstimated: boolean; missingCount: number }

export function durationInfo(tracks: Pick<CrateTrack, 'duration_ms'>[]): DurationInfo {
  const known = tracks.filter((t) => t.duration_ms && t.duration_ms > 0);
  const knownMs = known.reduce((s, t) => s + t.duration_ms!, 0);
  const missingCount = tracks.length - known.length;
  const avg = known.length > 0 ? knownMs / known.length : 180000;
  return { totalMs: knownMs + missingCount * avg, isEstimated: missingCount > 0, missingCount };
}

export function lengthPoints(totalMs: number): number {
  const m = totalMs / 60000;
  if (m < 15) return 1;
  if (m < 30) return 1.5;
  if (m <= 90) return 2;
  return 1.5;
}

export interface QualityBreakdown {
  flow: number | null;
  balance: number | null;
  underground: number | null;
  length: number;
  /** null when any component is unavailable — never reweighted. */
  total: number | null;
}

export function qualityScore(tracks: CrateTrack[]): QualityBreakdown {
  const flow = flowScore(tracks);
  const balance = balanceScore(tracks);
  const underground = undergroundPoints(popularitySignal(tracks).percentLow);
  const length = lengthPoints(durationInfo(tracks).totalMs);
  const total = flow === null || balance === null || underground === null
    ? null
    : Number((flow + balance + underground + length).toFixed(1));
  return { flow, balance, underground, length, total };
}

export interface FlowPoint { position: number; energy: number | null; name: string; artist: string; bpm: number }

/** Chart points; tracks without energy stay null so the line breaks instead of inventing a value. */
export function flowChartData(tracks: CrateTrack[]): FlowPoint[] {
  return tracks.map((t, i) => ({
    position: i + 1,
    energy: hasEnergy(t) ? Math.round(t.energy! * 100) : null,
    name: t.name || 'Unknown',
    artist: t.artist_name || 'Unknown',
    bpm: t.bpm || 0,
  }));
}
