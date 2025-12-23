/**
 * Secure database access layer
 * All operations go through Edge Function with Spotify token validation
 */

import { TasteProfile, LibraryStats, TasteSnapshot } from './music-intelligence';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-intelligence`;

interface SecureDbRequest {
  action: string;
  data?: any;
}

/**
 * Make authenticated request to Edge Function
 */
async function callSecureEndpoint<T>(
  request: SecureDbRequest,
  spotifyToken: string
): Promise<T> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Database operation failed');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Store tracks in user's music library
 */
export async function storeTracksSecure(
  tracks: any[],
  spotifyToken: string
): Promise<void> {
  await callSecureEndpoint(
    {
      action: 'store_tracks',
      data: { tracks },
    },
    spotifyToken
  );
}

/**
 * Get user's music library
 */
export async function getLibrarySecure(spotifyToken: string): Promise<any[]> {
  return await callSecureEndpoint<any[]>(
    {
      action: 'get_library',
    },
    spotifyToken
  );
}

/**
 * Get library statistics
 */
export async function getLibraryStatsSecure(spotifyToken: string): Promise<LibraryStats | null> {
  const data = await callSecureEndpoint<any>(
    {
      action: 'get_library_stats',
    },
    spotifyToken
  );
  
  if (!data) return null;
  
  return {
    totalTracks: data.totalTracks,
    totalPlaylists: data.totalPlaylists,
    likedSongs: data.likedSongs,
    tracksWithFeatures: data.tracksWithFeatures,
    lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : null,
  };
}

/**
 * Get taste profile
 */
export async function getTasteProfileSecure(spotifyToken: string): Promise<TasteProfile | null> {
  return await callSecureEndpoint<TasteProfile | null>(
    {
      action: 'get_taste_profile',
    },
    spotifyToken
  );
}

/**
 * Store listening events
 */
export async function storeEventsSecure(
  events: any[],
  spotifyToken: string
): Promise<void> {
  await callSecureEndpoint(
    {
      action: 'store_events',
      data: { events },
    },
    spotifyToken
  );
}

/**
 * Get user's listening events
 */
export async function getEventsSecure(spotifyToken: string): Promise<any[]> {
  return await callSecureEndpoint<any[]>(
    {
      action: 'get_events',
    },
    spotifyToken
  );
}

/**
 * Create taste snapshot
 */
export async function createSnapshotSecure(spotifyToken: string): Promise<void> {
  await callSecureEndpoint(
    {
      action: 'create_snapshot',
      data: {},
    },
    spotifyToken
  );
}

/**
 * Get user's taste snapshots
 */
export async function getSnapshotsSecure(spotifyToken: string, limit = 12): Promise<TasteSnapshot[]> {
  const data = await callSecureEndpoint<any[]>(
    {
      action: 'get_snapshots',
      data: { limit },
    },
    spotifyToken
  );
  
  if (!data) return [];
  
  return data.map(s => ({
    id: s.id,
    snapshotDate: new Date(s.snapshot_date),
    avgBpm: s.avg_bpm || 0,
    avgEnergy: s.avg_energy || 0,
    avgDanceability: s.avg_danceability || 0,
    avgValence: s.avg_valence || 0,
    undergroundRatio: s.underground_ratio || 0,
    totalTracks: s.total_tracks || 0,
  }));
}

/**
 * Delete user's library (for re-extraction)
 */
export async function deleteLibrarySecure(spotifyToken: string): Promise<void> {
  await callSecureEndpoint(
    {
      action: 'delete_library',
    },
    spotifyToken
  );
}
