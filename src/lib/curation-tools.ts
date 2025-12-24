import { supabase } from '@/integrations/supabase/client';
import type { DiscoveryFilters, TrackResult } from '@/components/SmartDiscoveryEngine';
import type { ContextConfig, GeneratedTrack } from '@/components/ContextPlaylistGenerator';
import type { SuggestedTrack } from '@/components/TrackSuggestions';

// Get user ID from Spotify access token
const getUserIdFromToken = async (accessToken: string): Promise<string> => {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to get user ID');
  const user = await response.json();
  return user.id;
};

/**
 * Search library tracks matching the given filters
 */
export const searchLibraryTracks = async (
  accessToken: string,
  filters: DiscoveryFilters
): Promise<TrackResult[]> => {
  const userId = await getUserIdFromToken(accessToken);

  let query = supabase
    .from('music_library')
    .select('track_id, name, artist, album, tempo, energy, danceability, popularity')
    .eq('user_id', userId);

  // BPM filters
  if (filters.minBpm > 0) {
    query = query.gte('tempo', filters.minBpm);
  }
  if (filters.maxBpm < 300) {
    query = query.lte('tempo', filters.maxBpm);
  }

  // Energy filters (stored as 0-1 in DB)
  if (filters.minEnergy > 0) {
    query = query.gte('energy', filters.minEnergy / 100);
  }
  if (filters.maxEnergy < 100) {
    query = query.lte('energy', filters.maxEnergy / 100);
  }

  // Danceability filters (stored as 0-1 in DB)
  if (filters.minDance > 0) {
    query = query.gte('danceability', filters.minDance / 100);
  }
  if (filters.maxDance < 100) {
    query = query.lte('danceability', filters.maxDance / 100);
  }

  // Underground filter
  if (filters.undergroundOnly) {
    query = query.lt('popularity', 50);
  }

  const { data, error } = await query
    .order('popularity', { ascending: true })
    .limit(filters.limit);

  if (error) {
    console.error('Search error:', error);
    throw error;
  }

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
  const userId = await getUserIdFromToken(accessToken);
  const tracksNeeded = Math.ceil(durationMinutes / 3.5); // ~3.5 min average per track

  // Calculate energy and BPM ranges for each "segment" of the playlist
  const segments = context.progression === 'plateau' || context.progression === 'steady' 
    ? 1 
    : 3; // build/descend have 3 segments

  const allTracks: GeneratedTrack[] = [];
  const usedTrackIds = new Set<string>();
  const tracksPerSegment = Math.ceil(tracksNeeded / segments);

  for (let seg = 0; seg < segments; seg++) {
    // Calculate target BPM and energy for this segment
    let targetBpmMin: number, targetBpmMax: number;
    let targetEnergyMin: number, targetEnergyMax: number;

    if (context.progression === 'build') {
      // Start low, end high
      const progress = seg / (segments - 1 || 1);
      targetBpmMin = context.bpmStart + (context.bpmEnd - context.bpmStart) * progress - 5;
      targetBpmMax = context.bpmStart + (context.bpmEnd - context.bpmStart) * progress + 5;
      targetEnergyMin = (context.energyStart + (context.energyEnd - context.energyStart) * progress - 5) / 100;
      targetEnergyMax = (context.energyStart + (context.energyEnd - context.energyStart) * progress + 5) / 100;
    } else if (context.progression === 'descend') {
      // Start high, end low
      const progress = seg / (segments - 1 || 1);
      targetBpmMin = context.bpmStart - (context.bpmStart - context.bpmEnd) * progress - 5;
      targetBpmMax = context.bpmStart - (context.bpmStart - context.bpmEnd) * progress + 5;
      targetEnergyMin = (context.energyStart - (context.energyStart - context.energyEnd) * progress - 5) / 100;
      targetEnergyMax = (context.energyStart - (context.energyStart - context.energyEnd) * progress + 5) / 100;
    } else {
      // Plateau or steady - use full range
      targetBpmMin = Math.min(context.bpmStart, context.bpmEnd);
      targetBpmMax = Math.max(context.bpmStart, context.bpmEnd);
      targetEnergyMin = Math.min(context.energyStart, context.energyEnd) / 100;
      targetEnergyMax = Math.max(context.energyStart, context.energyEnd) / 100;
    }

    // Query tracks for this segment
    let query = supabase
      .from('music_library')
      .select('track_id, name, artist, tempo, energy, popularity')
      .eq('user_id', userId)
      .gte('tempo', Math.max(50, targetBpmMin))
      .lte('tempo', Math.min(200, targetBpmMax))
      .gte('energy', Math.max(0, targetEnergyMin))
      .lte('energy', Math.min(1, targetEnergyMax));

    // Apply underground ratio (roughly)
    if (context.undergroundRatio > 0.5) {
      query = query.lt('popularity', 50);
    }

    const { data, error } = await query
      .order('energy', { ascending: context.progression === 'descend' })
      .limit(tracksPerSegment + 5); // Extra buffer

    if (error) {
      console.error('Segment query error:', error);
      continue;
    }

    // Filter out already used tracks and add to result
    const segmentTracks = (data || [])
      .filter(t => !usedTrackIds.has(t.track_id))
      .slice(0, tracksPerSegment);

    segmentTracks.forEach((track, i) => {
      usedTrackIds.add(track.track_id);
      allTracks.push({
        track_id: track.track_id,
        name: track.name,
        artist: track.artist || 'Unknown',
        tempo: track.tempo,
        energy: track.energy,
        popularity: track.popularity,
        position: allTracks.length + 1,
      });
    });
  }

  // If we need more tracks, get any matching the overall criteria
  if (allTracks.length < tracksNeeded) {
    const remaining = tracksNeeded - allTracks.length;
    
    const { data } = await supabase
      .from('music_library')
      .select('track_id, name, artist, tempo, energy, popularity')
      .eq('user_id', userId)
      .gte('tempo', Math.min(context.bpmStart, context.bpmEnd) - 10)
      .lte('tempo', Math.max(context.bpmStart, context.bpmEnd) + 10)
      .limit(remaining + 10);

    if (data) {
      data
        .filter(t => !usedTrackIds.has(t.track_id))
        .slice(0, remaining)
        .forEach(track => {
          allTracks.push({
            track_id: track.track_id,
            name: track.name,
            artist: track.artist || 'Unknown',
            tempo: track.tempo,
            energy: track.energy,
            popularity: track.popularity,
            position: allTracks.length + 1,
          });
        });
    }
  }

  // Sort by position (which was set based on segment order)
  return allTracks.slice(0, tracksNeeded);
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
  const userId = await getUserIdFromToken(accessToken);

  // Query tracks similar to playlist DNA that are NOT in the playlist
  const { data, error } = await supabase
    .from('music_library')
    .select('track_id, name, artist, tempo, energy, danceability, popularity')
    .eq('user_id', userId)
    .gte('tempo', playlistAverages.avgBpm - 15)
    .lte('tempo', playlistAverages.avgBpm + 15)
    .gte('energy', (playlistAverages.avgEnergy - 15) / 100)
    .lte('energy', (playlistAverages.avgEnergy + 15) / 100)
    .limit(50);

  if (error) {
    console.error('Suggestions query error:', error);
    throw error;
  }

  // Filter out tracks already in playlist and calculate fit scores
  const suggestions: SuggestedTrack[] = (data || [])
    .filter(track => !playlistTrackIds.includes(track.track_id))
    .map(track => {
      // Calculate fit score based on similarity to averages
      const bpmDiff = Math.abs((track.tempo || playlistAverages.avgBpm) - playlistAverages.avgBpm);
      const energyDiff = Math.abs(((track.energy || 0) * 100) - playlistAverages.avgEnergy);
      const danceDiff = Math.abs(((track.danceability || 0) * 100) - playlistAverages.avgDanceability);

      // Lower diff = higher score
      const fitScore = Math.max(0, 1 - (bpmDiff / 50 + energyDiff / 100 + danceDiff / 100) / 3);

      // Generate reason
      let reason = '';
      if (bpmDiff < 5) {
        reason = `Matches your ${Math.round(playlistAverages.avgBpm)} BPM zone perfectly`;
      } else if ((track.popularity || 0) < 40) {
        reason = 'Underground gem that fits your vibe';
      } else if (Math.abs(((track.energy || 0) * 100) - playlistAverages.avgEnergy) < 10) {
        reason = 'Energy level aligns with your playlist';
      } else {
        reason = 'Similar audio profile to your playlist';
      }

      return {
        track_id: track.track_id,
        name: track.name,
        artist: track.artist || 'Unknown',
        tempo: track.tempo,
        energy: track.energy,
        popularity: track.popularity,
        fitScore,
        reason,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 10);

  return suggestions;
};
