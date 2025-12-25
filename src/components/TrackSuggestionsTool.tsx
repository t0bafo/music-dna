import { useState, useEffect, useCallback } from 'react';
import { Target, Loader2, Play, Plus, ChevronDown, ChevronUp, Music2, ExternalLink, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlaylists, addTracksToPlaylist, SpotifyPlaylist } from '@/lib/spotify-api';
import { cn } from '@/lib/utils';

interface PlaylistProfile {
  name: string;
  track_count: number;
  avg_bpm: number;
  avg_energy: number;
  avg_danceability: number;
  avg_valence: number;
  bpm_range: [number, number];
}

interface SuggestedTrack {
  track_id: string;
  name: string;
  artist: string;
  score: number;
  bpm: number;
  energy: number;
  danceability: number;
  valence: number;
  match_reason: string;
}

interface SuggestTracksResponse {
  playlist_profile: PlaylistProfile;
  suggestions: SuggestedTrack[];
}

const TrackSuggestionsTool = () => {
  const { accessToken } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [playlistProfile, setPlaylistProfile] = useState<PlaylistProfile | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedTrack[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [addedTracks, setAddedTracks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Fetch user's playlists on mount
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!accessToken) return;
      
      setLoadingPlaylists(true);
      try {
        const response = await getUserPlaylists(accessToken, 50);
        setPlaylists(response.items || []);
      } catch (err) {
        console.error('Failed to fetch playlists:', err);
        setError('Unable to load playlists. Please refresh.');
      } finally {
        setLoadingPlaylists(false);
      }
    };

    fetchPlaylists();
  }, [accessToken]);

  // Analyze selected playlist
  const handleAnalyze = useCallback(async () => {
    if (!accessToken || !selectedPlaylistId) return;

    setIsAnalyzing(true);
    setError(null);
    setPlaylistProfile(null);
    setSuggestions([]);
    setAddedTracks(new Set());

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-intelligence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-spotify-token': accessToken,
          },
          body: JSON.stringify({
            action: 'suggest_tracks_for_playlist',
            data: { playlist_id: selectedPlaylistId },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze playlist');
      }

      const result: { data: SuggestTracksResponse } = await response.json();
      setPlaylistProfile(result.data.playlist_profile);
      setSuggestions(result.data.suggestions);

      if (result.data.suggestions.length === 0) {
        toast.info('No compatible tracks found. Try a different playlist or add more tracks to your library.');
      } else {
        toast.success(`Found ${result.data.suggestions.length} compatible tracks!`);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      const message = err instanceof Error ? err.message : 'Unable to analyze playlist. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [accessToken, selectedPlaylistId]);

  // Add track to playlist
  const handleAddTrack = useCallback(async (track: SuggestedTrack) => {
    if (!accessToken || !selectedPlaylistId) return;

    setAddingTrackId(track.track_id);
    try {
      await addTracksToPlaylist(accessToken, selectedPlaylistId, [`spotify:track:${track.track_id}`]);
      setAddedTracks(prev => new Set(prev).add(track.track_id));
      toast.success(`Added "${track.name}" to playlist`);
    } catch (err) {
      console.error('Failed to add track:', err);
      toast.error('Failed to add track. Try again.');
    } finally {
      setAddingTrackId(null);
    }
  }, [accessToken, selectedPlaylistId]);

  // Get valence description
  const getValenceDescription = (valence: number): string => {
    if (valence < 30) return 'Melancholic';
    if (valence < 50) return 'Mellow';
    if (valence < 70) return 'Neutral';
    if (valence < 85) return 'Uplifting';
    return 'Euphoric';
  };

  // Get score color class
  const getScoreColorClass = (score: number): string => {
    if (score >= 90) return 'bg-primary text-primary-foreground';
    if (score >= 80) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-muted text-muted-foreground';
  };

  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 10);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card/80 via-card/60 to-chart-cyan/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-5 h-5 text-primary" />
          </div>
          Track Suggestions
        </CardTitle>
        <CardDescription>
          Find compatible tracks for your playlists
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Playlist Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Select Playlist</label>
          {loadingPlaylists ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading playlists...</span>
            </div>
          ) : playlists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don't have any playlists yet. Create one in Spotify first.
            </p>
          ) : (
            <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
              <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                <SelectValue placeholder="Choose a playlist..." />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    <div className="flex items-center gap-2">
                      <span>{playlist.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({playlist.tracks?.total || 0} tracks)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Analyze Button */}
        {!playlistProfile && (
          <>
            <Button
              onClick={handleAnalyze}
              disabled={!selectedPlaylistId || isAnalyzing}
              className="w-full"
              variant="sonic"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Analyze Playlist
                </>
              )}
            </Button>

            {!selectedPlaylistId && !loadingPlaylists && playlists.length > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Choose a playlist to get track suggestions that match its vibe
              </p>
            )}
          </>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={handleAnalyze} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {/* Results */}
        {playlistProfile && (
          <div className="space-y-6">
            {/* Playlist Vibe Section */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-3">
              <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Music2 className="w-4 h-4 text-primary" />
                Playlist Vibe
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BPM</span>
                  <span className="text-foreground font-medium">
                    {Math.round(playlistProfile.avg_bpm)} ({Math.round(playlistProfile.bpm_range[0])}-{Math.round(playlistProfile.bpm_range[1])})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energy</span>
                  <span className="text-foreground font-medium">{Math.round(playlistProfile.avg_energy)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Danceability</span>
                  <span className="text-foreground font-medium">{Math.round(playlistProfile.avg_danceability)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mood</span>
                  <span className="text-foreground font-medium">{getValenceDescription(playlistProfile.avg_valence)}</span>
                </div>
              </div>
            </div>

            {/* Suggestions Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                💡 {suggestions.length} Compatible Tracks Found
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPlaylistProfile(null);
                  setSuggestions([]);
                }}
              >
                New Search
              </Button>
            </div>

            {/* Suggestions List */}
            {suggestions.length > 0 ? (
              <ScrollArea className="h-[320px] rounded-xl border border-border/50 bg-secondary/20">
                <div className="p-4 space-y-2">
                  {displayedSuggestions.map((track) => {
                    const isAdded = addedTracks.has(track.track_id);
                    const isAdding = addingTrackId === track.track_id;
                    
                    return (
                      <div
                        key={track.track_id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                          isAdded 
                            ? "bg-primary/5 border border-primary/20" 
                            : "hover:bg-secondary/50 border border-transparent"
                        )}
                      >
                        {/* Album Art Placeholder */}
                        <div className="w-12 h-12 rounded-md bg-secondary/50 flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-5 h-5 text-muted-foreground" />
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate text-foreground">{track.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-2">{track.artist}</p>
                          
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getScoreColorClass(track.score))}
                            >
                              {Math.round(track.score)}% Match
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-secondary/80 border-0">
                              {Math.round(track.bpm)} BPM
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground italic">
                            {track.match_reason}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`https://open.spotify.com/track/${track.track_id}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant={isAdded ? "ghost" : "outline"}
                            size="sm"
                            onClick={() => handleAddTrack(track)}
                            disabled={isAdding || isAdded}
                            className={cn(
                              "transition-all",
                              isAdded && "text-primary"
                            )}
                          >
                            {isAdding ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isAdded ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No compatible tracks found in your library for this playlist.
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Try a different playlist or sync more tracks to your library.
                </p>
              </div>
            )}

            {/* Show More/Less */}
            {suggestions.length > 10 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show All ({suggestions.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackSuggestionsTool;
