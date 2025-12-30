import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Play, Pause, Sparkles, Music } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAddTracksToCrate } from '@/hooks/use-crates';
import { useAudioPreview } from '@/hooks/use-audio-preview';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Crate, TrackToAdd } from '@/lib/crates-api';

interface SuggestedTrack {
  track_id: string;
  name: string;
  artist: string;
  album: string;
  album_art_url?: string;
  duration_ms?: number;
  popularity?: number;
  tempo?: number;
  energy?: number;
  danceability?: number;
  valence?: number;
  preview_url?: string | null;
  score: number;
}

interface SmartSuggestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crate: Crate | null;
  onComplete?: () => void;
}

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-intelligence`;

const SmartSuggestionsModal = ({ open, onOpenChange, crate, onComplete }: SmartSuggestionsModalProps) => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const addTracks = useAddTracksToCrate();
  const { currentTrackId, isPlaying, toggle, stop } = useAudioPreview();

  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch suggestions when modal opens with a crate
  useEffect(() => {
    if (open && crate && accessToken) {
      fetchSuggestions();
    }
    return () => {
      stop();
    };
  }, [open, crate?.id, accessToken]);

  const fetchSuggestions = async () => {
    if (!crate || !accessToken) return;

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setSelectedTracks(new Set());

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-spotify-token': accessToken,
        },
        body: JSON.stringify({
          action: 'suggest_tracks_for_crate',
          data: {
            crate_name: crate.name,
            crate_description: crate.description || '',
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get suggestions');
      }

      const result = await response.json();
      const tracks = result.data || [];
      
      setSuggestions(tracks);
      // Select all by default
      setSelectedTracks(new Set(tracks.map((t: SuggestedTrack) => t.track_id)));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to find matching tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrack = (trackId: string) => {
    setSelectedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedTracks(new Set(suggestions.map(t => t.track_id)));
  };

  const deselectAll = () => {
    setSelectedTracks(new Set());
  };

  const handleAddSelected = async () => {
    if (!crate || selectedTracks.size === 0) return;

    setIsAdding(true);
    stop();

    try {
      const tracksToAdd: TrackToAdd[] = suggestions
        .filter(t => selectedTracks.has(t.track_id))
        .map(t => ({
          track_id: t.track_id,
          name: t.name,
          artist_name: t.artist,
          album_name: t.album,
          album_art_url: t.album_art_url || '',
          duration_ms: t.duration_ms,
          popularity: t.popularity,
          bpm: t.tempo,
          energy: t.energy,
          danceability: t.danceability,
          valence: t.valence,
          preview_url: t.preview_url,
        }));

      await addTracks.mutateAsync({
        crateId: crate.id,
        tracks: tracksToAdd,
      });

      toast.success(`Added ${tracksToAdd.length} tracks to your crate!`);
      onOpenChange(false);
      onComplete?.();
      navigate(`/crates/${crate.id}`);
    } catch (err) {
      console.error('Error adding tracks:', err);
      toast.error('Failed to add tracks. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSkip = () => {
    stop();
    onOpenChange(false);
    onComplete?.();
    if (crate) {
      navigate(`/crates/${crate.id}`);
    }
  };

  const handlePreview = (track: SuggestedTrack) => {
    if (track.preview_url) {
      toggle(track.track_id, track.preview_url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        stop();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Smart Suggestions for
          </DialogTitle>
          {crate && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{crate.emoji}</span>
              <span className="text-lg font-medium">{crate.name}</span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Finding tracks that match this vibe...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4 text-center px-4">
              <Music className="w-12 h-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adding tracks manually instead.
                </p>
              </div>
              <Button variant="outline" onClick={handleSkip}>
                Add Tracks Manually
              </Button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4 text-center px-4">
              <Music className="w-12 h-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No Suggestions Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We couldn't find tracks in your library that match this vibe.
                  <br />Try adding tracks manually or use Track Discovery.
                </p>
              </div>
              <Button variant="outline" onClick={handleSkip}>
                Add Tracks Manually
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                We found {suggestions.length} tracks from your library that might match this vibe.
                {suggestions.length < 5 && suggestions.length > 0 && (
                  <span className="block mt-1 text-yellow-500/80">
                    Only found {suggestions.length} tracks. You can add more manually later.
                  </span>
                )}
              </p>

              {/* Selection controls */}
              <div className="flex gap-2 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  className="text-xs"
                >
                  Deselect All
                </Button>
              </div>

              {/* Track list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {suggestions.map((track) => {
                  const isSelected = selectedTracks.has(track.track_id);
                  const isCurrentlyPlaying = currentTrackId === track.track_id && isPlaying;

                  return (
                    <div
                      key={track.track_id}
                      onClick={() => toggleTrack(track.track_id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                        "bg-secondary/30 hover:bg-secondary/50",
                        isSelected && "bg-primary/10 border border-primary/30"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTrack(track.track_id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        onClick={(e) => e.stopPropagation()}
                      />

                      {track.album_art_url ? (
                        <img
                          src={track.album_art_url}
                          alt={track.album}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{track.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </div>

                      {track.preview_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(track);
                          }}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isLoading && suggestions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/30 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
              disabled={isAdding}
            >
              Skip, Add Manually
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleAddSelected}
              disabled={selectedTracks.size === 0 || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  Add Selected ({selectedTracks.size})
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SmartSuggestionsModal;
