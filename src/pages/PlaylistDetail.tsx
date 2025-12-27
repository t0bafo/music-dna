import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPlaylistTracks, 
  getAudioFeaturesFromReccoBeats,
  getCurrentUser,
  createPlaylist,
  addTracksToPlaylist,
  SpotifyPlaylist,
  SpotifyTrack,
} from '@/lib/spotify-api';
import { 
  TrackWithFeatures, 
  calculateFlowScore, 
  generateInsights,
  extractBpmIssues,
  FlowScore,
  FlowInsight,
  BpmIssue,
} from '@/lib/flow-analysis';
import { optimizePlaylist, OptimizationResult } from '@/lib/playlist-optimizer';
import {
  AppealProfile,
  AppealInsight,
  TrackWithPopularity,
  calculateAppealProfile,
  generateAppealInsights,
} from '@/lib/appeal-analysis';
import { getPlaylistSuggestions } from '@/lib/curation-tools';
import { 
  ArrowLeft, 
  Loader2, 
  ExternalLink, 
  Music,
  Sparkles,
  Save,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlowScoreCard from '@/components/FlowScoreCard';
import FlowCharts from '@/components/FlowCharts';
import FlowInsights from '@/components/FlowInsights';
import DraggableTrackTable from '@/components/DraggableTrackTable';
import AppealScoreCard from '@/components/AppealScoreCard';
import { AIPlaylistCoach } from '@/components/AIPlaylistCoach';
import OptimizePreviewModal from '@/components/OptimizePreviewModal';
import SaveToSpotifyModal from '@/components/SaveToSpotifyModal';
import TrackSuggestions from '@/components/TrackSuggestions';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/use-page-title';

// Fetch full track objects to get popularity scores
const getTrackPopularity = async (
  trackIds: string[],
  accessToken: string
): Promise<Map<string, number>> => {
  const popularityMap = new Map<string, number>();
  const BATCH_SIZE = 50;

  for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
    const chunk = trackIds.slice(i, i + BATCH_SIZE);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/tracks?ids=${chunk.join(',')}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        data.tracks?.forEach((track: SpotifyTrack) => {
          if (track?.id != null) {
            popularityMap.set(track.id, track.popularity ?? 0);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to fetch track popularity:', error);
    }
  }

  return popularityMap;
};

const PlaylistDetail = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [originalTracks, setOriginalTracks] = useState<TrackWithFeatures[]>([]);
  const [currentTracks, setCurrentTracks] = useState<TrackWithFeatures[]>([]);
  const [originalFlowScore, setOriginalFlowScore] = useState<FlowScore | null>(null);
  const [flowScore, setFlowScore] = useState<FlowScore | null>(null);
  
  // Dynamic page title based on playlist name
  usePageTitle(playlist?.name ? `${playlist.name} - Analysis` : 'Playlist Analysis');
  const [insights, setInsights] = useState<FlowInsight[]>([]);
  const [bpmIssues, setBpmIssues] = useState<BpmIssue[]>([]);
  const [appealProfile, setAppealProfile] = useState<AppealProfile | null>(null);
  const [appealInsights, setAppealInsights] = useState<AppealInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<OptimizationResult | null>(null);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scoreChange, setScoreChange] = useState<number | null>(null);

  // Derived state
  const hasChanges = useMemo(() => {
    if (originalTracks.length !== currentTracks.length) return false;
    return originalTracks.some((t, i) => t.id !== currentTracks[i]?.id);
  }, [originalTracks, currentTracks]);

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

      const trackIds = tracksList.map(t => t.id);

      // Fetch audio features and popularity in parallel
      const [features, popularityMap] = await Promise.all([
        getAudioFeaturesFromReccoBeats(trackIds),
        getTrackPopularity(trackIds, accessToken),
      ]);

      // Merge features and popularity
      tracksList.forEach(track => {
        const f = features.get(track.id);
        if (f) Object.assign(track, f);
        track.popularity = popularityMap.get(track.id) ?? 0;
      });

      setOriginalTracks(tracksList);
      setCurrentTracks(tracksList);

      // Calculate flow analysis
      const score = calculateFlowScore(tracksList);
      const insightsList = generateInsights(tracksList);
      const bpmIssuesList = extractBpmIssues(tracksList);

      setOriginalFlowScore(score);
      setFlowScore(score);
      setInsights(insightsList);
      setBpmIssues(bpmIssuesList);

      // Calculate appeal analysis
      const tracksWithPopularity: TrackWithPopularity[] = tracksList.map((t, i) => ({
        id: t.id,
        name: t.name,
        artist: t.artist,
        popularity: t.popularity ?? 0,
        position: i + 1,
      }));

      const profile = calculateAppealProfile(tracksWithPopularity);
      const appealInsightsList = generateAppealInsights(tracksWithPopularity, profile);

      setAppealProfile(profile);
      setAppealInsights(appealInsightsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [accessToken, playlistId]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [playlistId]);

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

  // Handle track reorder
  const handleReorder = useCallback((newTracks: TrackWithFeatures[]) => {
    const previousScore = flowScore?.score ?? 0;
    setCurrentTracks(newTracks);
    
    // Recalculate flow score
    const newScore = calculateFlowScore(newTracks);
    setFlowScore(newScore);
    
    // Show score change animation
    const change = newScore.score - previousScore;
    if (change !== 0) {
      setScoreChange(change);
      setTimeout(() => setScoreChange(null), 2000);
      
      if (change > 0) {
        toast.success(`Flow improved by +${change}!`);
      } else if (change < -5) {
        toast.warning(`Flow decreased by ${change}`);
      }
    }
    
    // Recalculate insights
    const newInsights = generateInsights(newTracks);
    const newBpmIssues = extractBpmIssues(newTracks);
    setInsights(newInsights);
    setBpmIssues(newBpmIssues);
  }, [flowScore]);

  // Reset to original order
  const handleReset = useCallback(() => {
    setCurrentTracks(originalTracks);
    setFlowScore(originalFlowScore);
    setInsights(generateInsights(originalTracks));
    setBpmIssues(extractBpmIssues(originalTracks));
    toast.info('Reset to original track order');
  }, [originalTracks, originalFlowScore]);

  // Auto-optimize
  const handleAutoOptimize = useCallback(() => {
    if (currentTracks.length < 5) {
      toast.error('Need at least 5 tracks to optimize');
      return;
    }
    
    setIsOptimizing(true);
    setShowOptimizeModal(true);
    
    // Simulate a short delay for UX
    setTimeout(() => {
      const result = optimizePlaylist(currentTracks);
      setOptimizeResult(result);
      setIsOptimizing(false);
    }, 1000);
  }, [currentTracks]);

  // Apply optimization
  const handleApplyOptimization = useCallback(() => {
    if (!optimizeResult) return;
    
    setCurrentTracks(optimizeResult.optimizedTracks);
    const newScore = calculateFlowScore(optimizeResult.optimizedTracks);
    setFlowScore(newScore);
    setInsights(generateInsights(optimizeResult.optimizedTracks));
    setBpmIssues(extractBpmIssues(optimizeResult.optimizedTracks));
    
    setShowOptimizeModal(false);
    setOptimizeResult(null);
    
    toast.success(`Playlist optimized! Flow score: ${newScore.score}`);
  }, [optimizeResult]);

  // Save to Spotify
  const handleSaveToSpotify = useCallback(async (playlistName: string): Promise<string | null> => {
    if (!accessToken) {
      toast.error('Not authenticated with Spotify');
      return null;
    }

    try {
      // Get current user
      const user = await getCurrentUser(accessToken);
      
      // Create new playlist
      const description = `Optimized for flow by Music DNA. Flow score: ${flowScore?.score ?? 0}/100. Created ${new Date().toLocaleDateString()}`;
      const newPlaylist = await createPlaylist(accessToken, user.id, playlistName, description, false);
      
      // Add tracks in new order
      const trackUris = currentTracks.map(t => `spotify:track:${t.id}`);
      await addTracksToPlaylist(accessToken, newPlaylist.id, trackUris);
      
      toast.success('Playlist saved to Spotify!');
      return newPlaylist.id;
    } catch (err) {
      console.error('Failed to save playlist:', err);
      toast.error('Failed to save playlist to Spotify');
      return null;
    }
  }, [accessToken, currentTracks, flowScore]);

  const handleTrackClick = (index: number) => {
    // Scroll to track table
    setTimeout(() => {
      const element = document.getElementById('track-table');
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const tracksWithData = currentTracks.filter(t => t.tempo != null && t.energy != null).length;
  const tracksWithTempo = currentTracks.filter(t => t.tempo != null).length;
  const tracksWithEnergy = currentTracks.filter(t => t.energy != null).length;

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
      {/* Hero Banner with Blurred Background */}
      {playlist && (
        <div className="relative overflow-hidden">
          {/* Blurred Background Image */}
          <div className="absolute inset-0 z-0">
            {playlist.images?.[0]?.url && (
              <img
                src={playlist.images[0].url}
                alt=""
                className="w-full h-full object-cover blur-3xl scale-110 opacity-30"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>

          {/* Header with Breadcrumb */}
          <header className="relative z-10 bg-transparent">
            <div className="container mx-auto px-4 py-4">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link 
                  to="/home" 
                  className="hover:text-foreground transition-colors"
                >
                  Home
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium truncate max-w-[200px]">
                  {playlist.name}
                </span>
              </nav>

              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => navigate('/home')}
                className="text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </header>

          {/* Playlist Header Content */}
          <div className="relative z-10 container mx-auto px-4 pb-8">
            <div className="flex flex-col md:flex-row gap-6 animate-fade-in">
              <div className="w-48 h-48 rounded-xl overflow-hidden bg-muted flex-shrink-0 mx-auto md:mx-0 shadow-2xl ring-1 ring-white/10">
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
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {playlist.name}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {currentTracks.length} tracks • by {playlist.owner?.display_name || 'Unknown'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank')}
                    className="bg-background/50 backdrop-blur-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Spotify
                  </Button>
                  {hasChanges && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="bg-background/50 backdrop-blur-sm"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Flow Score with Change Animation */}
        {flowScore && (
          <div className="mb-8 animate-fade-in relative">
            <FlowScoreCard
              flowScore={flowScore}
              trackCount={currentTracks.length}
              tracksWithData={tracksWithData}
              tracksWithTempo={tracksWithTempo}
              tracksWithEnergy={tracksWithEnergy}
            />
            {scoreChange !== null && (
              <div 
                className={`absolute top-4 right-4 text-2xl font-bold animate-fade-in ${
                  scoreChange > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {scoreChange > 0 ? '+' : ''}{scoreChange}
              </div>
            )}
          </div>
        )}

        {/* Appeal Score */}
        {appealProfile && (
          <div className="mb-8 animate-fade-in">
            <AppealScoreCard
              profile={appealProfile}
              trackCount={currentTracks.length}
            />
          </div>
        )}

        {/* Track Suggestions */}
        {flowScore && playlist && accessToken && (
          <div className="mb-8 animate-fade-in">
            <TrackSuggestions
              playlistId={playlist.id}
              playlistName={playlist.name}
              onGetSuggestions={() => {
                const avgBpm = currentTracks.filter(t => t.tempo).reduce((sum, t) => sum + (t.tempo || 0), 0) / (currentTracks.filter(t => t.tempo).length || 1);
                const avgEnergy = currentTracks.filter(t => t.energy).reduce((sum, t) => sum + ((t.energy || 0) * 100), 0) / (currentTracks.filter(t => t.energy).length || 1);
                const avgDance = currentTracks.filter(t => t.danceability).reduce((sum, t) => sum + ((t.danceability || 0) * 100), 0) / (currentTracks.filter(t => t.danceability).length || 1);
                
                return getPlaylistSuggestions(
                  accessToken,
                  currentTracks.map(t => t.id),
                  { avgBpm, avgEnergy, avgDanceability: avgDance }
                );
              }}
              onTrackAdded={() => fetchPlaylistData()}
            />
          </div>
        )}

        {/* AI Playlist Coach */}
        {flowScore && appealProfile && (
          <div className="mb-8 animate-fade-in">
            <AIPlaylistCoach
              playlistName={playlist?.name || 'Playlist'}
              trackCount={currentTracks.length}
              flowScore={flowScore.score}
              appealProfile={appealProfile}
              bpmIssues={bpmIssues}
              accessToken={accessToken}
            />
          </div>
        )}

        {/* Charts */}
        <div className="mb-8 animate-fade-in">
          <FlowCharts tracks={currentTracks} onTrackClick={handleTrackClick} />
        </div>

        {/* Insights */}
        <div className="mb-8 animate-fade-in">
          <FlowInsights insights={insights} appealInsights={appealInsights} />
        </div>

        {/* Track Table Header with Actions */}
        <div id="track-table" className="mb-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Detailed Track Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Drag tracks to reorder and improve flow score
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoOptimize}
                disabled={currentTracks.length < 5}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-Optimize
              </Button>
              <Button
                size="sm"
                onClick={() => setShowSaveModal(true)}
                disabled={!hasChanges}
                className="bg-spotify hover:bg-spotify/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save to Spotify
              </Button>
            </div>
          </div>
          
          {hasChanges && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
              <span className="text-sm text-yellow-500">
                Unsaved changes • {originalFlowScore?.score} → {flowScore?.score}
              </span>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-yellow-500 hover:text-yellow-400">
                Reset
              </Button>
            </div>
          )}
        </div>

        {/* Draggable Track Table */}
        <div className="mb-8">
          <DraggableTrackTable 
            tracks={currentTracks} 
            originalTracks={originalTracks}
            onReorder={handleReorder}
            showAppeal={true} 
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center pb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/home')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </main>

      {/* Modals */}
      <OptimizePreviewModal
        isOpen={showOptimizeModal}
        onClose={() => {
          setShowOptimizeModal(false);
          setOptimizeResult(null);
        }}
        onApply={handleApplyOptimization}
        result={optimizeResult}
        isLoading={isOptimizing}
      />

      <SaveToSpotifyModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveToSpotify}
        originalName={playlist?.name || 'Playlist'}
        flowScore={flowScore?.score ?? 0}
        originalScore={originalFlowScore?.score ?? 0}
      />
    </div>
  );
};

export default PlaylistDetail;
