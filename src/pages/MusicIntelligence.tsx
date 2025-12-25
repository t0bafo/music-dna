import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Brain, 
  Loader2, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Music,
  Sparkles,
  Target,
  BarChart3,
  Clock,
  AlertCircle,
  Home,
  ListMusic,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import TopListenedArtistsCard from '@/components/charts/TopListenedArtistsCard';
import TopSongsTable from '@/components/TopSongsTable';
import BpmDistributionCard from '@/components/charts/BpmDistributionCard';
import EnergyDanceScatterCard from '@/components/charts/EnergyDanceScatterCard';
import ListeningPatternsCard from '@/components/charts/ListeningPatternsCard';
import { extractMusicLibrary, ExtractionProgress } from '@/lib/music-intelligence';
import {
  calculateBpmDistribution,
  calculateEnergyDanceScatter,
  calculateListeningPatterns,
  generateEnhancedInsights,
} from '@/lib/music-analytics';
import {
  useLibraryStats,
  useTasteProfile,
  useTasteSnapshots,
  useLibraryTracks,
  useTopTracksWithFeatures,
  useInvalidateMusicCache,
} from '@/hooks/use-music-intelligence';
import { usePageTitle } from '@/hooks/use-page-title';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const MusicIntelligence = () => {
  usePageTitle('Music Intelligence');
  const { isAuthenticated, isLoading: authLoading, accessToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // React Query hooks for cached data
  const { data: libraryStats, isLoading: statsLoading } = useLibraryStats(accessToken);
  const { data: tasteProfile, isLoading: profileLoading } = useTasteProfile(accessToken);
  const { data: snapshots = [], isLoading: snapshotsLoading } = useTasteSnapshots(accessToken);
  const { data: libraryTracks = [], isLoading: tracksLoading } = useLibraryTracks(accessToken);
  const { data: topTracksWithFeatures = [], isLoading: topTracksLoading } = useTopTracksWithFeatures(accessToken);
  
  const invalidateCache = useInvalidateMusicCache();

  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Combined loading state (only for initial load, not refetches)
  const loading = statsLoading || profileLoading || snapshotsLoading || tracksLoading;

  // Computed chart data from libraryTracks
  const { bpmData, scatterData, listeningPatterns, insights } = useMemo(() => {
    if (!tasteProfile || libraryTracks.length === 0) {
      return {
        bpmData: { distribution: [], sweetSpot: null },
        scatterData: { data: [], clusterInfo: null },
        listeningPatterns: { data: [], mostActiveDay: null },
        insights: [],
      };
    }

    return {
      bpmData: calculateBpmDistribution(libraryTracks),
      scatterData: calculateEnergyDanceScatter(libraryTracks),
      listeningPatterns: calculateListeningPatterns(libraryTracks),
      insights: generateEnhancedInsights(libraryTracks, {
        avgBpm: tasteProfile.avgBpm,
        avgEnergy: tasteProfile.avgEnergy,
        avgDanceability: tasteProfile.avgDanceability,
        avgValence: tasteProfile.avgValence,
        undergroundRatio: tasteProfile.undergroundRatio,
        bpmRange: tasteProfile.bpmRange,
      }),
    };
  }, [tasteProfile, libraryTracks]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Handle anchor scroll for #top-songs
  useEffect(() => {
    if (location.hash === '#top-songs' && !loading) {
      setTimeout(() => {
        const element = document.getElementById('top-songs');
        element?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [location.hash, loading]);

  // Handle extraction and refresh
  const handleExtract = async () => {
    if (!accessToken || !user?.id) return;

    setIsExtracting(true);
    setError(null);

    try {
      await extractMusicLibrary(accessToken, user.id, setExtractionProgress);
      // Invalidate all cached queries to refetch fresh data
      invalidateCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  };

  // Calculate days since last update
  const daysSinceUpdate = libraryStats?.lastUpdated 
    ? Math.floor((Date.now() - libraryStats.lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Radar chart data
  const radarData = tasteProfile ? [
    { feature: 'Energy', value: tasteProfile.avgEnergy * 100, fullMark: 100 },
    { feature: 'Dance', value: tasteProfile.avgDanceability * 100, fullMark: 100 },
    { feature: 'Valence', value: tasteProfile.avgValence * 100, fullMark: 100 },
    { feature: 'Acoustic', value: tasteProfile.avgAcousticness * 100, fullMark: 100 },
    { feature: 'Instrumental', value: tasteProfile.avgInstrumentalness * 100, fullMark: 100 },
    { feature: 'Liveness', value: tasteProfile.avgLiveness * 100, fullMark: 100 },
  ] : [];

  // Trend data from snapshots
  const trendData = snapshots.slice().reverse().map(s => ({
    date: s.snapshotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    energy: Math.round(s.avgEnergy * 100),
    danceability: Math.round(s.avgDanceability * 100),
    valence: Math.round(s.avgValence * 100),
  }));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const hasData = libraryStats && tasteProfile;

  return (
    <div className="min-h-screen gradient-bg pb-24 lg:pb-0">
      {/* Header with Navigation */}
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <div 
              className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-sonic-dark rounded-xl flex items-center justify-center cursor-pointer shadow-glow"
              onClick={() => navigate('/home')}
            >
              <Music className="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
            </div>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link 
                to="/home" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
                <Brain className="w-4 h-4" />
                <span>Intelligence</span>
              </div>
              <Link 
                to="/playlists" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <ListMusic className="w-4 h-4" />
                <span>Playlists</span>
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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-6 lg:mb-8 animate-fade-in">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 lg:gap-3 mb-2">
                <Brain className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  Music Intelligence
                </h1>
              </div>
              {hasData && (
                <p className="text-sm lg:text-base text-muted-foreground">
                  {libraryStats.totalTracks.toLocaleString()} tracks analyzed • {libraryStats.tracksWithFeatures.toLocaleString()} with audio features
                  {daysSinceUpdate !== null && ` • Updated ${daysSinceUpdate === 0 ? 'today' : `${daysSinceUpdate}d ago`}`}
                </p>
              )}
            </div>
            {hasData && (
              <Button onClick={handleExtract} variant="outline" size="sm" disabled={isExtracting} className="self-start lg:absolute lg:right-8 lg:top-24">
                <RefreshCw className={`w-4 h-4 mr-2 ${isExtracting ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Extraction Status / CTA */}
        {(isExtracting || (!hasData && !loading)) && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              {isExtracting ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Extracting Your Library</p>
                      <p className="text-sm text-muted-foreground">{extractionProgress?.message}</p>
                    </div>
                  </div>
                  <Progress 
                    value={extractionProgress?.total ? (extractionProgress.current / extractionProgress.total) * 100 : 0} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {extractionProgress?.current} / {extractionProgress?.total || '?'}
                  </p>
                </div>
              ) : loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading your music data...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Extract Your Music Library
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Analyze your complete Spotify library including liked songs, playlists, and audio features.
                  </p>
                  <Button onClick={handleExtract} size="lg" className="gap-2">
                    <Sparkles className="w-5 h-5" />
                    Start Extraction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading state for initial data */}
        {loading && !isExtracting && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your music data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {hasData && (
          <div className="space-y-6 lg:space-y-8">

            {/* Section 1: Your Signature Sound */}
            <section>
              <h2 className="font-display text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                Your Signature Sound
              </h2>
              <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
                {/* Audio DNA Radar */}
                <Card>
                  <CardHeader className="p-4 lg:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                      Your Audio DNA
                    </CardTitle>
                    <CardDescription className="text-xs lg:text-sm">
                      Signature profile based on {tasteProfile.totalTracks.toLocaleString()} tracks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                    <div className="h-[220px] lg:h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis 
                            dataKey="feature" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 100]} 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                          />
                          <Radar
                            name="Your Profile"
                            dataKey="value"
                            stroke="hsl(262, 83%, 58%)"
                            fill="url(#radarGradient)"
                            fillOpacity={0.5}
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                              <stop offset="100%" stopColor="hsl(192, 91%, 43%)" />
                            </linearGradient>
                          </defs>
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 lg:mt-4 grid grid-cols-2 gap-3 lg:gap-4 text-xs lg:text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg BPM</span>
                        <span className="font-semibold text-foreground">{Math.round(tasteProfile.avgBpm)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BPM Range</span>
                        <span className="font-semibold text-foreground">
                          {Math.round(tasteProfile.bpmRange.min)}-{Math.round(tasteProfile.bpmRange.max)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Artists - Real Listening Data */}
                <TopListenedArtistsCard accessToken={accessToken} />
              </div>
            </section>

            {/* Section 2: Top Songs Table */}
            <TopSongsTable 
              tracks={topTracksWithFeatures} 
              isLoading={topTracksLoading} 
            />

            {/* Section 3: Listening Patterns */}
            <section>
              <h2 className="font-display text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                Listening Patterns
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <BpmDistributionCard 
                  bpmData={bpmData.distribution} 
                  sweetSpot={bpmData.sweetSpot || undefined}
                />
                <EnergyDanceScatterCard 
                  data={scatterData.data}
                  clusterInfo={scatterData.clusterInfo || undefined}
                />
              </div>
            </section>

            {/* Section 3: Discovery Insights */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Discovery Insights
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Discovery Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      Underground Ratio
                    </CardTitle>
                    <CardDescription>
                      How mainstream vs underground is your taste
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Discovery Level</span>
                        <Badge variant={tasteProfile.undergroundRatio > 0.5 ? 'default' : 'secondary'}>
                          {Math.round(tasteProfile.undergroundRatio * 100)}%
                        </Badge>
                      </div>
                      <Progress value={tasteProfile.undergroundRatio * 100} className="h-3" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tasteProfile.undergroundRatio > 0.5 
                        ? "You're a tastemaker! Most of your music is underground."
                        : tasteProfile.undergroundRatio > 0.3
                        ? "Nice balance of discovery and hits."
                        : "You prefer established, popular tracks."}
                    </p>
                  </CardContent>
                </Card>

                {/* Insights */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      Top Insights
                    </CardTitle>
                    <CardDescription>
                      Actionable observations about your music taste
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.map((insight, i) => (
                        <div 
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">{i + 1}</span>
                          </div>
                          <p className="text-sm text-foreground">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 4: Taste Evolution (if historical data) */}
            {trendData.length > 1 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Taste Evolution
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">How Your Preferences Change Over Time</CardTitle>
                    <CardDescription>
                      Track your audio profile evolution across snapshots
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="energy" 
                            stroke="hsl(265 89% 66%)" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(265 89% 66%)' }}
                            name="Energy"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="danceability" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                            name="Danceability"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="valence" 
                            stroke="hsl(200 98% 60%)" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(200 98% 60%)' }}
                            name="Valence"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Section 5: Library Overview */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Library Overview
              </h2>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-card to-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{libraryStats.totalTracks.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Tracks</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{libraryStats.tracksWithFeatures.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">With Features</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{Math.round(tasteProfile.avgBpm)}</p>
                    <p className="text-sm text-muted-foreground">Avg BPM</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{Math.round(tasteProfile.avgEnergy * 100)}%</p>
                    <p className="text-sm text-muted-foreground">Avg Energy</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* When You Add Music (if data available) */}
            {listeningPatterns.data.some(d => d.count > 0) && (
              <section>
                <div className="grid gap-6 md:grid-cols-2">
                  <ListeningPatternsCard 
                    data={listeningPatterns.data}
                    mostActiveDay={listeningPatterns.mostActiveDay || undefined}
                  />
                </div>
              </section>
            )}

            {/* CTA to Curation Lab */}
            <section className="mt-8">
              <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
                <CardContent className="p-6 lg:p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <SlidersHorizontal className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground mb-2">
                        Ready to Build Playlists?
                      </h3>
                      <p className="text-sm lg:text-base text-muted-foreground max-w-md mx-auto">
                        Use our AI-powered curation tools to discover tracks, generate playlists, and find compatible songs for your vibe.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate('/curation')} 
                      className="gap-2 mt-2"
                      size="lg"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Go to Curation Lab
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MusicIntelligence;
