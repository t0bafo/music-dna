import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPlaylistTracks, 
  getAudioFeaturesFromReccoBeats,
  SpotifyPlaylist,
} from '@/lib/spotify-api';
import { 
  TrackWithFeatures, 
  calculateFlowScore, 
  generateInsights,
  FlowScore,
  FlowInsight,
} from '@/lib/flow-analysis';
import { 
  ArrowLeft, 
  Loader2, 
  ExternalLink, 
  Music,
  FileText,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlowScoreCard from '@/components/FlowScoreCard';
import FlowCharts from '@/components/FlowCharts';
import FlowInsights from '@/components/FlowInsights';
import FlowTrackTable from '@/components/FlowTrackTable';

const PlaylistDetail = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<TrackWithFeatures[]>([]);
  const [flowScore, setFlowScore] = useState<FlowScore | null>(null);
  const [insights, setInsights] = useState<FlowInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedTrackIndex, setHighlightedTrackIndex] = useState<number | undefined>();

  const fetchPlaylistData = useCallback(async () => {
    if (!accessToken || !playlistId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch playlist metadata
      const playlistRes = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!playlistRes.ok) {
        throw new Error('Failed to load playlist');
      }

      const playlistData = await playlistRes.json();
      setPlaylist(playlistData);

      // Fetch playlist tracks
      const tracksData = await getPlaylistTracks(accessToken, playlistId, 100);
      
      const tracksList: TrackWithFeatures[] = tracksData.items
        .filter(item => item.track)
        .map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown',
          albumImage: item.track.album.images?.[2]?.url || item.track.album.images?.[0]?.url,
        }));

      // Fetch audio features
      const trackIds = tracksList.map(t => t.id);
      const features = await getAudioFeaturesFromReccoBeats(trackIds);

      // Merge features
      tracksList.forEach(track => {
        const f = features.get(track.id);
        if (f) Object.assign(track, f);
      });

      setTracks(tracksList);

      // Calculate flow analysis
      const score = calculateFlowScore(tracksList);
      const insightsList = generateInsights(tracksList);

      setFlowScore(score);
      setInsights(insightsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [accessToken, playlistId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (accessToken && playlistId) {
      fetchPlaylistData();
    }
  }, [accessToken, playlistId, fetchPlaylistData]);

  const handleTrackClick = (index: number) => {
    setHighlightedTrackIndex(index);
    // Scroll to track table
    setTimeout(() => {
      const element = document.getElementById('track-table');
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const tracksWithData = tracks.filter(t => t.tempo != null && t.energy != null).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-spotify mx-auto mb-4" />
          <p className="text-muted-foreground">
            {authLoading ? 'Loading...' : 'Analyzing playlist flow...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="bg-card rounded-xl p-12 card-shadow text-center">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Could not load playlist
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPlaylistData}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Playlists
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Playlist Header */}
        {playlist && (
          <div className="flex flex-col md:flex-row gap-6 mb-8 animate-fade-in">
            <div className="w-48 h-48 rounded-xl overflow-hidden bg-muted flex-shrink-0 mx-auto md:mx-0">
              {playlist.images?.[0]?.url ? (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm text-muted-foreground mb-1">Playlist Analysis</p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {playlist.name}
              </h1>
              <p className="text-muted-foreground mb-4">
                {tracks.length} tracks • by {playlist.owner?.display_name || 'Unknown'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Edit on Spotify
              </Button>
            </div>
          </div>
        )}

        {/* Flow Score */}
        {flowScore && (
          <div className="mb-8 animate-fade-in">
            <FlowScoreCard
              flowScore={flowScore}
              trackCount={tracks.length}
              tracksWithData={tracksWithData}
            />
          </div>
        )}

        {/* Charts */}
        <div className="mb-8 animate-fade-in">
          <FlowCharts tracks={tracks} onTrackClick={handleTrackClick} />
        </div>

        {/* Insights */}
        <div className="mb-8 animate-fade-in">
          <FlowInsights insights={insights} />
        </div>

        {/* Track Table */}
        <div id="track-table" className="mb-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Track Analysis</h3>
          <FlowTrackTable tracks={tracks} highlightedIndex={highlightedTrackIndex} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center pb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Analyze Another Playlist
          </Button>
          <Button variant="outline" disabled>
            <FileText className="w-4 h-4 mr-2" />
            Export Analysis (Coming Soon)
          </Button>
          <Button variant="outline" disabled>
            <Wand2 className="w-4 h-4 mr-2" />
            Optimize Order (Beta)
          </Button>
        </div>
      </main>
    </div>
  );
};

export default PlaylistDetail;
