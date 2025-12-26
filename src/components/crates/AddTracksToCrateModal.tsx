import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Plus, Music, Check } from 'lucide-react';
import { useAddTracksToCrate } from '@/hooks/use-crates';
import { useAuth } from '@/contexts/AuthContext';
import { getLibrarySecure } from '@/lib/secure-database';
import { useQuery } from '@tanstack/react-query';
import { TrackToAdd } from '@/lib/crates-api';
import { cn } from '@/lib/utils';
import { useTopTracks } from '@/hooks/use-music-intelligence';

interface AddTracksToCrateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crateId: string;
  crateName?: string;
  existingTrackIds: string[];
}

type FilterType = 'all' | 'top50' | 'deepcuts';

// Fetch track details from Spotify API including duration and album art
async function fetchSpotifyTrackDetails(
  trackIds: string[],
  accessToken: string
): Promise<Map<string, { duration_ms: number; album_art_url: string }>> {
  const details = new Map<string, { duration_ms: number; album_art_url: string }>();
  
  const chunks: string[][] = [];
  for (let i = 0; i < trackIds.length; i += 50) {
    chunks.push(trackIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/tracks?ids=${chunk.join(',')}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        for (const track of data.tracks || []) {
          if (track && track.id) {
            const albumArt = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || '';
            details.set(track.id, {
              duration_ms: track.duration_ms || 0,
              album_art_url: albumArt
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch Spotify track details:', err);
    }
  }

  return details;
}

const AddTracksToCrateModal = ({ 
  open, 
  onOpenChange, 
  crateId, 
  crateName,
  existingTrackIds 
}: AddTracksToCrateModalProps) => {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<Map<string, any>>(new Map());
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const addTracks = useAddTracksToCrate();

  // Fetch user's library
  const { data: library = [], isLoading } = useQuery({
    queryKey: ['library-for-crate', accessToken],
    queryFn: () => getLibrarySecure(accessToken!),
    enabled: !!accessToken && open,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch user's actual top 50 tracks from Spotify
  const { data: topTracks = [], isLoading: topTracksLoading } = useTopTracks(accessToken, 'medium_term', 50);

  const existingSet = useMemo(() => new Set(existingTrackIds), [existingTrackIds]);

  // Convert top tracks to library format for consistent display
  const topTracksAsLibrary = useMemo(() => {
    return topTracks.map(t => ({
      track_id: t.id,
      name: t.name,
      artist: t.artist,
      album: t.album?.name || '',
      tempo: t.tempo,
      energy: t.energy,
      danceability: t.danceability,
      valence: t.valence,
      popularity: t.popularity
    }));
  }, [topTracks]);

  // Apply filters and search - NO artificial limits, show ALL tracks
  const filteredTracks = useMemo(() => {
    let tracks: any[];

    // Apply filter - use different source based on filter type
    switch (activeFilter) {
      case 'top50':
        // Use actual top 50 most-played tracks DIRECTLY from Spotify API
        // Don't filter through library - show ALL top tracks even if not saved
        tracks = topTracksAsLibrary;
        break;
      case 'deepcuts':
        tracks = library.filter((t) => (t.popularity || 100) < 50);
        break;
      default:
        // 'all' filter: show ALL library tracks
        tracks = library;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tracks = tracks.filter((track) =>
        track.name?.toLowerCase().includes(query) ||
        track.artist?.toLowerCase().includes(query) ||
        track.album?.toLowerCase().includes(query)
      );
    }

    // Return ALL matching tracks - no artificial limit
    return tracks;
  }, [library, activeFilter, searchQuery, topTracksAsLibrary]);

  const toggleTrack = useCallback((track: any) => {
    // Don't allow selecting tracks already in crate
    if (existingSet.has(track.track_id)) return;

    setSelectedTracks((prev) => {
      const newSelected = new Map(prev);
      
      if (newSelected.has(track.track_id)) {
        newSelected.delete(track.track_id);
      } else {
        newSelected.set(track.track_id, {
          track_id: track.track_id,
          name: track.name,
          artist_name: track.artist,
          album_name: track.album,
          bpm: track.tempo,
          energy: track.energy,
          danceability: track.danceability,
          valence: track.valence,
          popularity: track.popularity
        });
      }
      
      return newSelected;
    });
  }, [existingSet]);

  const handleAdd = async () => {
    if (selectedTracks.size === 0 || !accessToken) return;

    setIsFetchingDetails(true);
    
    try {
      // Fetch duration and album art from Spotify
      const trackIds = Array.from(selectedTracks.keys());
      const spotifyDetails = await fetchSpotifyTrackDetails(trackIds, accessToken);

      // Build final track data with all details
      const tracksToAdd: TrackToAdd[] = Array.from(selectedTracks.entries()).map(([trackId, track]) => {
        const details = spotifyDetails.get(trackId);
        return {
          track_id: trackId,
          name: track.name,
          artist_name: track.artist_name,
          album_name: track.album_name,
          album_art_url: details?.album_art_url || '',
          duration_ms: details?.duration_ms || 0,
          popularity: track.popularity,
          bpm: track.bpm,
          energy: track.energy,
          danceability: track.danceability,
          valence: track.valence
        };
      });

      await addTracks.mutateAsync({
        crateId,
        tracks: tracksToAdd
      });

      setSelectedTracks(new Map());
      setSearchQuery('');
      setActiveFilter('all');
      onOpenChange(false);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleClose = () => {
    setSelectedTracks(new Map());
    setSearchQuery('');
    setActiveFilter('all');
    onOpenChange(false);
  };

  const isPending = addTracks.isPending || isFetchingDetails;

  // Format duration
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add to {crateName ? `"${crateName}"` : 'Crate'}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/30"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="text-xs"
          >
            All Tracks
          </Button>
          <Button
            variant={activeFilter === 'top50' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('top50')}
            className="text-xs"
          >
            Top 50
          </Button>
          <Button
            variant={activeFilter === 'deepcuts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('deepcuts')}
            className="text-xs"
          >
            Deep Cuts
          </Button>
        </div>

        {/* Track counts */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filteredTracks.length.toLocaleString()} track{filteredTracks.length !== 1 ? 's' : ''} 
            {library.length > 0 && filteredTracks.length !== library.length && (
              <span className="text-muted-foreground/60"> of {library.length.toLocaleString()}</span>
            )}
          </span>
          {selectedTracks.size > 0 && (
            <span className="text-primary font-medium">
              {selectedTracks.size} selected
            </span>
          )}
        </div>

        {/* Track list */}
        <ScrollArea className="h-[400px] -mx-6 px-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading your library...</p>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No matching tracks found' : 'No tracks available'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchQuery ? 'Try a different search term' : 'Extract your library from Intelligence tab first'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {filteredTracks.map((track) => {
                const isInCrate = existingSet.has(track.track_id);
                const isSelected = selectedTracks.has(track.track_id);
                
                return (
                  <div
                    key={track.track_id}
                    onClick={() => toggleTrack(track)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                      isInCrate 
                        ? "opacity-50 cursor-not-allowed bg-secondary/20" 
                        : isSelected 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-secondary/50"
                    )}
                  >
                    {/* Checkbox or Check icon */}
                    <div className="shrink-0">
                      {isInCrate ? (
                        <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </div>
                      ) : (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleTrack(track)}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      )}
                    </div>

                    {/* Album art placeholder */}
                    <div className="w-10 h-10 rounded-md bg-secondary/50 shrink-0 flex items-center justify-center overflow-hidden">
                      <Music className="w-5 h-5 text-muted-foreground/50" />
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
                        <span className="truncate">{track.artist}</span>
                      </div>
                    </div>

                    {/* Duration & BPM */}
                    <div className="shrink-0 text-right text-xs text-muted-foreground/70">
                      {track.tempo && (
                        <div className="bg-secondary/50 px-2 py-0.5 rounded">
                          {Math.round(track.tempo)} BPM
                        </div>
                      )}
                    </div>

                    {/* In crate indicator */}
                    {isInCrate && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        In crate
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
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
      </DialogContent>
    </Dialog>
  );
};

export default AddTracksToCrateModal;
