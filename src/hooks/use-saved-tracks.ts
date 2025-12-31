import { useQuery } from '@tanstack/react-query';
import { getSavedTracks, SpotifyTrack } from '@/lib/spotify-api';

export interface SavedTrackItem {
  added_at: string;
  track: SpotifyTrack;
}

const STALE_TIME = 10 * 60 * 1000; // 10 minutes
const GC_TIME = 30 * 60 * 1000; // 30 minutes

export const useSavedTracks = (
  accessToken: string | null,
  limit: number = 50
) => {
  return useQuery<SavedTrackItem[]>({
    queryKey: ['saved-tracks', limit],
    queryFn: async () => {
      const data = await getSavedTracks(accessToken!, limit, 0);
      return data.items;
    },
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

// Get tracks saved in the last 30 days
export const useRecentDiscoveries = (
  accessToken: string | null,
  limit: number = 50
) => {
  return useQuery<SavedTrackItem[]>({
    queryKey: ['recent-discoveries', limit],
    queryFn: async () => {
      const data = await getSavedTracks(accessToken!, limit, 0);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return data.items.filter(item => {
        const addedDate = new Date(item.added_at);
        return addedDate >= thirtyDaysAgo;
      });
    },
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};

// Get underground gems (popularity < 50)
export const useUndergroundGems = (
  accessToken: string | null,
  limit: number = 50
) => {
  return useQuery<SavedTrackItem[]>({
    queryKey: ['underground-gems', limit],
    queryFn: async () => {
      const data = await getSavedTracks(accessToken!, limit, 0);
      return data.items.filter(item => item.track.popularity < 50);
    },
    enabled: !!accessToken,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });
};
