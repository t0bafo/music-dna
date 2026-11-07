import { describe, expect, it } from 'vitest';
import { SHARE_FORMATS, truncate } from './ShareCard';
import { buildCaption } from './ShareIdentityModal';

describe('share card', () => {
  it('keeps the existing export sizes', () => {
    expect(SHARE_FORMATS.story).toMatchObject({ width: 1080, height: 1920 });
    expect(SHARE_FORMATS.square).toMatchObject({ width: 1080, height: 1080 });
    expect(SHARE_FORMATS.wide).toMatchObject({ width: 1200, height: 675 });
  });

  it('falls back to "My Music DNA" without an identity title', () => {
    expect(buildCaption(null, []).startsWith('My Music DNA\n')).toBe(true);
  });

  it('leaves Underground Index, BPM and energy out of the caption', () => {
    const c = buildCaption('UNDERGROUND EXPLORER', [{ name: 'Tonight', artist: 'Magixx' }]);
    expect(c).toContain('Underground Explorer');
    expect(c).not.toMatch(/BPM|Energy|Underground Index/i);
  });

  it('caps the caption at three tracks', () => {
    const t = Array.from({ length: 5 }, (_, i) => ({ name: `S${i}`, artist: 'A' }));
    expect(buildCaption('X', t)).not.toContain('4.');
  });

  it('truncates long titles with an ellipsis', () => {
    expect(truncate('a'.repeat(50), 10)).toHaveLength(10);
  });
});
