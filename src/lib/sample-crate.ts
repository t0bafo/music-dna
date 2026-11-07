/**
 * Static demo crate for signed-out visitors. Never stored, never mixed with real crates.
 */
export interface SampleTrack { id: string; title: string; artist: string; /** Example liner note (demo only) */ note?: string }

export const SAMPLE_CRATE = {
  slug: 'lagos-night-drive',
  emoji: '🌙',
  name: 'Lagos Night Drive',
  note: 'Windows down on Third Mainland Bridge after midnight. Warm, unhurried grooves that hold the mood without rushing it.',
  tracks: [
    { id: 's1', note: 'First song we played crossing the bridge, city lights on the lagoon.', title: 'Essence', artist: 'Wizkid feat. Tems' },
    { id: 's2', note: 'Late night, windows down — everyone sang the hook.', title: 'Ojuelegba', artist: 'Wizkid' },
    { id: 's3', note: 'Traffic finally cleared after midnight.', title: 'Ye', artist: 'Burna Boy' },
    { id: 's4', note: 'Slow, calm comedown on the drive home.', title: 'Free Mind', artist: 'Tems' },
    { id: 's5', note: 'Put this on when the road opened up.', title: 'Monalisa', artist: 'Lojay & Sarz' },
    { id: 's6', note: 'Unhurried and warm, almost sunrise.', title: 'Godly', artist: 'Omah Lay' },
    { id: 's7', note: 'Turned it up for the last stretch home.', title: 'Joha', artist: 'Asake' },
  ] as SampleTrack[],
};

export function searchSampleTracks(tracks: SampleTrack[], query: string): SampleTrack[] {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;
  return tracks.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
}
