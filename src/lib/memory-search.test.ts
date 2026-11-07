import { describe, expect, it } from 'vitest';
import { interpret, searchByMemory } from './memory-search';
import { SAMPLE_CRATE } from './sample-crate';

describe('search by memory', () => {
  it('drops filler words and shows synonym expansions', () => {
    const t = interpret('the late night drive');
    expect(t.map((x) => x.term)).toEqual(expect.arrayContaining(['late', 'night', 'drive', 'midnight']));
    expect(t.find((x) => x.term === 'the')).toBeUndefined();
  });
  it('only matches tracks whose own note contains the term, with evidence', () => {
    const r = searchByMemory(SAMPLE_CRATE, interpret('sunrise'));
    expect(r.map((m) => m.track.title)).toEqual(['Godly']);
    expect(r[0].evidence[0].snippet.toLowerCase()).toContain('sunrise');
  });
  it('returns nothing when no written text matches', () => {
    expect(searchByMemory(SAMPLE_CRATE, interpret('wedding'))).toEqual([]);
  });
  it('removing an interpretation removes its matches', () => {
    const terms = interpret('sunrise').filter((t) => t.term !== 'sunrise');
    expect(searchByMemory(SAMPLE_CRATE, terms)).toEqual([]);
  });
  it('does not mutate the crate', () => {
    const before = JSON.stringify(SAMPLE_CRATE);
    searchByMemory(SAMPLE_CRATE, interpret('late night'));
    expect(JSON.stringify(SAMPLE_CRATE)).toBe(before);
  });
});
