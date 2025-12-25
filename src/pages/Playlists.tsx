import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlaylists, SpotifyPlaylist } from '@/lib/spotify-api';
import { Music, Loader2, RefreshCw, Home, Brain, SlidersHorizontal, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import PlaylistGrid from '@/components/PlaylistGrid';
import { motion } from 'framer-motion';

const Playlists = () => {
  const { isAuthenticated, isLoading: authLoading, accessToken, user } = useAuth();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch user's playlists
  const fetchPlaylists = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getUserPlaylists(accessToken, 50);
      setPlaylists(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists();
    }
  }, [accessToken, fetchPlaylists]);

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
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
                <ListMusic className="w-4 h-4" />
                <span>Playlists</span>
              </div>
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
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
              📀 Your Playlists
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              Click on a playlist to analyze its flow and optimize it.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPlaylists}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 lg:p-12 text-center border border-border/50">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your playlists...</p>
          </div>
        ) : playlists.length > 0 ? (
          <PlaylistGrid playlists={playlists} />
        ) : (
          <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 text-center border border-border/50">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No playlists found</h3>
            <p className="text-muted-foreground">Create some playlists on Spotify to see them here.</p>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Playlists;
