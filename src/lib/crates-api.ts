/**
 * Crates API - Secure database access for crates feature
 * All operations go through Edge Function with Spotify token validation
 */

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-intelligence`;

// Types
export interface Crate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  created_at: string;
  updated_at: string;
  track_count: number;
}

export interface CrateTrack {
  id: string;
  crate_id: string;
  track_id: string;
  position: number;
  added_at: string;
  // From track_cache
  name?: string;
  artist_name?: string;
  album_name?: string;
  album_art_url?: string;
  duration_ms?: number;
  popularity?: number;
  bpm?: number;
  energy?: number;
  danceability?: number;
  valence?: number;
  preview_url?: string | null;
}

export interface CrateWithTracks extends Crate {
  tracks: CrateTrack[];
}

export interface TrackToAdd {
  track_id: string;
  name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  duration_ms?: number;
  popularity?: number;
  bpm?: number;
  energy?: number;
  danceability?: number;
  valence?: number;
  preview_url?: string | null;
}

/**
 * Make authenticated request to Edge Function
 */
async function callSecureEndpoint<T>(
  action: string,
  data: any,
  spotifyToken: string
): Promise<T> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Crate operation failed');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get all crates for current user
 */
export async function getCrates(spotifyToken: string): Promise<Crate[]> {
  return await callSecureEndpoint<Crate[]>('get_crates', {}, spotifyToken);
}

/**
 * Get single crate with tracks
 */
export async function getCrate(crateId: string, spotifyToken: string): Promise<CrateWithTracks> {
  return await callSecureEndpoint<CrateWithTracks>('get_crate', { crate_id: crateId }, spotifyToken);
}

/**
 * Create new crate
 */
export async function createCrate(
  name: string,
  description: string | null,
  emoji: string,
  color: string,
  spotifyToken: string
): Promise<Crate> {
  return await callSecureEndpoint<Crate>('create_crate', { name, description, emoji, color }, spotifyToken);
}

/**
 * Update crate details
 */
export async function updateCrate(
  crateId: string,
  name: string,
  description: string | null,
  emoji: string,
  color: string,
  spotifyToken: string
): Promise<Crate> {
  return await callSecureEndpoint<Crate>('update_crate', { 
    crate_id: crateId, 
    name, 
    description, 
    emoji, 
    color 
  }, spotifyToken);
}

/**
 * Delete crate
 */
export async function deleteCrate(crateId: string, spotifyToken: string): Promise<void> {
  await callSecureEndpoint('delete_crate', { crate_id: crateId }, spotifyToken);
}

/**
 * Add tracks to crate
 */
export async function addTracksToCrate(
  crateId: string,
  tracks: TrackToAdd[],
  spotifyToken: string
): Promise<void> {
  await callSecureEndpoint('add_tracks_to_crate', { crate_id: crateId, tracks }, spotifyToken);
}

/**
 * Remove track from crate
 */
export async function removeTrackFromCrate(
  crateId: string,
  trackId: string,
  spotifyToken: string
): Promise<void> {
  await callSecureEndpoint('remove_track_from_crate', { crate_id: crateId, track_id: trackId }, spotifyToken);
}

/**
 * Reorder tracks in crate
 */
export async function reorderCrateTracks(
  crateId: string,
  trackIds: string[],
  spotifyToken: string
): Promise<void> {
  await callSecureEndpoint('reorder_crate_tracks', { crate_id: crateId, track_ids: trackIds }, spotifyToken);
}

/**
 * Get public crate data (no auth required)
 */
export async function getPublicCrate(crateId: string): Promise<CrateWithTracks & { total_duration_ms: number }> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'get_public_crate', data: { crate_id: crateId } }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch crate');
  }

  const result = await response.json();
  return result.data;
}

// Emoji picker options - music-focused quick picks
export const CRATE_EMOJIS = [
  '🎵', '🎧', '🎶', '🌙', '⚡', '💎', '🔥', '✨', '🌊', '☀️', '🌴', '🎤'
];

// Color picker options - 6 preset colors
export const CRATE_COLORS = [
  '#00ff87', // Sonic green (default)
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f97316', // Orange
  '#3b82f6', // Blue
];
