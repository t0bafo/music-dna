import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Plus, Music } from 'lucide-react';
import { useAddTracksToCrate } from '@/hooks/use-crates';
import { useAuth } from '@/contexts/AuthContext';
import { getLibrarySecure } from '@/lib/secure-database';
import { useQuery } from '@tanstack/react-query';
import { TrackToAdd } from '@/lib/crates-api';

interface AddTracksToCrateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crateId: string;
  existingTrackIds: string[];
}

// Fetch track details from Spotify API including duration and album art
async function fetchSpotifyTrackDetails(
  trackIds: string[],
  accessToken: string
): Promise<Map<string, { duration_ms: number; album_art_url: string }>> {
  const details = new Map<string, { duration_ms: number; album_art_url: string }>();
  
  // Spotify API allows max 50 tracks per request
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
            const albumArt = track.album?.images?.[0]?.url || '';
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

const AddTracksToCrateModal = ({ open, onOpenChange, crateId, existingTrackIds }: AddTracksToCrateModalProps) => {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<Map<string, any>>(new Map());
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const addTracks = useAddTracksToCrate();

  // Fetch user's library
  const { data: library = [], isLoading } = useQuery({
    queryKey: ['library-for-crate', accessToken],
    queryFn: () => getLibrarySecure(accessToken!),
    enabled: !!accessToken && open,
    staleTime: 1000 * 60 * 5,
  });

  // Filter tracks not already in crate and matching search
  const filteredTracks = useMemo(() => {
    const existingSet = new Set(existingTrackIds);
    
    return library
      .filter((track) => !existingSet.has(track.track_id))
      .filter((track) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          track.name?.toLowerCase().includes(query) ||
          track.artist?.toLowerCase().includes(query) ||
          track.album?.toLowerCase().includes(query)
        );
      })
      .slice(0, 100); // Limit for performance
  }, [library, existingTrackIds, searchQuery]);

  const toggleTrack = (track: any) => {
    const newSelected = new Map(selectedTracks);
    
    if (newSelected.has(track.track_id)) {
      newSelected.delete(track.track_id);
    } else {
      // Store basic info, will fetch duration/album art on submit
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
    
    setSelectedTracks(newSelected);
  };

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
      onOpenChange(false);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const isPending = addTracks.isPending || isFetchingDetails;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add Tracks to Crate</DialogTitle>
          <DialogDescription>
            Search your library and select tracks to add.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected count */}
        {selectedTracks.size > 0 && (
          <div className="text-sm text-primary font-medium">
            {selectedTracks.size} track{selectedTracks.size !== 1 ? 's' : ''} selected
          </div>
        )}

        {/* Track list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
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
              {filteredTracks.map((track) => (
                <label
                  key={track.track_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedTracks.has(track.track_id)}
                    onCheckedChange={() => toggleTrack(track)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  {track.tempo && (
                    <span className="text-xs text-muted-foreground/70 bg-secondary/50 px-2 py-0.5 rounded">
                      {Math.round(track.tempo)} BPM
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
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
            Add {selectedTracks.size > 0 ? selectedTracks.size : ''} Track{selectedTracks.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTracksToCrateModal;
