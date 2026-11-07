import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAllPlaylistTracks } from './spotify-api';
import { CRATE_STARTERS, recentCrates, searchLibrary, playlistTracksToAdd } from './library';
import type { CrateWithTracks } from './crates-api';
import type { SpotifyTrack } from './spotify-api';

const crate: CrateWithTracks = { id: 'late', user_id: 'test', name: 'Late Drive', description: null, emoji: '', color: '', created_at: '', updated_at: '', track_count: 1,
  tracks: [{ id: 'row', crate_id: 'late', track_id: 'song', position: 0, added_at: '', name: 'Can’t Breathe', artist_name: 'Llona' }] };
describe('Library rules', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('reads every playlist page with GET only and skips local files and unavailable tracks', async () => {
    const song = { id: 'one', name: 'Song', artists: [], album: { id: 'a', name: 'Album', images: [] }, duration_ms: 1, popularity: 1 };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ track: song }, { track: null }, { track: { ...song, id: 'local', is_local: true } }], next: 'next-page' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ track: { ...song, id: 'two' } }], next: null }) });
    vi.stubGlobal('fetch', fetchMock);
    expect((await getAllPlaylistTracks('fixture', 'playlist')).map(t => t.id)).toEqual(['one', 'two']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('offset=3');
    expect(fetchMock.mock.calls.every(call => !call[1].method || call[1].method === 'GET')).toBe(true);
  });
  it('separates crate matches from saved-track matches', () => {
    expect(searchLibrary('Late Drive', [crate])).toEqual({ crates: [crate], tracks: [] });
    const result = searchLibrary('Llona', [crate]);
    expect(result.crates).toEqual([]);
    expect(result.tracks[0].track.track_id).toBe('song');
    expect(result.tracks[0].crate.id).toBe('late');
  });
  it('shows at most three real recently opened collections without duplicates', () => {
    const crates = ['late', 'two', 'three', 'four'].map(id => ({ ...crate, id }));
    expect(recentCrates(['missing', 'late', 'late', 'two', 'three', 'four'], crates).map(c => c.id)).toEqual(['late', 'two', 'three']);
    expect(recentCrates([], crates)).toEqual([]);
  });
  it('has exactly three editable name-and-note starters, with no tracks', () => {
    expect(CRATE_STARTERS.map(s => s.name)).toEqual(['Late Night Drive', 'Songs I Found This Week', 'Before the Party']);
    expect(CRATE_STARTERS.every(s => s.note.length > 0 && !('tracks' in s))).toBe(true);
  });
  it('preserves playlist order and removes repeated songs without inventing features', () => {
    const song = (id: string): SpotifyTrack => ({ id, name: id, artists: [{ id: 'artist', name: 'Llona' }], album: { id: 'album', name: 'Homeless', images: [] }, duration_ms: 180000, popularity: 35 });
    const input = [song('b'), song('a'), song('b')];
    const result = playlistTracksToAdd(input);
    expect(result.map(t => t.track_id)).toEqual(['b', 'a']);
    expect(result[0].bpm).toBeUndefined();
    expect(result[0].energy).toBeUndefined();
    expect(input).toHaveLength(3);
  });
});