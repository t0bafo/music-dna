/**
 * Static demo crate for signed-out visitors. Never stored, never mixed with real crates.
 */
export interface SampleTrack { id: string; title: string; artist: string }

export const SAMPLE_CRATE = {
  slug: 'lagos-night-drive',
  emoji: '🌙',
  name: 'Lagos Night Drive',
  note: 'Windows down on Third Mainland Bridge after midnight. Warm, unhurried grooves that hold the mood without rushing it.',
  tracks: [
    { id: 's1', title: 'Essence', artist: 'Wizkid feat. Tems' },
    { id: 's2', title: 'Ojuelegba', artist: 'Wizkid' },
    { id: 's3', title: 'Ye', artist: 'Burna Boy' },
    { id: 's4', title: 'Free Mind', artist: 'Tems' },
    { id: 's5', title: 'Monalisa', artist: 'Lojay & Sarz' },
    { id: 's6', title: 'Godly', artist: 'Omah Lay' },
    { id: 's7', title: 'Joha', artist: 'Asake' },
  ] as SampleTrack[],
};

export function searchSampleTracks(tracks: SampleTrack[], query: string): SampleTrack[] {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;
  return tracks.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
}
