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
          <Loader2 className="w-12 h-12 animate-spin text-spotify mx-auto mb-4" />
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
    <div className="min-h-screen gradient-bg">
      {/* Header with Navigation */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-spotify rounded-full flex items-center justify-center">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            
            {/* Simplified Navigation */}
            <nav className="hidden sm:flex items-center gap-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
              <Link 
                to="/intelligence" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.display_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Explore your music DNA and analyze your playlists.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
            <Button size="sm" variant="outline" onClick={fetchTopTracks} className="ml-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Tabs - Simplified to 2 tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 gap-2 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
              <Home className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex items-center gap-2 py-3">
              <ListMusic className="w-4 h-4" />
              <span>My Playlists</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview (Your Audio DNA) */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">Your Audio DNA Profile</h2>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">Last 4 Weeks</SelectItem>
                  <SelectItem value="medium_term">Last 6 Months</SelectItem>
                  <SelectItem value="long_term">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingTopTracks ? (
              <div className="bg-card rounded-xl p-12 card-shadow text-center">
                <Loader2 className="w-10 h-10 animate-spin text-spotify mx-auto mb-4" />
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
                  <h3 className="text-lg font-bold text-foreground mb-4">Your Top 50 Tracks</h3>
                  <TrackTable tracks={topTracks} />
                </div>
              </>
            ) : (
              <div className="bg-card rounded-xl p-12 card-shadow text-center">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">No listening data yet</h3>
                <p className="text-muted-foreground">Start listening to music on Spotify and come back!</p>
              </div>
            )}

            {/* CTA to Intelligence */}
            <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Brain className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Want deeper insights?</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyze your entire library with Music Intelligence
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/intelligence')} className="gap-2">
                  <Brain className="w-4 h-4" />
                  Go to Intelligence
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: My Playlists */}
          <TabsContent value="playlists" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Your Playlists</h2>
              <p className="text-sm text-muted-foreground">Click a playlist to analyze its flow</p>
            </div>

            {loadingPlaylists ? (
              <div className="bg-card rounded-xl p-12 card-shadow text-center">
                <Loader2 className="w-10 h-10 animate-spin text-spotify mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your playlists...</p>
              </div>
            ) : playlists.length > 0 ? (
              <PlaylistGrid
                playlists={playlists}
                selectedPlaylistId={selectedPlaylist?.id}
              />
            ) : (
              <div className="bg-card rounded-xl p-12 card-shadow text-center">
                <ListMusic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">No playlists found</h3>
                <p className="text-muted-foreground">Create some playlists on Spotify to see them here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
