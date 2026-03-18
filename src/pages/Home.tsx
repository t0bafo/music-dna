import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Music, Loader2, AlertCircle, RefreshCw, Home as HomeIcon, Palette, Package, Search, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import HomeCratesSection from '@/components/HomeCratesSection';
import MusicStatsSection from '@/components/MusicStatsSection';
import { ThemeToggle } from '@/components/ThemeToggle';
import WelcomeModal from '@/components/WelcomeModal';
import { motion } from 'framer-motion';
import { calculateArchetype, Archetype, MusicProfile } from '@/lib/music-archetypes';
import { useTopTracks, TrackWithFeatures } from '@/hooks/use-music-intelligence';
import { useRecentDiscoveries, useUndergroundGems } from '@/hooks/use-saved-tracks';
import { AudioFeatures } from '@/lib/spotify-api';
import { usePageTitle } from '@/hooks/use-page-title';
import { useLibrarySync } from '@/hooks/use-library-sync';

// New Identity Components
import MusicalIdentityHero from '@/components/identity/MusicalIdentityHero';
import IdentityStatCards from '@/components/identity/IdentityStatCards';
import TopDefiningTracks from '@/components/identity/TopDefiningTracks';
import HorizontalTrackScroller, { ScrollerTrack } from '@/components/identity/HorizontalTrackScroller';
import ShareIdentityModal from '@/components/identity/ShareIdentityModal';
import YourMusicYearSection from '@/components/music-year/YourMusicYearSection';

