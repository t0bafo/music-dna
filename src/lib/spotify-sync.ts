/**
 * Spotify Sync Service - Bidirectional sync between crates and Spotify playlists
 */

import { getStoredTokens } from '@/lib/spotify-auth';
import { getCurrentUser } from '@/lib/spotify-api';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-intelligence`;

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  external_urls: { spotify: string };
  owner: { id: string };
}

/**
 * Get user's Spotify playlists that they own
 */
export async function getUserPlaylists(): Promise<SpotifyPlaylist[]> {
  const { accessToken } = getStoredTokens();
  
  if (!accessToken) {
    throw new Error('Spotify connection required');
  }

  const user = await getCurrentUser(accessToken);
  const allPlaylists: SpotifyPlaylist[] = [];
  let offset = 0;
  const limit = 50;

  // Fetch all playlists with pagination
  while (true) {
    const response = await fetch(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch playlists');
    }

    const data = await response.json();
    
    // Only include playlists owned by the user
    const ownedPlaylists = data.items.filter(
      (p: SpotifyPlaylist) => p.owner.id === user.id
    );
    allPlaylists.push(...ownedPlaylists);

    if (data.items.length < limit) break;
    offset += limit;
  }

  return allPlaylists;
}

/**
 * Link an existing Spotify playlist to a crate
 */
export async function linkPlaylist(
  crateId: string,
  playlistId: string,
  enableSync: boolean = true,
  spotifyToken: string
): Promise<void> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'link_spotify_playlist',
      data: { crate_id: crateId, playlist_id: playlistId, sync_enabled: enableSync },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to link playlist');
  }
}

/**
 * Enable auto-sync for a crate
 */
export async function enableSync(crateId: string, spotifyToken: string): Promise<void> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'update_sync_settings',
      data: { crate_id: crateId, sync_enabled: true },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to enable sync');
  }
}

/**
 * Disable auto-sync for a crate
 */
export async function disableSync(crateId: string, spotifyToken: string): Promise<void> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'update_sync_settings',
      data: { crate_id: crateId, sync_enabled: false },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to disable sync');
  }
}

/**
 * Unlink a Spotify playlist from a crate
 */
export async function unlinkPlaylist(crateId: string, spotifyToken: string): Promise<void> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'unlink_spotify_playlist',
      data: { crate_id: crateId },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unlink playlist');
  }
}

/**
 * Sync a crate to its linked Spotify playlist
 */
export async function syncCrateToSpotify(crateId: string, spotifyToken: string): Promise<void> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'sync_to_spotify',
      data: { crate_id: crateId },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Sync failed');
  }
}

/**
 * Create a new Spotify playlist and link it to the crate
 */
export async function createAndLinkPlaylist(
  crateId: string,
  playlistName: string,
  description: string,
  isPublic: boolean,
  enableSync: boolean,
  spotifyToken: string
): Promise<{ playlistId: string; playlistUrl: string }> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({
      action: 'create_spotify_playlist',
      data: {
        crate_id: crateId,
        name: playlistName,
        description,
        is_public: isPublic,
        sync_enabled: enableSync,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create playlist');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Format time ago string
 */
export function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return '';
  
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
