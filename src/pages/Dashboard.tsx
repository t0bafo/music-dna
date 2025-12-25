import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getTopTracks, 
  getUserPlaylists, 
  getAudioFeaturesFromReccoBeats,
  SpotifyTrack,
  SpotifyPlaylist,
  AudioFeatures,
  TimeRange,
} from '@/lib/spotify-api';
import { Music, Loader2, AlertCircle, RefreshCw, Brain, Home, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import TrackTable from '@/components/TrackTable';
import PlaylistGrid from '@/components/PlaylistGrid';
import MusicSignatureHero from '@/components/MusicSignatureHero';
import TopAlbumsGrid from '@/components/TopAlbumsGrid';
import SimplifiedMetricsGrid from '@/components/SimplifiedMetricsGrid';
import ActionCards from '@/components/ActionCards';
import { motion } from 'framer-motion';

interface TrackWithFeatures extends Omit<SpotifyTrack, 'popularity'>, Partial<AudioFeatures> {
  artist: string;
  albumImage?: string;
  popularity: number;
}

interface Stats {
  tempo: { avg: number; min: number; max: number };
  danceability: { avg: number; min: number; max: number };
  energy: { avg: number; min: number; max: number };
  valence: { avg: number; min: number; max: number };
  acousticness: { avg: number };
  speechiness: { avg: number };
  instrumentalness: { avg: number };
  liveness: { avg: number };
}

const calculateStats = (tracks: TrackWithFeatures[]): Stats => {
  const getValues = (key: keyof AudioFeatures) =>
    tracks.map(t => t[key]).filter((v): v is number => v != null);

  const calcStat = (values: number[]) => ({
    avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  });

  return {
    tempo: calcStat(getValues('tempo')),
    danceability: calcStat(getValues('danceability')),
    energy: calcStat(getValues('energy')),
    valence: calcStat(getValues('valence')),
    acousticness: { avg: calcStat(getValues('acousticness')).avg },
    speechiness: { avg: calcStat(getValues('speechiness')).avg },
    instrumentalness: { avg: calcStat(getValues('instrumentalness')).avg },
    liveness: { avg: calcStat(getValues('liveness')).avg },
  };
};

const Dashboard = () => {
  const { isAuthenticated, isLoading: authLoading, accessToken, user } = useAuth();
  const navigate = useNavigate();

  // State
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [topTracks, setTopTracks] = useState<TrackWithFeatures[]>([]);
  const [userStats, setUserStats] = useState<Stats | null>(null);
  const [loadingTopTracks, setLoadingTopTracks] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracksTableOpen, setTracksTableOpen] = useState(false);

  // Calculate underground count
  const undergroundCount = useMemo(() => {
    return topTracks.filter(t => t.popularity < 50).length;
  }, [topTracks]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch user's top tracks
  const fetchTopTracks = useCallback(async () => {
    if (!accessToken) return;

    setLoadingTopTracks(true);
    setError(null);

    try {
      const data = await getTopTracks(accessToken, timeRange, 50);
      const tracks: TrackWithFeatures[] = data.items.map(track => ({
        ...track,
        artist: track.artists[0]?.name || 'Unknown',
        albumImage: track.album.images?.[2]?.url || track.album.images?.[0]?.url,
        popularity: track.popularity,
      }));

      // Fetch audio features
      const trackIds = tracks.map(t => t.id);
      const features = await getAudioFeaturesFromReccoBeats(trackIds);

      // Merge features
      tracks.forEach(track => {
        const f = features.get(track.id);
        if (f) Object.assign(track, f);
      });

      setTopTracks(tracks);
      setUserStats(calculateStats(tracks));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch top tracks');
    } finally {
      setLoadingTopTracks(false);
    }
  }, [accessToken, timeRange]);

  // Fetch user's playlists
  const fetchPlaylists = useCallback(async () => {
    if (!accessToken) return;

    setLoadingPlaylists(true);
    try {
      const data = await getUserPlaylists(accessToken, 50);
      setPlaylists(data.items);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [accessToken]);

  // Initial data fetch
  useEffect(() => {
    if (accessToken) {
      fetchTopTracks();
      fetchPlaylists();
    }
  }, [accessToken, fetchTopTracks, fetchPlaylists]);

  // Refetch when time range changes
  useEffect(() => {
    if (accessToken && topTracks.length > 0) {
      fetchTopTracks();
    }
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const timeRangeLabels: Record<TimeRange, string> = {
    short_term: 'Last 4 Weeks',
    medium_term: 'Last 6 Months',
    long_term: 'All Time',
  };

  return (
    <div className="min-h-screen gradient-bg pb-24 lg:pb-0">
      {/* Header with Navigation */}
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-sonic-dark rounded-xl flex items-center justify-center shadow-glow">
              <Music className="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
              <Link 
                to="/playlists" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Music className="w-4 h-4" />
                <span>Playlists</span>
              </Link>
              <Link 
                to="/intelligence" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>Intelligence</span>
              </Link>
              <Link 
                to="/curation" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Curation Lab</span>
              </Link>
            </nav>
          </div>
          <UserProfile />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-6xl">
        {/* Welcome + Time Range Selector */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
              Welcome back, {user?.display_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              Here's your music personality snapshot.
            </p>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              <SelectItem value="short_term">Last 4 Weeks</SelectItem>
              <SelectItem value="medium_term">Last 6 Months</SelectItem>
              <SelectItem value="long_term">All Time</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm flex-1">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchTopTracks}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        <div className="space-y-6 lg:space-y-8">
          {/* 1. HERO - Music Signature */}
          <MusicSignatureHero
            stats={userStats}
            trackCount={topTracks.length}
            undergroundCount={undergroundCount}
            isLoading={loadingTopTracks}
            onExplore={() => navigate('/intelligence')}
          />

          {/* 2. Quick Stats - Simplified Metrics */}
          <section>
            <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
              📊 Quick Stats ({timeRangeLabels[timeRange]})
            </h2>
            <SimplifiedMetricsGrid
              stats={userStats}
              undergroundCount={undergroundCount}
              totalTracks={topTracks.length}
              isLoading={loadingTopTracks}
            />
          </section>

          {/* 3. Top Albums Grid */}
          <TopAlbumsGrid
            tracks={topTracks}
            isLoading={loadingTopTracks}
          />

          {/* 4. Top 50 Tracks (Collapsible) */}
          {topTracks.length > 0 && (
            <Collapsible open={tracksTableOpen} onOpenChange={setTracksTableOpen}>
              <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                <CardHeader className="p-4 lg:p-6">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full text-left">
                      <CardTitle className="text-lg flex items-center gap-2">
                        🎵 Your Top 50 Tracks
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{tracksTableOpen ? 'Hide' : 'Show'}</span>
                        {tracksTableOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="p-4 lg:p-6 pt-0">
                    <TrackTable tracks={topTracks} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* 5. Your Playlists (Limited to 5) */}
          <section>
            <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
              📀 Your Playlists
            </h2>
            {loadingPlaylists ? (
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 lg:p-12 text-center border border-border/50">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your playlists...</p>
              </div>
            ) : playlists.length > 0 ? (
              <div className="space-y-4">
                <PlaylistGrid playlists={playlists.slice(0, 5)} />
                {playlists.length > 5 && (
                  <div className="text-center pt-2">
                    <Link
                      to="/playlists"
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                    >
                      View All {playlists.length} Playlists →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 text-center border border-border/50">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No playlists found</h3>
                <p className="text-muted-foreground">Create some playlists on Spotify to see them here.</p>
              </div>
            )}
          </section>

          {/* 6. Action Cards */}
          <section>
            <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
              🚀 What's Next?
            </h2>
            <ActionCards
              onNavigateIntelligence={() => navigate('/intelligence')}
              onNavigateCuration={() => navigate('/curation')}
            />
          </section>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;
