import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCrate, useRemoveTrackFromCrate, useDeleteCrate } from '@/hooks/use-crates';
import { Music, Loader2, ArrowLeft, Plus, Trash2, MoreVertical, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import AddTracksToCrateModal from '@/components/crates/AddTracksToCrateModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/use-page-title';

const CrateDetail = () => {
  const { crateId } = useParams<{ crateId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: crate, isLoading } = useCrate(crateId);
  const removeTrack = useRemoveTrackFromCrate();
  const deleteCrate = useDeleteCrate();

  usePageTitle(crate?.name || 'Crate');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleDeleteCrate = async () => {
    if (!crateId) return;
    await deleteCrate.mutateAsync(crateId);
    navigate('/crates', { replace: true });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!crate) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Crate not found</h2>
          <Button onClick={() => navigate('/crates')}>Back to Crates</Button>
        </div>
      </div>
    );
  }

  const existingTrackIds = crate.tracks?.map(t => t.track_id) || [];

  return (
    <div className="min-h-screen gradient-bg pb-24 lg:pb-0">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/crates')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${crate.color}30` }}>
              <span className="text-lg">{crate.emoji}</span>
            </div>
            <span className="font-display font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">{crate.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-4xl">
        {/* Crate Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-border/50 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${crate.color}30` }}>
                <span className="text-3xl">{crate.emoji}</span>
              </div>
              <div>
                <h1 className="font-display text-xl lg:text-2xl font-bold text-foreground">{crate.name}</h1>
                <p className="text-sm text-muted-foreground">{crate.tracks?.length || 0} tracks</p>
                {crate.description && <p className="text-sm text-muted-foreground/70 mt-1">{crate.description}</p>}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />Delete Crate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button onClick={() => setShowAddTracks(true)} className="gap-2">
            <Plus className="w-4 h-4" />Add Tracks
          </Button>
        </div>

        {/* Tracks List */}
        {crate.tracks && crate.tracks.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {crate.tracks.map((track, index) => (
              <div key={track.id} className="flex items-center gap-3 p-3 bg-card/40 rounded-xl border border-border/30 hover:border-border/50 transition-colors group">
                <span className="text-sm text-muted-foreground w-6 text-center">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{track.name || 'Unknown Track'}</p>
                  <p className="text-sm text-muted-foreground truncate">{track.artist_name || 'Unknown Artist'}</p>
                </div>
                {track.bpm && <span className="text-xs text-muted-foreground/70 bg-secondary/50 px-2 py-0.5 rounded">{Math.round(track.bpm)} BPM</span>}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => removeTrack.mutate({ crateId: crate.id, trackId: track.track_id })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="bg-card/40 rounded-2xl p-12 text-center border border-border/30">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No tracks in this crate yet</p>
            <Button onClick={() => setShowAddTracks(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />Add Your First Track
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
      
      <AddTracksToCrateModal open={showAddTracks} onOpenChange={setShowAddTracks} crateId={crateId!} existingTrackIds={existingTrackIds} />
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{crate.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this crate and remove all tracks from it. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCrate} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CrateDetail;
