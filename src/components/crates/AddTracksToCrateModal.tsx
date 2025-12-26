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
import { TrackToAdd, CrateTrack } from '@/lib/crates-api';

interface AddTracksToCrateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crateId: string;
  existingTrackIds: string[];
}

const AddTracksToCrateModal = ({ open, onOpenChange, crateId, existingTrackIds }: AddTracksToCrateModalProps) => {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<Map<string, TrackToAdd>>(new Map());

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
      newSelected.set(track.track_id, {
        track_id: track.track_id,
        name: track.name,
        artist_name: track.artist,
        album_name: track.album,
        album_art_url: '', // Will be fetched when needed
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        bpm: track.tempo,
        energy: track.energy,
        danceability: track.danceability,
        valence: track.valence
      });
    }
    
    setSelectedTracks(newSelected);
  };

  const handleAdd = async () => {
    if (selectedTracks.size === 0) return;

    await addTracks.mutateAsync({
      crateId,
      tracks: Array.from(selectedTracks.values())
    });

    setSelectedTracks(new Map());
    setSearchQuery('');
    onOpenChange(false);
  };

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
            disabled={selectedTracks.size === 0 || addTracks.isPending}
            onClick={handleAdd}
          >
            {addTracks.isPending ? (
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
