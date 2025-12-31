import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCrates } from '@/hooks/use-crates';
import { useVibeSearch } from '@/hooks/use-vibe-search';
import { Music, Plus, Home as HomeIcon, Palette, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import CrateGrid from '@/components/crates/CrateGrid';
import CreateCrateModal from '@/components/crates/CreateCrateModal';
import EmptyCratesState from '@/components/crates/EmptyCratesState';
import { CrateGridSkeleton } from '@/components/ui/skeletons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTitle } from '@/hooks/use-page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { CratesSearchBar } from '@/components/crates/CratesSearchBar';
import { CratesSearchResults, SearchLoadingState } from '@/components/crates/CratesSearchResults';
import { InterpretedFilters } from '@/components/search/InterpretedFilters';

const Crates = () => {
  usePageTitle('Your Crates | Music Memory System');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: crates = [], isLoading } = useCrates();
  
  // AI-powered vibe search across all crates
  const {
    results: searchResults,
    totalTrackCount,
    crateCount,
    isSearching,
    isLoadingCrates,
    hasResults,
    isLimitReached,
    expandedFilters,
    isExpanding,
    removeVibe,
    removeScene,
    removeTempo,
    removeEnergy,
  } = useVibeSearch(searchQuery);

  const isActiveSearch = searchQuery.length >= 2;
  const showSearchResults = isActiveSearch && !isSearching;
  const showSearchLoading = isActiveSearch && isSearching;

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg pb-24 lg:pb-0">
        {/* Header skeleton */}
        <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 safe-top">
          <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl" />
              <Skeleton className="h-6 w-24 rounded hidden lg:block" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="w-9 h-9 rounded-full" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-8 w-48 rounded mb-2" />
              <Skeleton className="h-5 w-64 rounded" />
            </div>
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <CrateGridSkeleton count={6} />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pb-24 lg:pb-0">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 safe-top">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <div 
              className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-sonic-dark rounded-xl flex items-center justify-center shadow-glow cursor-pointer hover:scale-105 transition-transform touch-target"
              onClick={() => navigate('/home')}
            >
              <Music className="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
            </div>
            
            <nav className="hidden lg:flex items-center gap-1">
              <Link to="/home" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <HomeIcon className="w-4 h-4" /><span>Home</span>
              </Link>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium">
                <Package className="w-4 h-4" /><span>Crates</span>
              </div>
              <Link to="/studio" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <Palette className="w-4 h-4" /><span>Studio</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-6xl">
        {/* Header Row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">📦 Your Crates</h1>
            <p className="text-base lg:text-lg text-muted-foreground">Organize your music by vibe, mood, or meaning.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="lg" className="gap-2 btn-scale touch-target">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Crate</span>
          </Button>
        </motion.div>

        {/* Search Bar - only show when user has crates */}
        {!isLoading && crates.length > 0 && (
          <>
            <CratesSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              isSearching={isSearching || isExpanding}
              onClear={handleClearSearch}
              placeholder="🔍 Search by vibe, mood, artist... (e.g., 'late night Lagos drive')"
            />
            
            {/* Show interpreted filters from AI */}
            {expandedFilters && (
              <InterpretedFilters
                filters={expandedFilters}
                onRemoveVibe={removeVibe}
                onRemoveScene={removeScene}
                onRemoveTempo={removeTempo}
                onRemoveEnergy={removeEnergy}
              />
            )}
          </>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <CrateGridSkeleton count={6} />
          ) : crates.length === 0 ? (
            <EmptyCratesState onCreateCrate={() => setShowCreateModal(true)} />
          ) : showSearchLoading ? (
            <SearchLoadingState key="loading" />
          ) : showSearchResults ? (
            <CratesSearchResults
              key="results"
              results={searchResults}
              totalTrackCount={totalTrackCount}
              crateCount={crateCount}
              isLimitReached={isLimitReached}
              onClear={handleClearSearch}
              searchQuery={searchQuery}
              expandedFilters={expandedFilters}
            />
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CrateGrid crates={crates} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
      <CreateCrateModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
};

export default Crates;
