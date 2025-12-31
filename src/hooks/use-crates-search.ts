/**
 * Hook for searching across all crates and their tracks
 */
import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CrateWithTracks, CrateTrack } from '@/lib/crates-api';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-intelligence`;

export interface SearchableTrack extends CrateTrack {
  crate_id: string;
  crate_name: string;
  crate_emoji: string;
}

export interface GroupedSearchResult {
  crate_id: string;
  crate_name: string;
  crate_emoji: string;
  tracks: SearchableTrack[];
}

/**
 * Fetch all crates with their tracks for search
 */
async function getAllCratesWithTracks(spotifyToken: string): Promise<CrateWithTracks[]> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-spotify-token': spotifyToken,
    },
    body: JSON.stringify({ action: 'get_all_crates_with_tracks', data: {} }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch crates');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Hook to fetch all crates with tracks for search
 */
export function useAllCratesWithTracks() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ['crates-with-tracks', accessToken],
    queryFn: () => getAllCratesWithTracks(accessToken!),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Search algorithm that scores and ranks tracks
 */
function searchTracks(
  query: string,
  cratesWithTracks: CrateWithTracks[]
): GroupedSearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  // Flatten all tracks with crate info
  const allTracks: Array<{ track: SearchableTrack; score: number }> = [];

  for (const crate of cratesWithTracks) {
    for (const track of crate.tracks || []) {
      let score = 0;

      // Track name match (highest priority)
      const trackName = (track.name || '').toLowerCase();
      if (trackName.includes(normalizedQuery)) {
        score += 100;
        if (trackName === normalizedQuery) {
          score += 50; // Exact match bonus
        }
        if (trackName.startsWith(normalizedQuery)) {
          score += 25; // Starts with bonus
        }
      }

      // Artist name match
      const artistName = (track.artist_name || '').toLowerCase();
      if (artistName.includes(normalizedQuery)) {
        score += 75;
      }

      // Crate name match
      const crateName = (crate.name || '').toLowerCase();
      if (crateName.includes(normalizedQuery)) {
        score += 50;
      }

      // Album name match (lower priority)
      const albumName = (track.album_name || '').toLowerCase();
      if (albumName.includes(normalizedQuery)) {
        score += 25;
      }

      if (score > 0) {
        allTracks.push({
          track: {
            ...track,
            crate_id: crate.id,
            crate_name: crate.name,
            crate_emoji: crate.emoji || '📦',
          },
          score,
        });
      }
    }
  }

  // Sort by score descending
  allTracks.sort((a, b) => b.score - a.score);

  // Limit to 50 results
  const limitedTracks = allTracks.slice(0, 50);

  // Group by crate
  const groupedMap = new Map<string, GroupedSearchResult>();

  for (const { track } of limitedTracks) {
    if (!groupedMap.has(track.crate_id)) {
      groupedMap.set(track.crate_id, {
        crate_id: track.crate_id,
        crate_name: track.crate_name,
        crate_emoji: track.crate_emoji,
        tracks: [],
      });
    }
    groupedMap.get(track.crate_id)!.tracks.push(track);
  }

  return Array.from(groupedMap.values());
}

/**
 * Hook for crate search with debouncing
 */
export function useCratesSearch(query: string, debounceMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const { data: cratesWithTracks = [], isLoading: isLoadingCrates } = useAllCratesWithTracks();

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return [];
    }
    return searchTracks(debouncedQuery, cratesWithTracks);
  }, [debouncedQuery, cratesWithTracks]);

  const totalTrackCount = useMemo(() => {
    return results.reduce((sum, group) => sum + group.tracks.length, 0);
  }, [results]);

  return {
    results,
    totalTrackCount,
    crateCount: results.length,
    isSearching: query !== debouncedQuery,
    isLoadingCrates,
    hasResults: results.length > 0,
    isLimitReached: totalTrackCount >= 50,
  };
}
