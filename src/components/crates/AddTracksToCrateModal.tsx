import { useState, useMemo, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Plus, Music, Check, Lightbulb, Play, Pause } from 'lucide-react';
import { useAddTracksToCrate } from '@/hooks/use-crates';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudioPreview } from '@/hooks/use-audio-preview';
import { TrackToAdd } from '@/lib/crates-api';
import { SearchResultsListSkeleton } from '@/components/ui/skeletons';
import { cn } from '@/lib/utils';

interface AddTracksToCrateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crateId: string;
  crateName?: string;
  existingTrackIds: string[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
}

// Search ALL of Spotify using the Search API
async function searchSpotifyTracks(query: string, accessToken: string): Promise<SpotifyTrack[]> {
  if (!query || query.trim().length === 0) return [];

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Search failed');
  }

  const data = await response.json();
  return data.tracks?.items || [];
}

// Sort results to prioritize artist name matches
function sortSearchResults(tracks: SpotifyTrack[], searchQuery: string): SpotifyTrack[] {
  const query = searchQuery.toLowerCase().trim();

  return [...tracks].sort((a, b) => {
    const aArtist = a.artists[0]?.name.toLowerCase() || '';
    const bArtist = b.artists[0]?.name.toLowerCase() || '';

    // Exact artist name match gets highest priority
    const aExactMatch = aArtist === query;
    const bExactMatch = bArtist === query;

    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    // Partial artist name match gets second priority
    const aPartialMatch = aArtist.includes(query);
    const bPartialMatch = bArtist.includes(query);

    if (aPartialMatch && !bPartialMatch) return -1;
    if (!aPartialMatch && bPartialMatch) return 1;

    // Keep Spotify's default relevance order for everything else
    return 0;
  });
}

// Filter out results where artist name has no meaningful match to query
function filterByArtistSimilarity(tracks: SpotifyTrack[], searchQuery: string): SpotifyTrack[] {
  const query = searchQuery.toLowerCase().trim();

  // If query is very short (< 3 chars), don't filter (too strict)
  if (query.length < 3) return tracks;

  return tracks.filter(track => {
    const artistName = track.artists[0]?.name.toLowerCase() || '';
    const trackName = track.name.toLowerCase();

    // Keep if exact artist match
    if (artistName === query) return true;

    // Keep if artist name contains query
    if (artistName.includes(query)) return true;

    // Keep if query contains artist name (for longer artist names)
    if (query.includes(artistName) && artistName.length > 2) return true;

    // Keep if track name contains query (user might be searching for song title)
    if (trackName.includes(query)) return true;

    // Keep if first word matches (handles "burna boy" → "burna")
    const queryWords = query.split(/\s+/);
    const artistWords = artistName.split(/\s+/);

    for (const qWord of queryWords) {
      if (qWord.length < 3) continue; // Skip very short words
      for (const aWord of artistWords) {
        if (aWord.length < 2) continue;
        if (aWord.includes(qWord)) return true;
        if (qWord.includes(aWord) && aWord.length > 2) return true;
      }
    }

    // Otherwise, filter out
    return false;
  });
}

