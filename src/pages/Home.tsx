import { useEffect, useMemo } from 'react';
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
import { motion } from 'framer-motion';
import { calculateArchetype, Archetype, MusicProfile } from '@/lib/music-archetypes';
import { useTopTracks, TrackWithFeatures } from '@/hooks/use-music-intelligence';
import { AudioFeatures } from '@/lib/spotify-api';
import { usePageTitle } from '@/hooks/use-page-title';
import { useLibrarySync } from '@/hooks/use-library-sync';

const Home = () => {
  usePageTitle('Your Music DNA | Organize by Vibe, Not Genre');
  const { isAuthenticated, isLoading: authLoading, accessToken, user } = useAuth();
  const navigate = useNavigate();

  // React Query hooks for cached data
  const { 
    data: topTracks = [], 
    isLoading: loadingTopTracks,
    error: topTracksError,
    refetch: refetchTopTracks
  } = useTopTracks(accessToken, 'medium_term', 50);

  // Auto-sync library if stale (runs in background, non-blocking)
  useLibrarySync(true);

  const error = topTracksError ? (topTracksError instanceof Error ? topTracksError.message : 'Failed to fetch top tracks') : null;

  // Calculate underground count
  const undergroundCount = useMemo(() => {
    return topTracks.filter(t => t.popularity < 50).length;
  }, [topTracks]);

  // Calculate stats for archetype
  const stats = useMemo(() => {
    if (topTracks.length === 0) return null;
    
    const getAvg = (key: keyof AudioFeatures) => {
      const values = topTracks.map(t => t[key as keyof TrackWithFeatures]).filter((v): v is number => v != null);
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    return {
      tempo: { avg: getAvg('tempo') },
      energy: { avg: getAvg('energy') },
      danceability: { avg: getAvg('danceability') },
      valence: { avg: getAvg('valence') },
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

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
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-sonic-dark rounded-xl flex items-center justify-center shadow-glow">
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
      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-6xl">
        {/* 1. Welcome Message */}
        <motion.div 
          className="mb-10 lg:mb-12"
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

        <div className="space-y-10 lg:space-y-12">
          {/* 2. Personality Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-card/95 via-card/90 to-primary/5 backdrop-blur-xl border-primary/20 shadow-2xl overflow-hidden">
              <CardContent className="py-14 px-8 lg:py-20 lg:px-12 flex flex-col items-center relative">
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-transparent to-transparent pointer-events-none" />
                
                {loadingTopTracks ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground text-lg">Analyzing your music...</p>
                  </div>
                ) : archetype ? (
                  <>
                    <p className="text-lg lg:text-xl text-muted-foreground mb-3">You're a</p>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary flex items-center justify-center gap-4 mb-5">
                      <span className="text-4xl lg:text-5xl">{archetype.emoji}</span>
                      <span>{archetype.name}</span>
                    </h2>
                    <p className="text-base lg:text-lg text-muted-foreground text-center max-w-lg leading-relaxed">
                      {archetype.traits.join(' • ')}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-lg">Listen to more music to discover your archetype</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 3. Your Crates */}
          <HomeCratesSection />

          {/* 4. Music Stats */}
          <MusicStatsSection 
            topTracks={topTracks}
            accessToken={accessToken}
            isLoading={loadingTopTracks}
          />

          {/* 5. What's Next? */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
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
    </div>
  );
};

export default Home;
