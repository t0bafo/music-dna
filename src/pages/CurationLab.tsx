import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SlidersHorizontal, 
  Loader2, 
  Search, 
  Sparkles, 
  Target,
  Music,
  Home,
  ListMusic,
  Brain,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import SmartDiscoveryEngine from '@/components/SmartDiscoveryEngine';
import ContextPlaylistGenerator from '@/components/ContextPlaylistGenerator';
import TrackSuggestionsTool from '@/components/TrackSuggestionsTool';
import { searchLibraryTracks, generateContextPlaylist } from '@/lib/curation-tools';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type ToolType = 'smart' | 'context' | 'suggestions';

const TOOLS: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: 'smart', label: 'Smart Discovery', icon: <Search className="w-4 h-4" /> },
  { id: 'context', label: 'Context Generator', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'suggestions', label: 'Track Suggestions', icon: <Target className="w-4 h-4" /> },
];

const CurationLab = () => {
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get tool from URL or localStorage, default to 'smart'
  const getInitialTool = (): ToolType => {
    const urlTool = searchParams.get('tool') as ToolType;
    if (urlTool && ['smart', 'context', 'suggestions'].includes(urlTool)) {
      return urlTool;
    }
    const stored = localStorage.getItem('curationLabLastTool') as ToolType;
    if (stored && ['smart', 'context', 'suggestions'].includes(stored)) {
      return stored;
    }
    return 'smart';
  };

  const [activeTool, setActiveTool] = useState<ToolType>(getInitialTool);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Sync URL with active tool
  useEffect(() => {
    const urlTool = searchParams.get('tool');
    if (urlTool !== activeTool) {
      setSearchParams({ tool: activeTool }, { replace: true });
    }
    localStorage.setItem('curationLabLastTool', activeTool);
  }, [activeTool, searchParams, setSearchParams]);

  // Handle browser back/forward
  useEffect(() => {
    const urlTool = searchParams.get('tool') as ToolType;
    if (urlTool && ['smart', 'context', 'suggestions'].includes(urlTool) && urlTool !== activeTool) {
      setActiveTool(urlTool);
    }
  }, [searchParams]);

  const handleTabChange = (tool: ToolType) => {
    setActiveTool(tool);
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
              onClick={() => navigate('/dashboard')}
            >
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
              <Link 
                to="/dashboard#playlists" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <ListMusic className="w-4 h-4" />
                <span>Playlists</span>
              </Link>
              <Link 
                to="/intelligence" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>Intelligence</span>
              </Link>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Curation Lab</span>
              </div>
            </nav>
          </div>
          <UserProfile />
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-7xl">
        {/* Page Header */}
        <motion.div 
          className="mb-6 lg:mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 lg:gap-3 mb-2">
                <SlidersHorizontal className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  Curation Lab
                </h1>
              </div>
              <p className="text-sm lg:text-base text-muted-foreground">
                AI-powered tools to discover and organize your music
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div 
            role="tablist"
            aria-label="Curation tools"
            className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide"
          >
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                role="tab"
                aria-selected={activeTool === tool.id}
                aria-controls={`panel-${tool.id}`}
                onClick={() => handleTabChange(tool.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 min-w-fit",
                  activeTool === tool.id
                    ? "bg-primary/10 text-primary border-b-[3px] border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-70 hover:opacity-85"
                )}
              >
                {tool.icon}
                <span>{tool.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tool Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            id={`panel-${activeTool}`}
            role="tabpanel"
            aria-labelledby={activeTool}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTool === 'smart' && (
              <SmartDiscoveryEngine 
                onSearch={(filters) => searchLibraryTracks(accessToken!, filters)}
                fullWidth
              />
            )}
            {activeTool === 'context' && (
              <ContextPlaylistGenerator 
                onGenerate={(context, duration) => generateContextPlaylist(accessToken!, context, duration)}
                fullWidth
              />
            )}
            {activeTool === 'suggestions' && (
              <TrackSuggestionsTool fullWidth />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default CurationLab;
