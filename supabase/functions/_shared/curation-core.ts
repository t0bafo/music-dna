/**
 * Pure AI Curation core. Shared by the ai-curation edge function and unit tests.
 *
 * Data boundary: the ONLY user content that reaches the model is the free-text
 * description. Candidate tracks (Spotify-derived) are ranked here, in code,
 * and never serialized into a model request. `buildStructureMessages` is the
 * single function that builds model input and it accepts only a string.
 */

export interface SectionPlan {
  name: string;
  bpmRange?: [number, number];
  energyRange?: [number, number];
}

export interface RankableTrack {
  track_id: string;
  artist?: string;
  artist_name?: string;
  artist_genres?: string[] | null;
  tempo?: number | null;
  bpm?: number | null;
  energy?: number | null;
  source?: string;
}

export const MAX_PROMPT_CHARS = 500;

/** Model input for crate structure. Takes the user's description only. */
export function buildStructureMessages(systemPrompt: string, description: string) {
  const text = String(description).slice(0, MAX_PROMPT_CHARS);
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Create a crate structure for: "${text}"` },
  ];
}

/** Quality evidence, not an invented energy-based score. Never bridge unknown gaps. */
export function energyEvidence(tracks: RankableTrack[]) {
  const values = tracks.map(t => knownEnergy(t.energy));
  const known = values.filter((v): v is number => v !== null);
  const jumps: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const previous = values[i - 1];
    const current = values[i];
    if (previous !== null && previous !== undefined && current !== null && current !== undefined) {
      jumps.push(Math.abs(current - previous));
    }
  }
  return {
    knownCount: known.length,
    totalCount: tracks.length,
    flow: jumps.length ? Math.max(0, 3 - jumps.filter(d => d > 0.3).length * 0.5) : null,
    balance: known.length >= 2 ? (() => {
      const mean = known.reduce((a, b) => a + b, 0) / known.length;
      const ratio = known.filter(e => Math.abs(e - mean) > 0.2).length / known.length;
      return ratio < 0.2 ? 1.5 : ratio < 0.4 ? 2.5 : 3;
    })() : null,
  };
}

/** Returns a 0–1 energy value, or null when unknown. Zero is a real value. */
export function knownEnergy(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null;
}

export function knownBpm(t: RankableTrack): number | null {
  const v = t.tempo ?? t.bpm;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

const SOURCE_WEIGHT: Record<string, number> = { library: 1, liked: 1, recommendation: 0.4, catalog: 0.2 };

/**
 * Score a track against a section using only signals the track actually has.
 * Missing BPM/energy contribute nothing (neither bonus nor penalty): the score
 * is the mean of available signals, so unknown values never act as rankers.
 */
export function scoreTrack(t: RankableTrack, section: SectionPlan, scenes: string[]): number {
  const parts: number[] = [];
  const bpm = knownBpm(t);
  if (bpm != null && section.bpmRange) {
    const [lo, hi] = section.bpmRange;
    const d = bpm < lo ? lo - bpm : bpm > hi ? bpm - hi : 0;
    parts.push(Math.max(0, 1 - d / 30));
  }
  const energy = knownEnergy(t.energy);
  if (energy != null && section.energyRange) {
    const [lo, hi] = section.energyRange;
    const d = energy < lo ? lo - energy : energy > hi ? energy - hi : 0;
    parts.push(Math.max(0, 1 - d / 0.3));
  }
  if (scenes.length && t.artist_genres?.length) {
    const g = t.artist_genres.join(' ').toLowerCase();
    parts.push(scenes.some((s) => g.includes(s.toLowerCase())) ? 1 : 0);
  }
  parts.push(SOURCE_WEIGHT[t.source ?? 'library'] ?? 0.5);
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

/** Deterministic selection: best score first, stable on ties, max 2 per artist when possible. */
export function rankCandidates<T extends RankableTrack>(candidates: T[], section: SectionPlan, scenes: string[], count: number): T[] {
  const scored = candidates
    .map((t, i) => ({ t, i, s: scoreTrack(t, section, scenes) }))
    .sort((a, b) => b.s - a.s || a.i - b.i);
  const perArtist = new Map<string, number>();
  const picked: T[] = [];
  const overflow: T[] = [];
  for (const { t } of scored) {
    const a = (t.artist ?? t.artist_name ?? '').toLowerCase();
    const n = perArtist.get(a) ?? 0;
    if (n < 2) { picked.push(t); perArtist.set(a, n + 1); } else overflow.push(t);
    if (picked.length >= count) break;
  }
  for (const t of overflow) { if (picked.length >= count) break; picked.push(t); }
  return picked.slice(0, count);
}
