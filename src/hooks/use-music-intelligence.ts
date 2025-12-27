import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getLibraryStats, 
  getTasteProfile, 
  getTasteSnapshots,
  LibraryStats,
  TasteProfile,
  TasteSnapshot,
} from '@/lib/music-intelligence';
import { getLibrarySecure } from '@/lib/secure-database';
import { 
  getTopTracks, 
  getUserPlaylists,
  getAudioFeaturesFromReccoBeats,
  getTopArtists,
  SpotifyTrack, 
  SpotifyPlaylist,
  SpotifyArtist,
  AudioFeatures,
} from '@/lib/spotify-api';
import { TrackData } from '@/lib/music-analytics';

// Cache configuration
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 30 * 60 * 1000; // 30 minutes

// ============= Library Data Hooks =============

export const useLibraryStats = (accessToken: string | null) => {
  return useQuery<LibraryStats | null>({
    queryKey: ['library-stats'],
    queryFn: () => getLibraryStats(accessToken!),
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

export const useTasteProfile = (accessToken: string | null) => {
  return useQuery<TasteProfile | null>({
    queryKey: ['taste-profile'],
    queryFn: () => getTasteProfile(accessToken!),
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

export const useTasteSnapshots = (accessToken: string | null, limit = 12) => {
  return useQuery<TasteSnapshot[]>({
    queryKey: ['taste-snapshots', limit],
    queryFn: () => getTasteSnapshots(accessToken!, limit),
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

export const useLibraryTracks = (accessToken: string | null) => {
  return useQuery<TrackData[]>({
    queryKey: ['library-tracks'],
    queryFn: () => getLibrarySecure(accessToken!),
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

// ============= Spotify API Hooks =============

export interface TrackWithFeatures extends Omit<SpotifyTrack, 'popularity'>, Partial<AudioFeatures> {
  artist: string;
  albumImage?: string;
  popularity: number;
}

export const useTopTracks = (
  accessToken: string | null, 
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 50
) => {
  return useQuery<TrackWithFeatures[]>({
    queryKey: ['top-tracks', timeRange, limit],
    queryFn: async () => {
      const data = await getTopTracks(accessToken!, timeRange, limit);
      const tracks: TrackWithFeatures[] = data.items.map(track => ({
        ...track,
        artist: track.artists[0]?.name || 'Unknown',
        albumImage: track.album.images?.[2]?.url || track.album.images?.[0]?.url,
        popularity: track.popularity,
      }));

      // Fetch audio features
      const trackIds = tracks.map(t => t.id);
      const features = await getAudioFeaturesFromReccoBeats(trackIds);

      // Merge features
      tracks.forEach(track => {
        const f = features.get(track.id);
        if (f) Object.assign(track, f);
      });

      return tracks;
    },
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

export const useTopTracksWithFeatures = (
  accessToken: string | null,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 50
) => {
  return useQuery<(SpotifyTrack & { audioFeatures?: AudioFeatures | null })[]>({
    queryKey: ['top-tracks-with-features', timeRange, limit],
    queryFn: async () => {
      const data = await getTopTracks(accessToken!, timeRange, limit);
      const tracks = data.items || [];

      if (tracks.length === 0) return [];

      // Fetch audio features
      const trackIds = tracks.map(t => t.id);
      const features = await getAudioFeaturesFromReccoBeats(trackIds);

      // Merge features into tracks
      return tracks.map(track => ({
        ...track,
        audioFeatures: features.get(track.id) || null,
      }));
    },
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

export const usePlaylists = (accessToken: string | null, limit: number = 50) => {
  return useQuery<SpotifyPlaylist[]>({
    queryKey: ['playlists', limit],
    queryFn: async () => {
      const data = await getUserPlaylists(accessToken!, limit);
      return data.items;
    },
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

// ============= Top Artists Hook =============

export const useTopArtists = (
  accessToken: string | null,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 10
) => {
  return useQuery<SpotifyArtist[]>({
    queryKey: ['top-artists', timeRange, limit],
    queryFn: async () => {
      const data = await getTopArtists(accessToken!, timeRange, limit);
      return data.items;
    },
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

// ============= Cache Invalidation Hook =============

export const useInvalidateMusicCache = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['library-stats'] });
    queryClient.invalidateQueries({ queryKey: ['taste-profile'] });
    queryClient.invalidateQueries({ queryKey: ['taste-snapshots'] });
    queryClient.invalidateQueries({ queryKey: ['library-tracks'] });
    queryClient.invalidateQueries({ queryKey: ['top-tracks'] });
    queryClient.invalidateQueries({ queryKey: ['top-tracks-with-features'] });
    queryClient.invalidateQueries({ queryKey: ['playlists'] });
  };
};
