import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCrate, useRemoveTrackFromCrate, useDeleteCrate, useUpdateCrate, useReorderCrateTracks } from '@/hooks/use-crates';
import { 
  Music, Loader2, ArrowLeft, Plus, Trash2, MoreVertical, Package, 
  Share2, Pencil, Clock, Link as LinkIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import AddTracksToCrateModal from '@/components/crates/AddTracksToCrateModal';
import { SortableTrackRow } from '@/components/crates/SortableTrackRow';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CRATE_EMOJIS, CRATE_COLORS } from '@/lib/crates-api';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/use-page-title';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const CrateDetail = () => {
  const { crateId } = useParams<{ crateId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: crate, isLoading } = useCrate(crateId);
  const removeTrack = useRemoveTrackFromCrate();
  const deleteCrate = useDeleteCrate();
  const updateCrate = useUpdateCrate();
  const reorderTracks = useReorderCrateTracks();

  const isMobile = useIsMobile();

  // Drag and drop sensors - optimized for mobile scrolling
  // NOTE: On mobile browsers, Pointer events are used for touch too.
  // Using a long-press delay on PointerSensor prevents DnD from hijacking scroll.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isMobile
        ? {
            delay: 600,
            tolerance: 10,
          }
        : {
            distance: 8,
          },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Local tracks state for optimistic reordering
  const [localTracks, setLocalTracks] = useState<typeof crate.tracks | null>(null);
  
  // Sync local tracks with server data
  useEffect(() => {
    if (crate?.tracks) {
      setLocalTracks(crate.tracks);
    }
  }, [crate?.tracks]);

  const displayTracks = localTracks || crate?.tracks || [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !crate) return;
    
    const oldIndex = displayTracks.findIndex(t => t.id === active.id);
    const newIndex = displayTracks.findIndex(t => t.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Optimistic update
    const reordered = arrayMove(displayTracks, oldIndex, newIndex);
    setLocalTracks(reordered);
    
    // Persist to database
    const trackIds = reordered.map(t => t.track_id);
    reorderTracks.mutate({ crateId: crate.id, trackIds });
  };

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  usePageTitle(crate?.name || 'Crate');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Initialize edit form when crate loads
  useEffect(() => {
    if (crate) {
      setEditName(crate.name);
      setEditDescription(crate.description || '');
      setEditEmoji(crate.emoji);
      setEditColor(crate.color);
    }
  }, [crate]);

  const handleDeleteCrate = async () => {
    if (!crateId) return;
    await deleteCrate.mutateAsync(crateId);
    navigate('/crates', { replace: true });
  };

  const handleEditSubmit = async () => {
    if (!crateId || !editName.trim()) return;
    await updateCrate.mutateAsync({
      crateId,
      name: editName.trim(),
      description: editDescription.trim() || null,
      emoji: editEmoji,
      color: editColor
    });
    setShowEditDialog(false);
  };

  const handleShareCrate = () => {
    const shareUrl = `${window.location.origin}/crates/${crateId}/share`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied! 🔗', {
      description: 'Share this link with friends'
    });
  };

  const [pendingRemoval, setPendingRemoval] = useState<{ trackId: string; timeoutId: NodeJS.Timeout } | null>(null);

  const handleRemoveTrack = (trackId: string, trackName: string) => {
    // Cancel any pending removal
    if (pendingRemoval) {
      clearTimeout(pendingRemoval.timeoutId);
    }

    // Set up delayed removal
    const timeoutId = setTimeout(() => {
      removeTrack.mutate({ crateId: crate!.id, trackId });
      setPendingRemoval(null);
    }, 5000);

    setPendingRemoval({ trackId, timeoutId });

    toast('Track removed', {
      description: `"${trackName}" removed from crate`,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timeoutId);
          setPendingRemoval(null);
          toast.success('Track restored');
        }
      },
      duration: 5000
    });
  };

  // Calculate total duration
  const totalDuration = useMemo(() => {
    if (!crate?.tracks) return '0 min';
    const totalMs = crate.tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${totalMinutes} min`;
  }, [crate?.tracks]);

  // Format track duration
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
            <span className="text-sm text-muted-foreground">Back to Crates</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-4xl">
        {/* Crate Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-border/50 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Large Emoji */}
            <div 
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ 
                backgroundColor: `${crate.color}25`,
                borderColor: crate.color,
                borderWidth: 2
              }}
            >
              <span className="text-4xl lg:text-5xl">{crate.emoji}</span>
            </div>

            {/* Crate Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1">
                    {crate.name}
                  </h1>
                  {crate.description && (
                    <p className="text-muted-foreground text-sm lg:text-base mb-3">
                      {crate.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Music className="w-4 h-4" />
                      {crate.tracks?.length || 0} tracks
                    </span>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {totalDuration}
                    </span>
                  </div>
                </div>

                {/* Edit Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 shrink-0"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions Row */}
        <div className="flex justify-between items-center mb-6">
          <Button onClick={() => setShowAddTracks(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Tracks
          </Button>
          
          <Button variant="outline" onClick={handleShareCrate} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share Crate
          </Button>
        </div>

        {/* Tracks List */}
        {displayTracks.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div
              className={cn(
                "space-y-2",
                // Mobile: make the list its own scroll container for crisp native scrolling
                "max-h-[60vh] overflow-y-auto overscroll-contain",
                // Desktop: allow the page to scroll naturally
                "lg:max-h-none lg:overflow-visible"
              )}
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                transform: 'translateZ(0)',
                willChange: 'scroll-position',
              }}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayTracks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {displayTracks.map((track, index) => (
                    <SortableTrackRow
                      key={track.id}
                      track={track}
                      index={index}
                      onRemove={handleRemoveTrack}
                      formatDuration={formatDuration}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/40 rounded-2xl p-12 text-center border border-border/30"
          >
            <div className="text-5xl mb-4">🎵</div>
            <p className="text-muted-foreground mb-4">No tracks in this crate yet</p>
            <Button onClick={() => setShowAddTracks(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Track
            </Button>
          </motion.div>
        )}

        {/* Danger Zone */}
        <div className="mt-12 pt-6 border-t border-border/30">
          <Button 
            variant="ghost" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Crate
          </Button>
        </div>
      </main>

      <BottomNav />
      
      {/* Add Tracks Modal */}
      <AddTracksToCrateModal 
        open={showAddTracks} 
        onOpenChange={setShowAddTracks} 
        crateId={crateId!}
        crateName={crate.name}
        existingTrackIds={existingTrackIds} 
      />
      
      {/* Edit Crate Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Crate</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 mt-2">
            {/* Emoji Picker */}
            <div className="space-y-2">
              <Label>Emoji:</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors border border-border/50"
                >
                  <span className="text-2xl">{editEmoji}</span>
                  <span className="text-sm text-muted-foreground">Click to change</span>
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 p-3 bg-card/95 backdrop-blur-xl rounded-xl border border-border/50 shadow-xl z-50 animate-fade-in">
                    <div className="grid grid-cols-6 gap-2">
                      {CRATE_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setEditEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110",
                            editEmoji === emoji
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "hover:bg-secondary"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Crate Name:</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Late Night Drives"
                maxLength={50}
                className="bg-secondary/30"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (optional):</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What's this crate for?"
                maxLength={200}
                rows={2}
                className="bg-secondary/30 resize-none"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color:</Label>
              <div className="flex gap-3">
                {CRATE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all",
                      editColor === color
                        ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleEditSubmit}
                disabled={!editName.trim() || updateCrate.isPending}
              >
                {updateCrate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{crate.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this crate and remove all tracks from it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCrate} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CrateDetail;
