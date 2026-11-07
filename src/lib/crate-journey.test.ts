import { describe, it, expect } from 'vitest';
import { sanitizeReturnTo } from './return-to';
import { qualityScore, flowScore, balanceScore, flowChartData, popularitySignal, durationInfo } from './crate-analysis';
import { SAMPLE_CRATE, searchSampleTracks } from './sample-crate';
import type { CrateTrack } from './crates-api';

const t = (p: Partial<CrateTrack>, i = 0): CrateTrack => ({ id: `t${i}`, crate_id: 'c', track_id: `x${i}`, position: i, added_at: '', ...p });

describe('return destination', () => {
  it('keeps a validated in-app deep link', () => expect(sanitizeReturnTo('/crates/abc')).toBe('/crates/abc'));
  it('rejects external or protocol-relative URLs', () => {
    expect(sanitizeReturnTo('https://evil.com')).toBeNull();
    expect(sanitizeReturnTo('//evil.com')).toBeNull();
    expect(sanitizeReturnTo('/\\evil.com')).toBeNull();
  });
  it('rejects the callback and landing so ordinary sign-in lands on Crates', () => {
    expect(sanitizeReturnTo('/callback?code=1')).toBeNull();
    expect(sanitizeReturnTo('/')).toBeNull();
  });
});

describe('analysis without audio data', () => {
  const noAudio = Array.from({ length: 6 }, (_, i) => t({ popularity: 30, duration_ms: 200000 }, i));
  it('does not award perfect flow or balance', () => {
    expect(flowScore(noAudio)).toBeNull();
    expect(balanceScore(noAudio)).toBeNull();
  });
  it('hides the overall score instead of reweighting', () => expect(qualityScore(noAudio).total).toBeNull());
  it('leaves chart gaps instead of 50%', () => {
    const data = flowChartData([t({ energy: 0.8 }, 0), t({}, 1), t({ energy: 0.4 }, 2)]);
    expect(data.map((d) => d.energy)).toEqual([80, null, 40]);
  });
  it('treats missing popularity as unknown', () => {
    const s = popularitySignal([t({ popularity: 20 }, 0), t({}, 1)]);
    expect(s.percentLow).toBe(100);
    expect(s.coverage).toEqual({ available: 1, total: 2 });
    expect(popularitySignal([t({}, 0)]).percentLow).toBeNull();
  });
  it('marks imputed duration as estimated', () => {
    expect(durationInfo([t({ duration_ms: 100000 }, 0), t({}, 1)])).toEqual({ totalMs: 200000, isEstimated: true, missingCount: 1 });
  });
  it('scores fully measured crates', () => {
    const full = [0.5, 0.55, 0.6, 0.9, 0.3].map((e, i) => t({ energy: e, popularity: 40, duration_ms: 240000 }, i));
    expect(qualityScore(full).total).not.toBeNull();
  });
});

describe('sample crate', () => {
  it('has 5–7 tracks and searches by title or artist', () => {
    expect(SAMPLE_CRATE.tracks.length).toBeGreaterThanOrEqual(5);
    expect(SAMPLE_CRATE.tracks.length).toBeLessThanOrEqual(7);
    expect(searchSampleTracks(SAMPLE_CRATE.tracks, 'tems').map((x) => x.title)).toEqual(['Essence', 'Free Mind']);
    expect(searchSampleTracks(SAMPLE_CRATE.tracks, 'zzz')).toEqual([]);
  });
});
