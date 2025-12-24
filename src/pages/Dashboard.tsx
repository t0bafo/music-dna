import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getTopTracks, 
  getUserPlaylists, 
  getPlaylistTracks,
  getAudioFeaturesFromReccoBeats,
  SpotifyTrack,
  SpotifyPlaylist,
  AudioFeatures,
  TimeRange,
} from '@/lib/spotify-api';
import { Music, Loader2, AlertCircle, ListMusic, RefreshCw, Brain, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import AudioDNACard from '@/components/AudioDNACard';
import PlaylistGrid from '@/components/PlaylistGrid';
import TrackTable from '@/components/TrackTable';

interface TrackWithFeatures extends SpotifyTrack, Partial<AudioFeatures> {
  artist: string;
  albumImage?: string;
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

  // My Audio DNA state
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [topTracks, setTopTracks] = useState<TrackWithFeatures[]>([]);
  const [userStats, setUserStats] = useState<Stats | null>(null);
  const [loadingTopTracks, setLoadingTopTracks] = useState(false);

  // My Playlists state
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // Errors
  const [error, setError] = useState<string | null>(null);

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
            
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-1">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
              <Link 
                to="/intelligence" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>Intelligence</span>
              </Link>
            </nav>
          </div>
          <UserProfile />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-6xl">
        {/* Welcome */}
        <div className="mb-6 lg:mb-8 animate-fade-in">
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.display_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Explore your music DNA and analyze your playlists.
          </p>
        </div>

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

        {/* Tabs - Simplified to 2 tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2 gap-2 h-auto p-1 bg-secondary/30">
            <TabsTrigger value="overview" className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Home className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <ListMusic className="w-4 h-4" />
              <span>Playlists</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview (Your Audio DNA) */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-lg lg:text-xl font-bold text-foreground">Your Audio DNA Profile</h2>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="short_term">Last 4 Weeks</SelectItem>
                  <SelectItem value="medium_term">Last 6 Months</SelectItem>
                  <SelectItem value="long_term">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingTopTracks ? (
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 lg:p-12 text-center border border-border/50">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing your top tracks...</p>
              </div>
            ) : userStats ? (
              <>
                <AudioDNACard
                  title={`Your ${timeRangeLabels[timeRange]} DNA`}
                  subtitle="Based on your most-played tracks"
                  stats={userStats}
                  trackCount={topTracks.length}
                />

                <div>
                  <h3 className="font-display text-base lg:text-lg font-bold text-foreground mb-4">Your Top 50 Tracks</h3>
                  <TrackTable tracks={topTracks} />
                </div>
              </>
            ) : (
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 lg:p-12 text-center border border-border/50">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No listening data yet</h3>
                <p className="text-muted-foreground">Start listening to music on Spotify and come back!</p>
              </div>
            )}

            {/* CTA to Intelligence */}
            <div className="mt-6 lg:mt-8 p-4 lg:p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Brain className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Want deeper insights?</h3>
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      Analyze your entire library with Music Intelligence
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/intelligence')} className="w-full sm:w-auto gap-2">
                  <Brain className="w-4 h-4" />
                  Go to Intelligence
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: My Playlists */}
          <TabsContent value="playlists" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-display text-lg lg:text-xl font-bold text-foreground">Your Playlists</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">Click a playlist to analyze its flow</p>
            </div>

            {loadingPlaylists ? (
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 lg:p-12 text-center border border-border/50">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your playlists...</p>
              </div>
            ) : playlists.length > 0 ? (
              <PlaylistGrid
                playlists={playlists}
                selectedPlaylistId={selectedPlaylist?.id}
              />
            ) : (
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 lg:p-12 text-center border border-border/50">
                <ListMusic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No playlists found</h3>
                <p className="text-muted-foreground">Create some playlists on Spotify to see them here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;
