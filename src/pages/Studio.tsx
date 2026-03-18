import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  Search, 
  Sparkles, 
  BarChart3,
  Music,
  Radio,
  Home,
  Package,
  Palette,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import SmartDiscoveryEngine from '@/components/SmartDiscoveryEngine';
import ContextPlaylistGenerator from '@/components/ContextPlaylistGenerator';
import PlaylistFlowAnalyzer from '@/components/PlaylistFlowAnalyzer';
import { searchLibraryTracks, generateContextPlaylist } from '@/lib/curation-tools';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTitle } from '@/hooks/use-page-title';

type ToolType = 'none' | 'analyzer' | 'find' | 'build' | 'snitc';

interface ToolCard {
  id: ToolType;
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  buttonText: string;
  color: string;
}

const TOOL_CARDS: ToolCard[] = [
  {
    id: 'analyzer',
    icon: <BarChart3 className="w-8 h-8" />,
    emoji: '📊',
    title: 'Playlist Analyzer',
    description: 'Analyze any Spotify playlist for flow, energy curves, and BPM transitions. Get smart optimization suggestions.',
    buttonText: 'Analyze a Playlist',
    color: 'primary',
  },
  {
    id: 'find',
    icon: <Search className="w-8 h-8" />,
    emoji: '🔍',
    title: 'Find Tracks',
    description: 'Discover tracks from your library using smart filters, BPM, energy, and vibes.',
    buttonText: 'Start Searching',
    color: 'chart-purple',
  },
  {
    id: 'build',
    icon: <Sparkles className="w-8 h-8" />,
    emoji: '🎯',
    title: 'Build a Set',
    description: 'Generate playlists for specific events, moods, and moments with AI curation.',
    buttonText: 'Create a Set',
    color: 'chart-cyan',
  },
  {
    id: 'snitc',
    icon: <Radio className="w-8 h-8" />,
    emoji: '🎧',
    title: 'SNITC Event Generator',
    description: 'Generate professionally curated 6-hour event playlists for Apollo Wrldx events with proper energy progression and genre transitions.',
    buttonText: 'Generate Event Sets',
    color: 'chart-orange',
  },
];

const Studio = () => {
  usePageTitle('Studio | Create & Discover');
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ToolType>('none');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleToolClick = (toolId: ToolType) => {
    if (toolId === 'snitc') {
      navigate('/snitc-generator');
      return;
    }
    setActiveTool(toolId);
  };

  const handleBack = () => {
    setActiveTool('none');
  };

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
            <div 
              className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-sonic-dark rounded-xl flex items-center justify-center cursor-pointer shadow-glow"
              onClick={() => navigate('/home')}
            >
              <Music className="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link 
                to="/home" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/crates"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Crates</span>
              </Link>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
                <Palette className="w-4 h-4" />
                <span>Studio</span>
              </div>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-4xl">
        <AnimatePresence mode="wait">
          {activeTool === 'none' ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Page Header */}
              <div className="mb-10 lg:mb-12">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-4xl lg:text-5xl">🎨</span>
                  <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
                    Studio
                  </h1>
                </div>
                <p className="text-base lg:text-lg text-muted-foreground">
                  Tools to discover, analyze, and create
                </p>
              </div>

              {/* Tool Cards */}
              <div className="space-y-5 lg:space-y-6">
                {TOOL_CARDS.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      className={cn(
                        "bg-card/70 backdrop-blur-xl border-border/40 overflow-hidden cursor-pointer group",
                        "hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                      )}
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <CardContent className="p-6 lg:p-8">
                        <div className="flex items-start gap-5 lg:gap-6">
                          {/* Icon */}
                          <div className={cn(
                            "w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center flex-shrink-0",
                            tool.color === 'primary' && "bg-primary/10 text-primary",
                            tool.color === 'chart-purple' && "bg-chart-purple/10 text-chart-purple",
                            tool.color === 'chart-cyan' && "bg-chart-cyan/10 text-chart-cyan",
                            tool.color === 'chart-orange' && "bg-orange-500/10 text-orange-500"
                          )}>
                            <span className="text-4xl lg:text-5xl">{tool.emoji}</span>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-2">
                              {tool.title}
                            </h3>
                            <p className="text-sm lg:text-base text-muted-foreground mb-5 leading-relaxed">
                              {tool.description}
                            </p>
                            <Button 
                              size="lg"
                              className={cn(
                                "gap-2 group-hover:gap-3 transition-all btn-scale",
                                tool.color === 'chart-purple' && "bg-chart-purple hover:bg-chart-purple/90",
                                tool.color === 'chart-cyan' && "bg-chart-cyan hover:bg-chart-cyan/90 text-chart-cyan-foreground",
                                tool.color === 'chart-orange' && "bg-orange-500 hover:bg-orange-500/90"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToolClick(tool.id);
                              }}
                            >
                              {tool.buttonText}
                              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-6 text-muted-foreground hover:text-foreground"
              >
                ← Back to Studio
              </Button>

              {/* Tool Content */}
              {activeTool === 'analyzer' && (
                <div>
                  <div className="mb-8">
                    <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                      <span>📊</span> Playlist Analyzer
                    </h2>
                    <p className="text-muted-foreground mt-2 text-base lg:text-lg">
                      Select a playlist to analyze its flow and get optimization suggestions
                    </p>
                  </div>
                  <PlaylistFlowAnalyzer fullWidth />
                </div>
              )}
              
              {activeTool === 'find' && (
                <div>
                  <div className="mb-8">
                    <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                      <span>🔍</span> Find Tracks
                    </h2>
                    <p className="text-muted-foreground mt-2 text-base lg:text-lg">
                      Discover tracks in your library using smart filters
                    </p>
                  </div>
                  <SmartDiscoveryEngine 
                    onSearch={(filters) => searchLibraryTracks(accessToken!, filters)}
                    fullWidth
                  />
                </div>
              )}
              
              {activeTool === 'build' && (
                <div>
                  <div className="mb-8">
                    <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                      <span>🎯</span> Build a Set
                    </h2>
                    <p className="text-muted-foreground mt-2 text-base lg:text-lg">
                      Generate playlists for specific events and moments
                    </p>
                  </div>
                  <ContextPlaylistGenerator 
                    onGenerate={(context, duration) => generateContextPlaylist(accessToken!, context, duration)}
                    fullWidth
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Studio;
