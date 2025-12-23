// Music Intelligence - Data extraction and analytics

import { supabase } from '@/integrations/supabase/client';
import { getAudioFeaturesFromReccoBeats, SpotifyTrack, AudioFeatures } from './spotify-api';

export interface ExtractionProgress {
  phase: 'idle' | 'liked' | 'playlists' | 'tracks' | 'features' | 'storing' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}

export interface ExtractionResult {
  totalTracks: number;
  withFeatures: number;
  playlists: number;
  likedSongs: number;
}

export interface TasteProfile {
  avgBpm: number;
  avgEnergy: number;
  avgDanceability: number;
  avgValence: number;
  avgAcousticness: number;
  avgSpeechiness: number;
  avgInstrumentalness: number;
  avgLiveness: number;
  undergroundRatio: number;
  totalTracks: number;
  bpmRange: { min: number; max: number };
  energyDistribution: { low: number; medium: number; high: number };
}

export interface LibraryStats {
  totalTracks: number;
  totalPlaylists: number;
  likedSongs: number;
  tracksWithFeatures: number;
  lastUpdated: Date | null;
}

export interface TasteSnapshot {
  id: string;
  snapshotDate: Date;
  avgBpm: number;
  avgEnergy: number;
  avgDanceability: number;
  avgValence: number;
  undergroundRatio: number;
  totalTracks: number;
}

// Helper: Paginated fetch for liked songs
export const getAllLikedSongs = async (
  token: string,
  onProgress?: (count: number) => void
): Promise<SpotifyTrack[]> => {
  const allTracks: SpotifyTrack[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await fetch(
      `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch liked songs:', response.status);
      break;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) break;

    allTracks.push(...data.items.map((item: { track: SpotifyTrack }) => item.track));
    onProgress?.(allTracks.length);
    
    offset += limit;
    if (!data.next) break;

    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  return allTracks;
};

// Helper: Get all user playlists
export const getAllUserPlaylists = async (
  token: string
): Promise<{ id: string; name: string; tracks: { total: number } }[]> => {
  const allPlaylists: { id: string; name: string; tracks: { total: number } }[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await fetch(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!response.ok) break;

    const data = await response.json();
    if (!data.items || data.items.length === 0) break;

    allPlaylists.push(...data.items.map((p: { id: string; name: string; tracks: { total: number } }) => ({
      id: p.id,
      name: p.name,
      tracks: p.tracks,
    })));
    
    offset += limit;
    if (!data.next) break;

    await new Promise(r => setTimeout(r, 100));
  }

  return allPlaylists;
};

// Helper: Get all tracks from a playlist
const getPlaylistTracksAll = async (
  token: string,
  playlistId: string
): Promise<SpotifyTrack[]> => {
  const allTracks: SpotifyTrack[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(track(id,name,artists,album,popularity,duration_ms)),next`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!response.ok) break;

    const data = await response.json();
    if (!data.items || data.items.length === 0) break;

    const validTracks = data.items
      .filter((item: { track: SpotifyTrack | null }) => item.track && item.track.id)
      .map((item: { track: SpotifyTrack }) => item.track);
    
    allTracks.push(...validTracks);
    
    offset += limit;
    if (!data.next) break;

    await new Promise(r => setTimeout(r, 50));
  }

  return allTracks;
};

