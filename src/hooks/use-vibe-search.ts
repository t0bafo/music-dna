/**
 * Hook for AI-powered vibe search across all crates
 * Uses hybrid search logic: text matching OR audio features
 */
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAllCratesWithTracks, GroupedSearchResult, SearchableTrack } from './use-crates-search';
import { SearchFilters, getBpmRange, getEnergyRange } from '@/lib/vibe-search-types';
import { CrateWithTracks } from '@/lib/crates-api';

const VIBE_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibe-search-expand`;

// Cache for LLM expansions
const expansionCache = new Map<string, SearchFilters | null>();

/**
 * Call the vibe-search-expand edge function
 */
async function expandQueryWithAI(query: string): Promise<SearchFilters | null> {
  const cacheKey = query.toLowerCase().trim();
  
  if (expansionCache.has(cacheKey)) {
    return expansionCache.get(cacheKey) ?? null;
  }

  try {
    const response = await fetch(VIBE_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.warn('[vibe-search] Expansion failed:', response.status);
      return null;
    }

    const data = await response.json();
    const filters = data.filters ?? null;
    
    // Cache result
    expansionCache.set(cacheKey, filters);
    
    // Limit cache size
    if (expansionCache.size > 100) {
      const firstKey = expansionCache.keys().next().value;
      if (firstKey) expansionCache.delete(firstKey);
    }

    return filters;
  } catch (error) {
    console.error('[vibe-search] Expansion error:', error);
    return null;
  }
}

/**
 * Hybrid search algorithm: matches tracks by EITHER text OR audio features
 */
function hybridSearch(
  query: string,
  filters: SearchFilters | null,
  cratesWithTracks: CrateWithTracks[]
): { results: GroupedSearchResult[]; totalCount: number } {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return { results: [], totalCount: 0 };
  }

  // Get audio filter ranges
  const bpmRange = filters ? getBpmRange(filters) : undefined;
  const energyRange = filters ? getEnergyRange(filters) : undefined;
  const hasAudioFilters = !!bpmRange || !!energyRange;

  console.log('[vibe-search] Filtering with:', { 
    query: normalizedQuery, 
    hasAudioFilters, 
    bpmRange, 
    energyRange,
    vibes: filters?.vibes,
    scenes: filters?.scenes
  });

  // Score and filter all tracks
  const scoredTracks: Array<{ track: SearchableTrack; score: number }> = [];

  for (const crate of cratesWithTracks) {
    for (const track of crate.tracks || []) {
      let textScore = 0;
      let audioScore = 0;

      // === TEXT MATCHING ===
      const trackName = (track.name || '').toLowerCase();
      const artistName = (track.artist_name || '').toLowerCase();
      const albumName = (track.album_name || '').toLowerCase();
      const crateName = (crate.name || '').toLowerCase();

      // Original query text match
      if (trackName.includes(normalizedQuery)) {
        textScore += 100;
        if (trackName === normalizedQuery) textScore += 50;
        if (trackName.startsWith(normalizedQuery)) textScore += 25;
      }
      if (artistName.includes(normalizedQuery)) textScore += 80;
      if (crateName.includes(normalizedQuery)) textScore += 40;
      if (albumName.includes(normalizedQuery)) textScore += 20;

      // Vibe keywords match
      if (filters?.vibes) {
        for (const vibe of filters.vibes) {
          const vibeLower = vibe.toLowerCase();
          if (trackName.includes(vibeLower)) textScore += 30;
          if (artistName.includes(vibeLower)) textScore += 20;
          if (crateName.includes(vibeLower)) textScore += 40;
        }
      }

      // Scene keywords match
      if (filters?.scenes) {
        for (const scene of filters.scenes) {
          const sceneLower = scene.toLowerCase();
          if (crateName.includes(sceneLower)) textScore += 35;
          if (trackName.includes(sceneLower)) textScore += 15;
        }
      }

      // Artist hint match
      if (filters?.artistHint) {
        const artistHintLower = filters.artistHint.toLowerCase();
        if (artistName.includes(artistHintLower)) {
          textScore += 100; // High priority for explicit artist search
        }
      }

      // === AUDIO FEATURE MATCHING ===
      if (hasAudioFilters) {
        let matchesBpm = true;
        let matchesEnergy = true;

        if (bpmRange && track.bpm != null) {
          const [minBpm, maxBpm] = bpmRange;
          matchesBpm = track.bpm >= minBpm && track.bpm <= maxBpm;
          
          // Score based on how well it matches the ideal BPM
          if (matchesBpm) {
            const idealBpm = (minBpm + maxBpm) / 2;
            const bpmDiff = Math.abs(track.bpm - idealBpm);
            audioScore += Math.max(0, 50 - bpmDiff / 2);
          }
        }

        if (energyRange && track.energy != null) {
          const [minEnergy, maxEnergy] = energyRange;
          matchesEnergy = track.energy >= minEnergy && track.energy <= maxEnergy;
          
          // Score based on how well it matches the ideal energy
          if (matchesEnergy) {
            const idealEnergy = (minEnergy + maxEnergy) / 2;
            const energyDiff = Math.abs(track.energy - idealEnergy);
            audioScore += Math.max(0, 50 - energyDiff * 100);
          }
        }

        // Track matches if BPM AND energy both match (when both are specified)
        if (bpmRange && energyRange) {
          if (matchesBpm && matchesEnergy) {
            audioScore += 30; // Bonus for matching both
          } else if (!matchesBpm && !matchesEnergy) {
            audioScore = 0; // Reset if neither matches
          }
        }
      }

      // === HYBRID LOGIC: Text OR Audio ===
      const hasTextMatch = textScore > 0;
      const hasAudioMatch = audioScore > 0;

      // Include track if it matches EITHER text OR audio criteria
      if (hasAudioFilters) {
        if (hasTextMatch || hasAudioMatch) {
          const totalScore = textScore + audioScore;
          scoredTracks.push({
            track: {
              ...track,
              crate_id: crate.id,
              crate_name: crate.name,
              crate_emoji: crate.emoji || '📦',
            },
            score: totalScore,
          });
        }
      } else {
        // No audio filters - pure text search
        if (hasTextMatch) {
          scoredTracks.push({
            track: {
              ...track,
              crate_id: crate.id,
              crate_name: crate.name,
              crate_emoji: crate.emoji || '📦',
            },
            score: textScore,
          });
        }
      }
    }
  }

  // Sort by score descending
  scoredTracks.sort((a, b) => b.score - a.score);

  // Limit to 50 results
  const limitedTracks = scoredTracks.slice(0, 50);

  console.log('[vibe-search] Top results:', limitedTracks.slice(0, 5).map(t => ({
    name: t.track.name,
    artist: t.track.artist_name,
    bpm: t.track.bpm,
    energy: t.track.energy,
    score: t.score,
  })));

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

  return {
    results: Array.from(groupedMap.values()),
    totalCount: limitedTracks.length,
  };
}

/**
 * Main hook for vibe search with AI expansion
 */
export function useVibeSearch(query: string, debounceMs: number = 400) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [expandedFilters, setExpandedFilters] = useState<SearchFilters | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expansionError, setExpansionError] = useState<string | null>(null);
  
  const { data: cratesWithTracks = [], isLoading: isLoadingCrates } = useAllCratesWithTracks();

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Expand query with AI when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setExpandedFilters(null);
      setExpansionError(null);
      return;
    }

    // Only expand multi-word queries
    const words = debouncedQuery.trim().split(/\s+/);
    if (words.length <= 1) {
      setExpandedFilters(null);
      return;
    }

    setIsExpanding(true);
    setExpansionError(null);

    expandQueryWithAI(debouncedQuery)
      .then(filters => {
        setExpandedFilters(filters);
      })
      .catch(error => {
        console.error('[vibe-search] Expansion failed:', error);
        setExpansionError('Search expansion unavailable');
        setExpandedFilters(null);
      })
      .finally(() => {
        setIsExpanding(false);
      });
  }, [debouncedQuery]);

  // Perform hybrid search
  const { results, totalCount } = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return { results: [], totalCount: 0 };
    }
    return hybridSearch(debouncedQuery, expandedFilters, cratesWithTracks);
  }, [debouncedQuery, expandedFilters, cratesWithTracks]);

  // Filter modification handlers
  const removeVibe = useCallback((vibe: string) => {
    setExpandedFilters(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        vibes: prev.vibes?.filter(v => v !== vibe),
      };
    });
  }, []);

  const removeScene = useCallback((scene: string) => {
    setExpandedFilters(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        scenes: prev.scenes?.filter(s => s !== scene),
      };
    });
  }, []);

  const removeTempo = useCallback(() => {
    setExpandedFilters(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tempo: undefined,
        bpmRange: undefined,
      };
    });
  }, []);

  const removeEnergy = useCallback(() => {
    setExpandedFilters(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        energy: undefined,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setExpandedFilters(null);
  }, []);

  return {
    results,
    totalTrackCount: totalCount,
    crateCount: results.length,
    isSearching: query !== debouncedQuery || isExpanding,
    isLoadingCrates,
    hasResults: results.length > 0,
    isLimitReached: totalCount >= 50,
    
    // AI expansion state
    expandedFilters,
    isExpanding,
    expansionError,
    
    // Filter handlers
    removeVibe,
    removeScene,
    removeTempo,
    removeEnergy,
    clearFilters,
  };
}