const Home = () => {
  usePageTitle('Your Music DNA | Organize by Vibe, Not Genre');
  const { isAuthenticated, isLoading: authLoading, accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);

  // React Query hooks for cached data
  const { 
    data: topTracks = [], 
    isLoading: loadingTopTracks,
    error: topTracksError,
    refetch: refetchTopTracks
  } = useTopTracks(accessToken, 'medium_term', 50);

  // Recent discoveries (saved in last 30 days)
  const { 
    data: recentDiscoveries = [], 
    isLoading: loadingRecent 
  } = useRecentDiscoveries(accessToken, 50);

  // Underground gems (popularity < 50)
  const { 
    data: undergroundGems = [], 
    isLoading: loadingUnderground 
  } = useUndergroundGems(accessToken, 50);

  // Auto-sync library if stale (runs in background, non-blocking)
  useLibrarySync(true);

  const error = topTracksError ? (topTracksError instanceof Error ? topTracksError.message : 'Failed to fetch top tracks') : null;

  // Calculate underground count from top tracks
  const undergroundCount = useMemo(() => {
    return topTracks.filter(t => t.popularity < 50).length;
  }, [topTracks]);

  // Calculate underground index (0-100)
  const undergroundIndex = useMemo(() => {
    if (topTracks.length === 0) return 0;
    return Math.round((undergroundCount / topTracks.length) * 100);
  }, [undergroundCount, topTracks.length]);

  // Calculate stats for archetype and cards
  const stats = useMemo(() => {
    if (topTracks.length === 0) return null;
    
    const getAvg = (key: keyof AudioFeatures) => {
      const values = topTracks.map(t => t[key as keyof TrackWithFeatures]).filter((v): v is number => v != null);
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    const avgBpm = Math.round(getAvg('tempo'));
    const avgEnergy = Math.round(getAvg('energy') * 100);

    return {
      tempo: { avg: getAvg('tempo') },
      energy: { avg: getAvg('energy') },
      danceability: { avg: getAvg('danceability') },
      valence: { avg: getAvg('valence') },
      avgBpm,
      avgEnergy,
    };
  }, [topTracks]);

  // Calculate archetype
  const archetype = useMemo<Archetype | null>(() => {
    if (!stats) return null;
    
    const profile: MusicProfile = {
      avgBpm: stats.tempo.avg,
      avgEnergy: stats.energy.avg,
      avgDanceability: stats.danceability.avg,
      avgValence: stats.valence.avg,
      undergroundRatio: topTracks.length > 0 ? undergroundCount / topTracks.length : 0,
    };
    
    return calculateArchetype(profile);
  }, [stats, topTracks.length, undergroundCount]);

  // Transform recent discoveries into ScrollerTrack format
  const recentTracks: ScrollerTrack[] = useMemo(() => {
    return recentDiscoveries.map(item => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists[0]?.name || 'Unknown',
      albumImage: item.track.album.images?.[1]?.url || item.track.album.images?.[0]?.url,
      albumName: item.track.album.name,
      duration_ms: item.track.duration_ms,
      popularity: item.track.popularity,
      added_at: item.added_at,
    }));
  }, [recentDiscoveries]);

  // Transform underground gems into ScrollerTrack format
  const gemTracks: ScrollerTrack[] = useMemo(() => {
    return undergroundGems.map(item => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists[0]?.name || 'Unknown',
      albumImage: item.track.album.images?.[1]?.url || item.track.album.images?.[0]?.url,
      albumName: item.track.album.name,
      duration_ms: item.track.duration_ms,
      popularity: item.track.popularity,
      added_at: item.added_at,
    }));
  }, [undergroundGems]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

          {/* Your Music Year */}
          {accessToken && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }}
            >
              <YourMusicYearSection accessToken={accessToken} />
            </motion.div>
          )}

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

  return (
    <div className="min-h-screen gradient-bg pb-24 lg:pb-0">
      {/* Header with Navigation */}
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <div 
              className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-sonic-dark rounded-xl flex items-center justify-center shadow-glow cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/home')}
            >
              <Music className="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
                <HomeIcon className="w-4 h-4" />
                <span>Home</span>
              </div>
              <Link
                to="/crates"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Crates</span>
              </Link>
              <Link 
                to="/studio" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span>Studio</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-5xl">
        {/* 1. Welcome Message */}
        <motion.div 
          className="mb-8 lg:mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Welcome back, {user?.display_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground">
            Here's your music identity snapshot.
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-5 mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm flex-1">{error}</p>
            <Button size="sm" variant="outline" onClick={() => refetchTopTracks()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        <div className="space-y-8 lg:space-y-10">
          {/* 2. Musical Identity Hero */}
          <MusicalIdentityHero
            archetype={archetype}
            undergroundIndex={undergroundIndex}
            avgBpm={stats?.avgBpm || 0}
            avgEnergy={stats?.avgEnergy || 0}
            undergroundGemsCount={undergroundCount}
            topTracks={topTracks.slice(0, 3).map(t => ({ name: t.name, artist: t.artist }))}
            isLoading={loadingTopTracks}
            onShare={() => setShowShareModal(true)}
          />

          {/* 3. Stat Cards Row */}
          <IdentityStatCards
            avgBpm={stats?.avgBpm || 0}
            avgEnergy={stats?.avgEnergy || 0}
            undergroundPercent={undergroundIndex}
            hiddenGemsCount={undergroundCount}
            isLoading={loadingTopTracks}
          />

          {/* 4. Top 3 Tracks That Define You */}
          <TopDefiningTracks
            tracks={topTracks}
            isLoading={loadingTopTracks}
          />

          {/* 5. Recent Discoveries */}
          <HorizontalTrackScroller
            title="Recent Discoveries"
            subtitle="Tracks you saved in the last 30 days"
            emoji="🌟"
            tracks={recentTracks}
            isLoading={loadingRecent}
            emptyMessage="You haven't saved any tracks recently. Explore new music!"
            bulkCrateName="Recent Finds"
            bulkCrateDescription="Tracks I discovered recently"
            delay={1.1}
          />

          {/* 6. Underground Gems */}
          <HorizontalTrackScroller
            title="Underground Gems You Vibe With"
            subtitle="Hidden tracks under 50,000 streams"
            emoji="💎"
            tracks={gemTracks}
            isLoading={loadingUnderground}
            emptyMessage="You tend to follow popular tracks. Try digging deeper! 🔍"
            bulkCrateName="Hidden Gems Collection"
            bulkCrateDescription="Underground tracks I vibe with"
            delay={1.2}
          />

          {/* Deep Dive into Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.25 }}
          >
            <Link to="/intelligence">
              <Card className="bg-gradient-to-br from-card/90 via-card/80 to-primary/5 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
                <CardContent className="p-5 lg:p-6 flex items-center gap-4 lg:gap-5">
                  <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                    <BarChart3 className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base lg:text-lg font-bold text-foreground mb-0.5">
                      Deep Dive into Your Music Stats
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Analyze your listening patterns, BPM distribution, energy preferences, and audio DNA
                    </p>
                  </div>
                  <span className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">→</span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* 7. Your Crates */}
          <HomeCratesSection />

          {/* 8. Music Stats (Collapsed by default) */}
          <MusicStatsSection 
            topTracks={topTracks}
            accessToken={accessToken}
            isLoading={loadingTopTracks}
          />

          {/* 9. What's Next? */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.3 }}
          >
            <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-5">
              🚀 What's Next?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              {/* Create a Crate */}
              <Link to="/crates">
                <Card className="bg-card/70 backdrop-blur-xl border-border/40 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 h-full group">
                  <CardContent className="p-6 lg:p-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <span className="text-3xl lg:text-4xl">🗂️</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      Create a Crate
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Organize music by vibe
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Discover Tracks */}
              <Link to="/studio">
                <Card className="bg-card/70 backdrop-blur-xl border-border/40 hover:border-chart-purple/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 h-full group">
                  <CardContent className="p-6 lg:p-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-chart-purple/10 flex items-center justify-center mb-4 group-hover:bg-chart-purple/20 transition-colors">
                      <Search className="w-7 h-7 lg:w-8 lg:h-8 text-chart-purple" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      Discover Tracks
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Find music in your library
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Analyze Playlist */}
              <Link to="/studio">
                <Card className="bg-card/70 backdrop-blur-xl border-border/40 hover:border-chart-cyan/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 h-full group">
                  <CardContent className="p-6 lg:p-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-chart-cyan/10 flex items-center justify-center mb-4 group-hover:bg-chart-cyan/20 transition-colors">
                      <BarChart3 className="w-7 h-7 lg:w-8 lg:h-8 text-chart-cyan" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      Analyze a Playlist
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      See flow and optimize
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.section>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
      
      {/* First-time Welcome Modal */}
      <WelcomeModal />

      {/* Share Identity Modal */}
      <ShareIdentityModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        archetype={archetype}
        undergroundIndex={undergroundIndex}
        avgBpm={stats?.avgBpm || 0}
        avgEnergy={stats?.avgEnergy || 0}
        undergroundGemsCount={undergroundCount}
        topTracks={topTracks.slice(0, 3).map(t => ({ name: t.name, artist: t.artist }))}
      />
    </div>
  );
};

export default Home;