// Main extraction function
export const extractMusicLibrary = async (
  accessToken: string,
  userId: string,
  onProgress: (progress: ExtractionProgress) => void
): Promise<ExtractionResult> => {
  console.log('[Intelligence] Starting music library extraction...');

  try {
    // Step 1: Get all liked songs
    onProgress({ phase: 'liked', current: 0, total: 0, message: 'Fetching liked songs...' });
    const likedSongs = await getAllLikedSongs(accessToken, (count) => {
      onProgress({ phase: 'liked', current: count, total: count, message: `Found ${count} liked songs...` });
    });
    console.log(`[Intelligence] Found ${likedSongs.length} liked songs`);

    // Step 2: Get all playlists
    onProgress({ phase: 'playlists', current: 0, total: 0, message: 'Fetching playlists...' });
    const playlists = await getAllUserPlaylists(accessToken);
    console.log(`[Intelligence] Found ${playlists.length} playlists`);

    // Step 3: Get all tracks from playlists
    onProgress({ phase: 'tracks', current: 0, total: playlists.length, message: 'Extracting playlist tracks...' });
    const playlistTracks: SpotifyTrack[] = [];
    
    for (let i = 0; i < playlists.length; i++) {
      const playlist = playlists[i];
      onProgress({ 
        phase: 'tracks', 
        current: i + 1, 
        total: playlists.length, 
        message: `Extracting: ${playlist.name}` 
      });
      
      const tracks = await getPlaylistTracksAll(accessToken, playlist.id);
      playlistTracks.push(...tracks);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`[Intelligence] Found ${playlistTracks.length} playlist tracks`);

    // Step 4: Combine and deduplicate
    const trackMap = new Map<string, SpotifyTrack>();
    
    [...likedSongs, ...playlistTracks].forEach(track => {
      if (track.id && !trackMap.has(track.id)) {
        trackMap.set(track.id, track);
      }
    });
    
    const uniqueTracks = Array.from(trackMap.values());
    console.log(`[Intelligence] Total unique tracks: ${uniqueTracks.length}`);

    // Step 5: Get audio features in batches
    onProgress({ phase: 'features', current: 0, total: uniqueTracks.length, message: 'Fetching audio features...' });
    
    const trackIds = uniqueTracks.map(t => t.id);
    const batchSize = 50;
    const allFeatures = new Map<string, AudioFeatures>();
    
    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize);
      onProgress({ 
        phase: 'features', 
        current: Math.min(i + batchSize, trackIds.length), 
        total: trackIds.length, 
        message: `Analyzing ${Math.min(i + batchSize, trackIds.length)} of ${trackIds.length} tracks...` 
      });
      
      try {
        const features = await getAudioFeaturesFromReccoBeats(batch);
        features.forEach((value, key) => allFeatures.set(key, value));
      } catch (err) {
        console.error('[Intelligence] Error fetching features batch:', err);
      }
      
      await new Promise(r => setTimeout(r, 300));
    }
    
    console.log(`[Intelligence] Got features for ${allFeatures.size} tracks`);

    // Step 6: Prepare data for storage
    onProgress({ phase: 'storing', current: 0, total: uniqueTracks.length, message: 'Storing in database...' });
    
    const libraryData = uniqueTracks.map(track => {
      const features = allFeatures.get(track.id);
      return {
        track_id: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown',
        album: track.album?.name || null,
        tempo: features?.tempo || null,
        energy: features?.energy || null,
        danceability: features?.danceability || null,
        valence: features?.valence || null,
        acousticness: features?.acousticness || null,
        speechiness: features?.speechiness || null,
        instrumentalness: features?.instrumentalness || null,
        liveness: features?.liveness || null,
        popularity: track.popularity || null,
        release_date: null,
        user_id: userId,
      };
    });

    // Store in batches
    const storageBatchSize = 100;
    for (let i = 0; i < libraryData.length; i += storageBatchSize) {
      const batch = libraryData.slice(i, i + storageBatchSize);
      onProgress({ 
        phase: 'storing', 
        current: Math.min(i + storageBatchSize, libraryData.length), 
        total: libraryData.length, 
        message: `Storing ${Math.min(i + storageBatchSize, libraryData.length)} of ${libraryData.length} tracks...` 
      });
      
      const { error } = await supabase
        .from('music_library')
        .upsert(batch, { onConflict: 'track_id,user_id' });
      
      if (error) {
        console.error('[Intelligence] Storage error:', error);
      }
    }

    // Step 7: Create taste snapshot
    await createTasteSnapshot(userId);

    onProgress({ phase: 'complete', current: uniqueTracks.length, total: uniqueTracks.length, message: 'Complete!' });

    return {
      totalTracks: uniqueTracks.length,
      withFeatures: allFeatures.size,
      playlists: playlists.length,
      likedSongs: likedSongs.length,
    };
  } catch (error) {
    console.error('[Intelligence] Extraction error:', error);
    onProgress({ phase: 'error', current: 0, total: 0, message: 'Extraction failed' });
    throw error;
  }
};

// Create a taste snapshot from current library data
export const createTasteSnapshot = async (userId: string): Promise<void> => {
  const { data: tracks, error } = await supabase
    .from('music_library')
    .select('tempo, energy, danceability, valence, popularity')
    .eq('user_id', userId);

  if (error || !tracks || tracks.length === 0) {
    console.error('[Intelligence] Failed to get tracks for snapshot:', error);
    return;
  }

  const validTracks = tracks.filter(t => t.tempo != null);
  
  const avgBpm = validTracks.reduce((sum, t) => sum + (t.tempo || 0), 0) / validTracks.length || 0;
  const avgEnergy = validTracks.reduce((sum, t) => sum + (t.energy || 0), 0) / validTracks.length || 0;
  const avgDanceability = validTracks.reduce((sum, t) => sum + (t.danceability || 0), 0) / validTracks.length || 0;
  const avgValence = validTracks.reduce((sum, t) => sum + (t.valence || 0), 0) / validTracks.length || 0;
  
  const undergroundTracks = tracks.filter(t => (t.popularity || 100) < 40).length;
  const undergroundRatio = tracks.length > 0 ? undergroundTracks / tracks.length : 0;

  const today = new Date().toISOString().split('T')[0];
  
  const { error: snapshotError } = await supabase
    .from('taste_snapshots')
    .upsert({
      user_id: userId,
      snapshot_date: today,
      avg_bpm: avgBpm,
      avg_energy: avgEnergy,
      avg_danceability: avgDanceability,
      avg_valence: avgValence,
      underground_ratio: undergroundRatio,
      total_tracks: tracks.length,
    }, { onConflict: 'user_id,snapshot_date' });

  if (snapshotError) {
    console.error('[Intelligence] Failed to create snapshot:', snapshotError);
  }
};

