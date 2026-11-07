import type { Crate, CrateWithTracks, TrackToAdd } from './crates-api';
import type { SpotifyTrack } from './spotify-api';

export const CRATE_STARTERS = [
  { name: 'Late Night Drive', note: 'Where does the road take you tonight?' },
  { name: 'Songs I Found This Week', note: 'What made these songs stay with you?' },
  { name: 'Before the Party', note: 'What kind of night are you setting up?' },
];

export function recentCrates(ids: string[], crates: Crate[]): Crate[] {
  return [...new Set(ids)].flatMap(id => {
    const crate = crates.find(c => c.id === id);
    return crate ? [crate] : [];
  }).slice(0, 3);
}

export function searchLibrary(query: string, crates: CrateWithTracks[]) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return { crates: [], tracks: [] };
  return {
    crates: crates.filter(c => c.name.toLocaleLowerCase().includes(q)),
    tracks: crates.flatMap(c => c.tracks.filter(t =>
      [t.name, t.artist_name, t.album_name].some(value => value?.toLocaleLowerCase().includes(q))
    ).map(track => ({ track, crate: c }))).slice(0, 50),
  };
}

export function playlistTracksToAdd(tracks: SpotifyTrack[]): TrackToAdd[] {
  const seen = new Set<string>();
  return tracks.filter(t => {
    if (!t?.id || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).map(t => ({
    track_id: t.id, name: t.name, artist_name: t.artists.map(a => a.name).join(', '),
    album_name: t.album?.name ?? '', album_art_url: t.album?.images?.[0]?.url ?? '',
    duration_ms: t.duration_ms, popularity: t.popularity,
  }));
}

export function readLibraryState(key: string): { query: string; scroll: number; view: 'list' | 'grid'; recent: string[] } {
  try {
    const data = JSON.parse(sessionStorage.getItem(key) ?? '{}');
    return { query: typeof data.query === 'string' ? data.query : '', scroll: typeof data.scroll === 'number' ? data.scroll : 0,
      view: data.view === 'grid' ? 'grid' : 'list', recent: Array.isArray(data.recent) ? data.recent.filter((id: unknown) => typeof id === 'string') : [] };
  } catch { return { query: '', scroll: 0, view: 'list', recent: [] }; }
}

export function recordCrateOpen(key: string, id: string) {
  const state = readLibraryState(key);
  try { sessionStorage.setItem(key, JSON.stringify({ ...state, recent: [id, ...state.recent.filter(c => c !== id)].slice(0, 20) })); } catch { /* Storage is optional. */ }
}