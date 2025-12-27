import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCrates } from '@/hooks/use-crates';
import { Music, Loader2, Plus, Home as HomeIcon, Palette, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import CrateGrid from '@/components/crates/CrateGrid';
import CreateCrateModal from '@/components/crates/CreateCrateModal';
import EmptyCratesState from '@/components/crates/EmptyCratesState';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/use-page-title';

const Crates = () => {
  usePageTitle('Your Crates | Music Memory System');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: crates = [], isLoading } = useCrates();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pb-24 lg:pb-0">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <div 
              className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-sonic-dark rounded-xl flex items-center justify-center shadow-glow cursor-pointer hover:scale-105 transition-transform"
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">📦 Your Crates</h1>
            <p className="text-base lg:text-lg text-muted-foreground">Organize your music by vibe, mood, or meaning.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="lg" className="gap-2 btn-scale">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Crate</span>
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your crates...</p>
          </div>
        ) : crates.length === 0 ? (
          <EmptyCratesState onCreateCrate={() => setShowCreateModal(true)} />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CrateGrid crates={crates} />
          </motion.div>
        )}
      </main>

      <BottomNav />
      <CreateCrateModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
};

export default Crates;
