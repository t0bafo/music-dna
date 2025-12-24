import { useState, useCallback, useEffect } from 'react';
import { Lightbulb, Plus, Loader2, Gem, TrendingUp, RefreshCw, Music2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { addTracksToPlaylist } from '@/lib/spotify-api';

export interface SuggestedTrack {
  track_id: string;
  name: string;
  artist: string;
  tempo: number | null;
  energy: number | null;
  popularity: number | null;
  fitScore: number;
  reason: string;
}

interface TrackSuggestionsProps {
  playlistId: string;
  playlistName: string;
  onGetSuggestions: () => Promise<SuggestedTrack[]>;
  onTrackAdded?: () => void;
}

const TrackSuggestions = ({ 
  playlistId, 
  playlistName, 
  onGetSuggestions,
  onTrackAdded 
}: TrackSuggestionsProps) => {
  const { accessToken } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const tracks = await onGetSuggestions();
      setSuggestions(tracks);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [onGetSuggestions]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleAddTrack = useCallback(async (track: SuggestedTrack) => {
    if (!accessToken) return;

    setAddingTrackId(track.track_id);
    try {
      await addTracksToPlaylist(accessToken, playlistId, [`spotify:track:${track.track_id}`]);
      toast.success(`Added "${track.name}" to ${playlistName}`);
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(t => t.track_id !== track.track_id));
      
      onTrackAdded?.();
    } catch (err) {
      console.error('Failed to add track:', err);
      toast.error('Failed to add track');
    } finally {
      setAddingTrackId(null);
    }
  }, [accessToken, playlistId, playlistName, onTrackAdded]);

  if (isLoading && suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="w-5 h-5 text-primary" />
            Suggested Tracks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Finding tracks that fit...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="w-5 h-5 text-primary" />
              Suggested Tracks
            </CardTitle>
            <CardDescription>
              Tracks from your library that match this playlist's DNA
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSuggestions}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-6">
            <Music2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No suggestions available. Your library may already have similar tracks in this playlist.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.slice(0, 5).map((track, i) => (
              <div
                key={track.track_id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{track.name}</p>
                    {track.popularity !== null && track.popularity < 50 && (
                      <Gem className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                    {track.popularity !== null && track.popularity >= 70 && (
                      <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {track.tempo && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(track.tempo)} BPM
                      </Badge>
                    )}
                    {track.energy && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(track.energy * 100)}% Energy
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs text-primary">
                      {Math.round(track.fitScore * 100)}% Match
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    💡 {track.reason}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddTrack(track)}
                  disabled={addingTrackId === track.track_id}
                  className="flex-shrink-0"
                >
                  {addingTrackId === track.track_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackSuggestions;
