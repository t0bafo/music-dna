import type { MixtapeOrdering, MixtapeTrack } from './types';

/** Minimum share of tracks with a valid feature before a feature-based ordering is allowed. */
export const FEATURE_COVERAGE_THRESHOLD = 0.8;

const isNum = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v);

export const isValidBpm = (v: unknown): v is number => isNum(v) && v >= 40 && v <= 250;
export const isValidUnit = (v: unknown): v is number => isNum(v) && v >= 0 && v <= 1;

export function hasAllFeatures(t: MixtapeTrack): boolean {
  return isValidBpm(t.bpm) && isValidUnit(t.energy) && isValidUnit(t.valence) && isValidUnit(t.danceability);
}

const coverage = (tracks: MixtapeTrack[], valid: (t: MixtapeTrack) => boolean) =>
  tracks.length === 0 ? 0 : tracks.filter(valid).length / tracks.length;

/** Orderings that cannot run on this pool, with a human-readable reason. */
export function disabledOrderings(tracks: MixtapeTrack[]): { ordering: MixtapeOrdering; reason: string }[] {
  const out: { ordering: MixtapeOrdering; reason: string }[] = [];
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const bpm = coverage(tracks, (t) => isValidBpm(t.bpm));
  if (bpm < FEATURE_COVERAGE_THRESHOLD) {
    out.push({ ordering: 'bpm_flow', reason: `BPM available for ${pct(bpm)} of tracks (needs ${pct(FEATURE_COVERAGE_THRESHOLD)})` });
  }
  const energy = coverage(tracks, (t) => isValidUnit(t.energy));
  if (energy < FEATURE_COVERAGE_THRESHOLD) {
    out.push({ ordering: 'energy_arc', reason: `Energy available for ${pct(energy)} of tracks (needs ${pct(FEATURE_COVERAGE_THRESHOLD)})` });
  }
  return out;
}
