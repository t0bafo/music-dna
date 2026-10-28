export type MixtapeOrdering = 'journey' | 'interleave' | 'bpm_flow' | 'energy_arc';

export interface MixtapeTrack {
  trackId: string;
  albumId: string;
  albumName: string;
  name: string;
  artists: string[];
  durationMs: number;
  discNumber: number;
  trackNumber: number;
  /** 0..1 — (index within album) / (album track count - 1) */
  albumPosition: number;
  bpm?: number;
  energy?: number;
  valence?: number;
  danceability?: number;
}

export interface MixtapeAlbum {
  albumId: string;
  albumName: string;
  tracks: MixtapeTrack[];
}

export interface MixtapeSettings {
  ordering: MixtapeOrdering;
  targetTracks?: number;
  targetMinutes?: number;
  sides?: boolean;
  /** slot index → trackId */
  pinned?: Record<number, string>;
  seed?: number;
}

export interface MixtapeDiagnostics {
  disabledOrderings: { ordering: MixtapeOrdering; reason: string }[];
  missingFeatureCount: number;
  notes: string[];
}

export interface MixtapeResult {
  tracks: MixtapeTrack[];
  sides?: { a: number; b: number };
  diagnostics: MixtapeDiagnostics;
}
