import { disabledOrderings, hasAllFeatures } from './features';
import { ORDERINGS } from './orderings';
import { createRng } from './random';
import { selectTracks } from './select';
import { applyPins, avoidBackToBack, splitSides, trimToMinutes } from './smoothing';
import type { MixtapeAlbum, MixtapeResult, MixtapeSettings, MixtapeTrack } from './types';

export * from './types';
export { disabledOrderings, isValidBpm, isValidUnit, FEATURE_COVERAGE_THRESHOLD } from './features';

export const MIN_ALBUMS = 2;
export const MAX_ALBUMS = 5;

/** Copy inputs, sort by disc/track, and drop track ids already seen in an earlier album. */
function prepare(albums: MixtapeAlbum[], notes: string[]): MixtapeAlbum[] {
  const seen = new Set<string>();
  let dupes = 0;
  const out = albums.map((a) => {
    const tracks = a.tracks
      .map((t) => ({ ...t, artists: [...t.artists] }))
      .sort((x, y) => x.discNumber - y.discNumber || x.trackNumber - y.trackNumber)
      .filter((t) => {
        if (seen.has(t.trackId)) { dupes++; return false; }
        seen.add(t.trackId);
        return true;
      });
    return { albumId: a.albumId, albumName: a.albumName, tracks };
  });
  if (dupes) notes.push(`Removed ${dupes} duplicate track(s) shared between albums.`);
  return out;
}

export function generateMixtape(albums: MixtapeAlbum[], settings: MixtapeSettings): MixtapeResult {
  const notes: string[] = [];
  if (albums.length < MIN_ALBUMS || albums.length > MAX_ALBUMS) {
    notes.push(`Expected ${MIN_ALBUMS}–${MAX_ALBUMS} albums, got ${albums.length}.`);
  }
  const rng = createRng(settings.seed ?? 0);
  const prepared = prepare(albums, notes);
  const pool = prepared.flatMap((a) => a.tracks);
  const byId = new Map(pool.map((t) => [t.trackId, t]));
  const disabled = disabledOrderings(pool);
  const diagnostics = {
    disabledOrderings: disabled,
    missingFeatureCount: pool.filter((t) => !hasAllFeatures(t)).length,
    notes,
  };

  // Resolve pins against the pool.
  const pinEntries: [number, string][] = [];
  for (const [slot, id] of Object.entries(settings.pinned ?? {})) {
    const s = Number(slot);
    if (!Number.isInteger(s) || s < 0) notes.push(`Ignored pin at invalid slot "${slot}".`);
    else if (!byId.has(id)) notes.push(`Ignored pin for unknown track ${id}.`);
    else if (pinEntries.some(([, pid]) => pid === id)) notes.push(`Ignored duplicate pin for track ${id}.`);
    else pinEntries.push([s, id]);
  }

  // Selection
  let target = pool.length;
  if (settings.targetTracks !== undefined) {
    if (settings.targetTracks > pool.length) {
      notes.push(`Requested ${settings.targetTracks} tracks but only ${pool.length} available; using all.`);
    } else {
      target = Math.max(settings.targetTracks, pinEntries.length);
    }
  }
  const selected =
    target < pool.length
      ? selectTracks(prepared, target, new Set(pinEntries.map(([, id]) => id)), rng, (settings.seed ?? 0) !== 0)
      : prepared;

  // Ordering (with fallback)
  let ordering = settings.ordering;
  const blocked = disabled.find((d) => d.ordering === ordering);
  if (blocked) {
    notes.push(`Fell back to journey: ${blocked.reason}.`);
    ordering = 'journey';
  }
  let tracks: MixtapeTrack[] = ORDERINGS[ordering](selected, rng);

  // Pins
  const pins = new Map<number, MixtapeTrack>();
  for (const [slot, id] of pinEntries) {
    if (slot >= tracks.length) notes.push(`Ignored pin at slot ${slot}: mixtape has ${tracks.length} tracks.`);
    else pins.set(slot, byId.get(id) as MixtapeTrack);
  }
  tracks = applyPins(tracks, pins);
  tracks = avoidBackToBack(tracks, new Set(pins.keys()));

  // Length
  if (settings.targetMinutes !== undefined) {
    const minLength = pins.size ? Math.max(...pins.keys()) + 1 : 0;
    const before = tracks.length;
    tracks = trimToMinutes(tracks, settings.targetMinutes, minLength);
    const mins = tracks.reduce((s, t) => s + t.durationMs, 0) / 60_000;
    if (mins > settings.targetMinutes) notes.push('Kept tracks past the minute limit to preserve pinned slots.');
    else if (tracks.length === before && before === pool.length && mins < settings.targetMinutes) {
      notes.push(`Only ${Math.round(mins)} minutes available; using all tracks.`);
    }
  }

  return {
    tracks,
    ...(settings.sides ? { sides: splitSides(tracks) } : {}),
    diagnostics,
  };
}
