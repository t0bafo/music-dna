/**
 * Curation tools using secure database access
 * All queries go through Edge Function with Spotify token validation
 */

import { searchTracksSecure, generatePlaylistSecure, getSuggestionsSecure } from '@/lib/secure-database';
import type { DiscoveryFilters, TrackResult } from '@/components/SmartDiscoveryEngine';
import type { ContextConfig, GeneratedTrack } from '@/components/ContextPlaylistGenerator';
import type { SuggestedTrack } from '@/components/TrackSuggestions';

/**
 * Search library tracks matching the given filters
 */
export const searchLibraryTracks = async (
  accessToken: string,
  filters: DiscoveryFilters
): Promise<TrackResult[]> => {
  const data = await searchTracksSecure(filters, accessToken);
  return (data || []) as TrackResult[];
};

/**
 * Generate a context-based playlist from library tracks
 */
export const generateContextPlaylist = async (
  accessToken: string,
  context: ContextConfig,
  durationMinutes: number
): Promise<GeneratedTrack[]> => {
  const data = await generatePlaylistSecure(context.key, durationMinutes, accessToken);
  return (data || []).map((track: any, index: number) => ({
    track_id: track.track_id,
    name: track.name,
    artist: track.artist || 'Unknown',
    tempo: track.tempo,
    energy: track.energy,
    popularity: track.popularity,
    position: track.position || index + 1,
  }));
};

/**
 * Get track suggestions for an existing playlist
 */
export const getPlaylistSuggestions = async (
  accessToken: string,
  playlistTrackIds: string[],
  playlistAverages: {
    avgBpm: number;
    avgEnergy: number;
    avgDanceability: number;
  }
): Promise<SuggestedTrack[]> => {
  const data = await getSuggestionsSecure(playlistTrackIds, playlistAverages, accessToken);
  return (data || []) as SuggestedTrack[];
};
