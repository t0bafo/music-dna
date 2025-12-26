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

// Emoji picker options
export const CRATE_EMOJIS = [
  '📦', '🎵', '🎧', '🎸', '🎹', '🎺', '🎷', '🥁',
  '🎤', '💿', '📻', '🔊', '🎶', '💫', '✨', '🌙',
  '🌅', '🌊', '🔥', '❄️', '🌈', '💜', '💚', '🖤',
  '🍀', '🌸', '🎭', '🎪', '🏝️', '🌃', '🚀', '⚡'
];

// Color picker options
export const CRATE_COLORS = [
  '#1DB954', // Spotify green
  '#FF6B6B', // Coral red
  '#4ECDC4', // Teal
  '#A855F7', // Purple
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EF4444', // Red
  '#14B8A6', // Cyan
];