const AddTracksToCrateModal = ({ 
  open, 
  onOpenChange, 
  crateId, 
  crateName,
  existingTrackIds 
}: AddTracksToCrateModalProps) => {
  const { accessToken } = useAuth();
  const isMobile = useIsMobile();
  const { currentTrackId, isPlaying, toggle: togglePreview, stop: stopPreview } = useAudioPreview();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Map<string, SpotifyTrack>>(new Map());

  const addTracks = useAddTracksToCrate();

  const existingSet = useMemo(() => new Set(existingTrackIds), [existingTrackIds]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || !accessToken) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await searchSpotifyTracks(debouncedQuery, accessToken);
        const sorted = sortSearchResults(results, debouncedQuery);
        const filtered = filterByArtistSimilarity(sorted, debouncedQuery);
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, accessToken]);

  // Reset state and stop audio when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setDebouncedQuery('');
      setSearchResults([]);
      setSelectedTracks(new Map());
      setSearchError(null);
      stopPreview();
    }
  }, [open, stopPreview]);

  const toggleTrack = useCallback((track: SpotifyTrack) => {
    if (existingSet.has(track.id)) return;

    setSelectedTracks((prev) => {
      const newSelected = new Map(prev);
      
      if (newSelected.has(track.id)) {
        newSelected.delete(track.id);
      } else {
        newSelected.set(track.id, track);
      }
      
      return newSelected;
    });
  }, [existingSet]);

  const handleAdd = async () => {
    if (selectedTracks.size === 0 || !accessToken) return;

    try {
      // Build track data from selected Spotify tracks
      const tracksToAdd: TrackToAdd[] = Array.from(selectedTracks.values()).map((track) => ({
        track_id: track.id,
        name: track.name,
        artist_name: track.artists[0]?.name || 'Unknown Artist',
        album_name: track.album.name,
        album_art_url: track.album.images[1]?.url || track.album.images[0]?.url || '',
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        preview_url: track.preview_url,
        // Audio features can be fetched later if needed
        bpm: undefined,
        energy: undefined,
        danceability: undefined,
        valence: undefined
      }));

      await addTracks.mutateAsync({
        crateId,
        tracks: tracksToAdd
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Failed to add tracks:', err);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const isPending = addTracks.isPending;

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const showEmptyState = !searchQuery.trim() && searchResults.length === 0;

  // Modal content shared between Dialog and Drawer
  const modalContent = (
    <>
      {/* Search */}
      <div className="space-y-2 px-4 sm:px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Search any song on Spotify..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-secondary/30 touch-target"
            autoFocus={!isMobile}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 transition-colors"
            >
              <span className="sr-only">Clear search</span>
              <span className="text-xs font-medium text-muted-foreground">×</span>
            </button>
          )}
          {isSearching && !searchQuery && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {/* Helper text */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Search any track – even if you haven't saved it yet</span>
        </div>
      </div>

      {/* Selection count */}
      {selectedTracks.size > 0 && (
        <div className="flex items-center justify-between text-sm px-4 sm:px-0">
          <span className="text-muted-foreground">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </span>
          <span className="text-primary font-medium">
            {selectedTracks.size} selected
          </span>
        </div>
      )}

      {/* Track list */}
      <ScrollArea className="h-[50vh] sm:h-[400px] -mx-4 sm:-mx-6 px-4 sm:px-6">
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Search for tracks</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Find any song on Spotify to add to your crate
            </p>
          </div>
        ) : isSearching && searchResults.length === 0 ? (
          <div className="py-4">
            <SearchResultsListSkeleton count={5} />
          </div>
        ) : searchError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-destructive">{searchError}</p>
          </div>
        ) : searchResults.length === 0 && debouncedQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No tracks found for "{debouncedQuery}"
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {searchResults.map((track) => {
              const isInCrate = existingSet.has(track.id);
              const isSelected = selectedTracks.has(track.id);
              const albumArt = track.album.images[2]?.url || track.album.images[1]?.url || track.album.images[0]?.url;
              const isCurrentlyPlaying = currentTrackId === track.id && isPlaying;
              const hasPreview = !!track.preview_url;
              
              return (
                <div
                  key={track.id}
                  onClick={() => toggleTrack(track)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer touch-target-lg",
                    isInCrate 
                      ? "opacity-50 cursor-not-allowed bg-secondary/20" 
                      : isSelected 
                        ? "bg-primary/10 border border-primary/30" 
                        : "hover:bg-secondary/50 active:bg-secondary/70"
                  )}
                >
                  {/* Album art */}
                  <div className="w-10 h-10 rounded-md bg-secondary/50 shrink-0 flex items-center justify-center overflow-hidden">
                    {albumArt ? (
                      <img 
                        src={albumArt} 
                        alt={track.album.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-5 h-5 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate",
                      isInCrate ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {track.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate">{track.artists.map(a => a.name).join(', ')}</span>
                      <span className="shrink-0">•</span>
                      <span className="shrink-0">{formatDuration(track.duration_ms)}</span>
                    </div>
                  </div>

                  {/* Preview button */}
                  {hasPreview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreview(track.id, track.preview_url!);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all touch-target",
                        isCurrentlyPlaying
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                      aria-label={isCurrentlyPlaying ? "Pause preview" : "Play preview"}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                  )}

                  {/* Add button or status */}
                  <div className="shrink-0">
                    {isInCrate ? (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Check className="w-3.5 h-3.5" />
                        <span>In crate</span>
                      </div>
                    ) : isSelected ? (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center touch-target">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-border hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-colors touch-target">
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border/50 px-4 sm:px-0 safe-bottom">
        <Button
          variant="outline"
          className="flex-1 touch-target"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 gap-2 touch-target"
          disabled={selectedTracks.size === 0 || isPending}
          onClick={handleAdd}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add {selectedTracks.size > 0 ? `${selectedTracks.size} track${selectedTracks.size !== 1 ? 's' : ''}` : 'tracks'}
        </Button>
      </div>
    </>
  );

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh] bg-card/95 backdrop-blur-xl">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display text-xl">
              Add to {crateName ? `"${crateName}"` : 'Crate'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 pb-4">
            {modalContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add to {crateName ? `"${crateName}"` : 'Crate'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {modalContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTracksToCrateModal;
