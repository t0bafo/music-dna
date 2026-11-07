import { describe, expect, it, vi } from 'vitest';
import { buildStructureMessages, knownEnergy, rankCandidates, scoreTrack } from '../../../supabase/functions/_shared/curation-core';
import { handleVibeSearch, hashUserKey } from '../../../supabase/functions/_shared/vibe-search-core';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({}) }));
vi.mock('@/hooks/use-crates-search', () => ({ useAllCratesWithTracks: () => ({ data: [] }) }));
vi.mock('@/lib/crates-api', () => ({}));

const SPOTIFY_ID = 'spotify_user_8812';
const candidates = [
  { track_id: '4uLU6hMCjMI75M1A2tKUQC', name: 'Essence', artist: 'Wizkid', artist_genres: ['afrobeats'], tempo: 104, energy: 0.55, popularity: 80, source: 'library' },
  { track_id: '1x9ak2kZBQnB3FYzLkGUzM', name: 'Free Mind', artist: 'Tems', artist_genres: ['alte'], tempo: null, energy: null, popularity: 70, source: 'liked' },
];

describe('AI Curation: outbound model request (mock gateway)', () => {
  it('contains only the description — no track data or account ids', async () => {
    const sent: string[] = [];
    const mockGateway = vi.fn(async (_url: string, init: { body: string }) => { sent.push(init.body); return { ok: true, json: async () => ({}) }; });
    const messages = buildStructureMessages('SYSTEM', 'late night drive in Lagos');
    // Rank candidates (the only place tracks are used) and then "send" what the function sends.
    rankCandidates(candidates, { name: 'Open', bpmRange: [90, 110], energyRange: [0.4, 0.6] }, ['afrobeats'], 1);
    await mockGateway('https://ai.gateway.lovable.dev/v1/chat/completions', { body: JSON.stringify({ messages }) });
    const body = sent.join('\n');
    expect(body).toContain('late night drive in Lagos');
    for (const c of candidates) {
      expect(body).not.toContain(c.track_id);
      expect(body).not.toContain(c.name);
      expect(body).not.toContain(c.artist);
    }
    expect(body).not.toContain(SPOTIFY_ID);
  });

  it('caps the description length sent to the model', () => {
    const m = buildStructureMessages('S', 'x'.repeat(2000));
    expect(m[1].content.length).toBeLessThan(560);
  });
});

describe('missing vs zero energy', () => {
  it('keeps 0 as a real value and missing as unknown', () => {
    expect(knownEnergy(0)).toBe(0);
    expect(knownEnergy(null)).toBeNull();
    expect(knownEnergy(undefined)).toBeNull();
  });
  it('missing energy neither helps nor hurts the score', () => {
    const section = { name: 's', energyRange: [0.4, 0.6] as [number, number] };
    const base = { track_id: 'a', source: 'library' };
    expect(scoreTrack({ ...base, energy: null }, section, [])).toBe(scoreTrack({ ...base }, { name: 's' }, []));
  });
  it('zero energy is ranked as low energy, not as unknown', () => {
    const section = { name: 's', energyRange: [0.4, 0.6] as [number, number] };
    const zero = scoreTrack({ track_id: 'z', energy: 0, source: 'library' }, section, []);
    const unknown = scoreTrack({ track_id: 'u', energy: null, source: 'library' }, section, []);
    expect(zero).toBeLessThan(unknown);
  });
});

describe('vibe search protection', () => {
  const deps = (over: Partial<Parameters<typeof handleVibeSearch>[1]> = {}) => {
    const callModel = vi.fn(async () => '{"vibes":["late-night"]}');
    return { callModel, d: { verifyUser: async (t: string | null) => (t === 'good' ? 'k' : null), allow: async () => true, callModel, ...over } };
  };
  it('rejects signed-out requests before any model call', async () => {
    const { d, callModel } = deps();
    const r = await handleVibeSearch({ query: 'late night drive', spotifyToken: null }, d);
    expect(r.status).toBe(401);
    expect(callModel).not.toHaveBeenCalled();
  });
  it('rejects rate-limited users before any model call', async () => {
    const { d, callModel } = deps({ allow: async () => false });
    const r = await handleVibeSearch({ query: 'late night drive', spotifyToken: 'good' }, d);
    expect(r.status).toBe(429);
    expect(callModel).not.toHaveBeenCalled();
  });
  it('single-word queries bypass auth and the model', async () => {
    const verifyUser = vi.fn(async () => null);
    const { d, callModel } = deps({ verifyUser });
    const r = await handleVibeSearch({ query: 'Tems', spotifyToken: null }, d);
    expect(r).toEqual({ status: 200, body: { filters: null, skipped: true } });
    expect(callModel).not.toHaveBeenCalled();
    expect(verifyUser).not.toHaveBeenCalled();
  });
  it('sends only the query text to the model', async () => {
    const { d, callModel } = deps();
    await handleVibeSearch({ query: 'late night drive', spotifyToken: 'good' }, d);
    expect(callModel).toHaveBeenCalledWith('late night drive');
  });
  it('model unavailable → filters null, not an error', async () => {
    const { d } = deps({ callModel: async () => { throw { status: 503 }; } });
    const r = await handleVibeSearch({ query: 'late night drive', spotifyToken: 'good' }, d);
    expect(r.status).toBe(200);
    expect(r.body.filters).toBeNull();
  });
  it('rate-limit keys never contain the Spotify id', async () => {
    const k = await hashUserKey(SPOTIFY_ID);
    expect(k).not.toContain(SPOTIFY_ID);
    expect(k).toHaveLength(64);
  });
});

describe('manual title/artist search with the model unavailable', () => {
  it('still finds tracks by title and artist', async () => {
    const { hybridSearch } = await import('@/hooks/use-vibe-search');
    const crates = [{ id: 'c1', name: 'Night', tracks: [{ id: 't1', track_name: 'Essence', artist_name: 'Wizkid', track_id: 'x' }] }] as never;
    expect(hybridSearch('essence', null, crates).totalCount).toBe(1);
    expect(hybridSearch('wizkid', null, crates).totalCount).toBe(1);
  });
});
