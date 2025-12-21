import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getRecommendations, createPlaylist, addTracksToPlaylist, getTopTracks, SpotifyTrack } from '@/lib/spotify-api';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Music, Sparkles, Save, Clock, Zap, PartyPopper, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import TrackTable from './TrackTable';

// Map genre selection to Spotify genre seeds
const GENRE_SEEDS: Record<string, string[]> = {
  afrobeats: ['afrobeat'],
  amapiano: ['afrobeat', 'house'],
  afro_house: ['house', 'afrobeat'],
  mix: [], // No genre filter - use only track seeds
};

interface TrackWithFeatures extends SpotifyTrack {
  artist: string;
  albumImage?: string;
  tempo?: number;
  danceability?: number;
  energy?: number;
}

const SmartPlaylistCreator = () => {
  const { accessToken, user } = useAuth();

  // Form state
  const [targetBpm, setTargetBpm] = useState(110);
  const [minDanceability, setMinDanceability] = useState(60);
  const [minEnergy, setMinEnergy] = useState(50);
  const [duration, setDuration] = useState(60); // minutes
  const [genre, setGenre] = useState('mix');

  // Results state
  const [generatedTracks, setGeneratedTracks] = useState<TrackWithFeatures[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  const generatePlaylist = async () => {
    if (!accessToken) {
      toast.error('Please log in to generate playlists');
      return;
    }

    setIsGenerating(true);
    setGeneratedTracks([]);

    try {
      // Fetch user's top tracks to use as seeds
      toast.info('Analyzing your music taste...');
      const topTracksData = await getTopTracks(accessToken, 'medium_term', 50);
      
      if (!topTracksData.items || topTracksData.items.length === 0) {
        toast.error('Listen to more music on Spotify to unlock personalized playlists!');
        setIsGenerating(false);
        return;
      }

      // Use first 5 tracks as seeds
      const seedTrackIds = topTracksData.items.slice(0, 5).map(t => t.id);
      const genreSeeds = GENRE_SEEDS[genre] || [];
      const targetDurationMs = duration * 60 * 1000;

      console.log('Using seed tracks:', seedTrackIds);
      console.log('Using genre seeds:', genreSeeds);

      // Fetch recommendations with audio feature targets
      const data = await getRecommendations(accessToken, seedTrackIds, {
        target_tempo: targetBpm,
        min_danceability: minDanceability / 100,
        min_energy: minEnergy / 100,
        seed_genres: genreSeeds.length > 0 ? genreSeeds : undefined,
      }, 100);

      if (!data.tracks || data.tracks.length === 0) {
        throw new Error('No recommendations found. Try adjusting your parameters.');
      }

      // Filter and accumulate tracks until target duration
      let accumulatedDuration = 0;
      const selectedTracks: TrackWithFeatures[] = [];

      for (const track of data.tracks) {
        if (accumulatedDuration >= targetDurationMs) break;

        const trackWithFeatures: TrackWithFeatures = {
          ...track,
          artist: track.artists[0]?.name || 'Unknown',
          albumImage: track.album.images?.[2]?.url || track.album.images?.[0]?.url,
        };

        selectedTracks.push(trackWithFeatures);
        accumulatedDuration += track.duration_ms;
      }

      setGeneratedTracks(selectedTracks);
      setTotalDuration(accumulatedDuration);

      toast.success(`Generated ${selectedTracks.length} personalized tracks (${formatDuration(accumulatedDuration)})`);
    } catch (err) {
      console.error('Failed to generate playlist:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate playlist. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToSpotify = async () => {
    if (!accessToken || !user || generatedTracks.length === 0) return;

    setIsSaving(true);

    try {
      // Create playlist
      const genreLabel = genre === 'afro_house' ? 'Afro House' : genre.charAt(0).toUpperCase() + genre.slice(1);
      const playlistName = `${genreLabel} Mix - ${targetBpm} BPM`;
      const description = `Smart playlist: ${targetBpm} BPM, ${minDanceability}% danceability, ${minEnergy}% energy. Created with Music DNA.`;

      const playlist = await createPlaylist(accessToken, user.id, playlistName, description);

      // Add tracks to playlist
      const trackUris = generatedTracks.map(t => `spotify:track:${t.id}`);
      await addTracksToPlaylist(accessToken, playlist.id, trackUris);

      toast.success(`Playlist "${playlistName}" saved to your Spotify!`);
    } catch (err) {
      console.error('Failed to save playlist:', err);
      toast.error('Failed to save playlist. Make sure you have the right permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
  ];

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="bg-card rounded-xl p-6 card-shadow">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-spotify" />
          Create Your Perfect Playlist
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Target BPM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                Target BPM
              </Label>
              <span className="text-sm font-medium text-spotify">{targetBpm}</span>
            </div>
            <Slider
              value={[targetBpm]}
              onValueChange={([v]) => setTargetBpm(v)}
              min={80}
              max={180}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>80 (Slow)</span>
              <span>180 (Fast)</span>
            </div>
          </div>

          {/* Min Danceability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-muted-foreground" />
                Min Danceability
              </Label>
              <span className="text-sm font-medium text-spotify">{minDanceability}%</span>
            </div>
            <Slider
              value={[minDanceability]}
              onValueChange={([v]) => setMinDanceability(v)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Min Energy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                Min Energy
              </Label>
              <span className="text-sm font-medium text-spotify">{minEnergy}%</span>
            </div>
            <Slider
              value={[minEnergy]}
              onValueChange={([v]) => setMinEnergy(v)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Playlist Duration
            </Label>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Genre */}
          <div className="space-y-3 md:col-span-2">
            <Label className="flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              Genre Vibes
            </Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="afrobeats">🎵 Afrobeats</SelectItem>
                <SelectItem value="amapiano">🎹 Amapiano</SelectItem>
                <SelectItem value="afro_house">🏠 Afro House</SelectItem>
                <SelectItem value="mix">🎧 Mix of All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generatePlaylist}
          disabled={isGenerating}
          className="w-full mt-6 bg-spotify hover:bg-spotify/90 text-primary-foreground"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Playlist
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {generatedTracks.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* Stats Banner */}
          <div className="bg-card rounded-xl p-4 card-shadow flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Tracks</p>
                <p className="text-xl font-bold text-foreground">{generatedTracks.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-bold text-foreground">{formatDuration(totalDuration)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target BPM</p>
                <p className="text-xl font-bold text-spotify">{targetBpm}</p>
              </div>
            </div>

            <Button
              onClick={saveToSpotify}
              disabled={isSaving}
              className="bg-spotify hover:bg-spotify/90 text-primary-foreground"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save to Spotify
                </>
              )}
            </Button>
          </div>

          {/* Track List */}
          <TrackTable tracks={generatedTracks} />
        </div>
      )}
    </div>
  );
};

export default SmartPlaylistCreator;