// Get library stats for a user
export const getLibraryStats = async (userId: string): Promise<LibraryStats | null> => {
  const { data: tracks, error } = await supabase
    .from('music_library')
    .select('id, tempo, added_at')
    .eq('user_id', userId);

  if (error) {
    console.error('[Intelligence] Failed to get library stats:', error);
    return null;
  }

  if (!tracks || tracks.length === 0) {
    return null;
  }

  const tracksWithFeatures = tracks.filter(t => t.tempo != null).length;
  const latestDate = tracks.reduce((latest, t) => {
    const date = new Date(t.added_at);
    return date > latest ? date : latest;
  }, new Date(0));

  return {
    totalTracks: tracks.length,
    totalPlaylists: 0, // We'd need to count from listening_events
    likedSongs: 0,
    tracksWithFeatures,
    lastUpdated: latestDate.getTime() > 0 ? latestDate : null,
  };
};

// Get taste profile from stored library
export const getTasteProfile = async (userId: string): Promise<TasteProfile | null> => {
  const { data: tracks, error } = await supabase
    .from('music_library')
    .select('*')
    .eq('user_id', userId);

  if (error || !tracks || tracks.length === 0) {
    return null;
  }

  const validTracks = tracks.filter(t => t.tempo != null && t.energy != null);
  
  if (validTracks.length === 0) {
    return null;
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const tempos = validTracks.map(t => t.tempo!).filter(Boolean);
  const energies = validTracks.map(t => t.energy!).filter(Boolean);
  
  const lowEnergy = energies.filter(e => e < 0.4).length;
  const medEnergy = energies.filter(e => e >= 0.4 && e < 0.7).length;
  const highEnergy = energies.filter(e => e >= 0.7).length;

  const undergroundTracks = tracks.filter(t => (t.popularity || 100) < 40).length;

  return {
    avgBpm: avg(tempos),
    avgEnergy: avg(energies),
    avgDanceability: avg(validTracks.map(t => t.danceability!).filter(Boolean)),
    avgValence: avg(validTracks.map(t => t.valence!).filter(Boolean)),
    avgAcousticness: avg(validTracks.map(t => t.acousticness!).filter(Boolean)),
    avgSpeechiness: avg(validTracks.map(t => t.speechiness!).filter(Boolean)),
    avgInstrumentalness: avg(validTracks.map(t => t.instrumentalness!).filter(Boolean)),
    avgLiveness: avg(validTracks.map(t => t.liveness!).filter(Boolean)),
    undergroundRatio: tracks.length > 0 ? undergroundTracks / tracks.length : 0,
    totalTracks: tracks.length,
    bpmRange: { min: Math.min(...tempos), max: Math.max(...tempos) },
    energyDistribution: {
      low: lowEnergy / energies.length,
      medium: medEnergy / energies.length,
      high: highEnergy / energies.length,
    },
  };
};

// Get historical snapshots
export const getTasteSnapshots = async (userId: string, limit = 12): Promise<TasteSnapshot[]> => {
  const { data, error } = await supabase
    .from('taste_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

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
};

// Generate insights from taste profile
export const generateInsights = (profile: TasteProfile): string[] => {
  const insights: string[] = [];

  // BPM insight
  const bpmRange = profile.bpmRange.max - profile.bpmRange.min;
  if (bpmRange < 40) {
    insights.push(`Your BPM sweet spot is ${Math.round(profile.avgBpm)} BPM - you have consistent tempo taste`);
  } else {
    insights.push(`Your BPM range spans ${Math.round(profile.bpmRange.min)}-${Math.round(profile.bpmRange.max)} - quite diverse!`);
  }

  // Energy insight
  if (profile.avgEnergy > 0.7) {
    insights.push(`You prefer high-energy music (${Math.round(profile.avgEnergy * 100)}% average)`);
  } else if (profile.avgEnergy < 0.4) {
    insights.push(`You lean towards chill, low-energy tracks (${Math.round(profile.avgEnergy * 100)}% average)`);
  }

  // Danceability insight
  if (profile.avgDanceability > 0.7) {
    insights.push(`${Math.round(profile.avgDanceability * 100)}% of your music is dance-friendly`);
  }

  // Underground insight
  if (profile.undergroundRatio > 0.5) {
    insights.push(`${Math.round(profile.undergroundRatio * 100)}% of your library is underground (popularity < 40) - you're a tastemaker!`);
  } else if (profile.undergroundRatio > 0.3) {
    insights.push(`${Math.round(profile.undergroundRatio * 100)}% underground tracks - nice balance of discovery and hits`);
  } else {
    insights.push(`You mostly listen to popular tracks - mainstream taste!`);
  }

  // Mood insight (valence)
  if (profile.avgValence > 0.6) {
    insights.push(`Your music leans positive and upbeat (${Math.round(profile.avgValence * 100)}% valence)`);
  } else if (profile.avgValence < 0.4) {
    insights.push(`You prefer moody, melancholic tracks (${Math.round(profile.avgValence * 100)}% valence)`);
  }

  // Acoustic insight
  if (profile.avgAcousticness > 0.5) {
    insights.push(`You appreciate acoustic sounds (${Math.round(profile.avgAcousticness * 100)}% acousticness)`);
  }

  return insights.slice(0, 5);
};
