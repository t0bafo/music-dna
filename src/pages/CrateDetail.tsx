import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCrate, useRemoveTrackFromCrate, useDeleteCrate, useUpdateCrate, useReorderCrateTracks } from '@/hooks/use-crates';
import { useAudioPreview } from '@/hooks/use-audio-preview';
import { 
  Music, Loader2, ArrowLeft, Plus, Trash2, MoreVertical, Package, 
  Share2, Pencil, Clock, Link as LinkIcon, Check, Copy, Sparkles, Search, ArrowRight
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
import SmartSuggestionsModal from '@/components/crates/SmartSuggestionsModal';
import DiscoverByVibeModal from '@/components/crates/DiscoverByVibeModal';
import { SortableTrackRow } from '@/components/crates/SortableTrackRow';
import ExportToSpotifyModal from '@/components/crates/ExportToSpotifyModal';
import { CrateSearchBar } from '@/components/crates/CrateSearchBar';
import { CrateAnalysis } from '@/components/crates/CrateAnalysis';
import { CrateSyncToggle } from '@/components/crates/CrateSyncToggle';
import { LinkPlaylistModal } from '@/components/crates/LinkPlaylistModal';
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
  const queryClient = useQueryClient();
  
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showDiscoverByVibe, setShowDiscoverByVibe] = useState(false);
  const [showLinkPlaylist, setShowLinkPlaylist] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // In-crate search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [bpmFilter, setBpmFilter] = useState<[number, number] | null>(null);
  const [energyFilter, setEnergyFilter] = useState<'low' | 'medium' | 'high' | null>(null);

  const { data: crate, isLoading } = useCrate(crateId);
  const removeTrack = useRemoveTrackFromCrate();
  const deleteCrate = useDeleteCrate();
  const updateCrate = useUpdateCrate();
  const reorderTracks = useReorderCrateTracks();
  
  // Audio preview hook for 30-second previews
  const { currentTrackId: previewTrackId, isPlaying: isPreviewPlaying, toggle: togglePreview } = useAudioPreview();

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

  // Filtered tracks based on search and filters
  const filteredTracks = useMemo(() => {
    return displayTracks.filter(track => {
      // Text search - match name, artist, or album
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = 
          track.name?.toLowerCase().includes(query) ||
          track.artist_name?.toLowerCase().includes(query) ||
          track.album_name?.toLowerCase().includes(query);
        if (!matchesText) return false;
      }
      
      // BPM filter
      if (bpmFilter && track.bpm) {
        if (track.bpm < bpmFilter[0] || track.bpm > bpmFilter[1]) return false;
      }
      
      // Energy filter
      if (energyFilter && track.energy !== null && track.energy !== undefined) {
        const e = track.energy;
        if (energyFilter === 'low' && e > 0.4) return false;
        if (energyFilter === 'medium' && (e < 0.4 || e > 0.7)) return false;
        if (energyFilter === 'high' && e < 0.7) return false;
      }
      
      return true;
    });
  }, [displayTracks, searchQuery, bpmFilter, energyFilter]);

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

  const shareUrl = `${window.location.origin}/crates/${crateId}/share`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast.success('Link copied! 🔗', {
      description: 'Share this link with friends'
    });
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleShareTwitter = () => {
    const text = `Check out my crate "${crate?.name}" on Music DNA!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = `Check out my crate "${crate?.name}" on Music DNA! ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const [pendingRemoval, setPendingRemoval] = useState<{ trackId: string; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

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

  // Calculate total duration with estimation for missing data
  const totalDurationInfo = useMemo(() => {
    if (!crate?.tracks || crate.tracks.length === 0) {
      return { text: '0 min', isEstimated: false };
    }
    
    const tracksWithDuration = crate.tracks.filter(t => t.duration_ms && t.duration_ms > 0);
    const knownDuration = tracksWithDuration.reduce((sum, t) => sum + t.duration_ms!, 0);
    const missingCount = crate.tracks.length - tracksWithDuration.length;
    
    // Estimate missing durations (use avg of known, or 3 min default)
    const avgDuration = tracksWithDuration.length > 0 
      ? knownDuration / tracksWithDuration.length 
      : 180000;
    const estimatedTotal = knownDuration + (missingCount * avgDuration);
    
    const totalMinutes = Math.floor(estimatedTotal / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const text = hours > 0 ? `${hours}h ${minutes}min` : `${totalMinutes} min`;
    
    return { 
      text, 
      isEstimated: missingCount > 0,
      missingCount 
    };
  }, [crate?.tracks]);

  const totalDuration = totalDurationInfo.text;

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
                      {totalDurationInfo.isEstimated && (
                        <span className="text-amber-500 text-xs">(~est)</span>
                      )}
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
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Tracks
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-card/95 backdrop-blur-xl border-border/50">
              <DropdownMenuItem 
                onClick={() => setShowSmartSuggestions(true)}
                className="flex items-start gap-3 p-3 cursor-pointer focus:bg-primary/10"
              >
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-foreground">Smart Suggestions</div>
                  <div className="text-xs text-muted-foreground">Get tracks from your library</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDiscoverByVibe(true)}
                className="flex items-start gap-3 p-3 cursor-pointer focus:bg-primary/10"
              >
                <Search className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-foreground">Filter by Vibe</div>
                  <div className="text-xs text-muted-foreground">Search by BPM, energy, mood</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowAddTracks(true)}
                className="flex items-start gap-3 p-3 cursor-pointer focus:bg-primary/10"
              >
                <Plus className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-foreground">Search Spotify</div>
                  <div className="text-xs text-muted-foreground">Find any song manually</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Sync Toggle */}
            {crate && (
              <CrateSyncToggle
                crate={{
                  id: crate.id,
                  spotify_playlist_id: crate.spotify_playlist_id ?? null,
                  sync_enabled: crate.sync_enabled ?? false,
                  sync_status: crate.sync_status ?? null,
                  last_synced_at: crate.last_synced_at ?? null,
                  sync_error: crate.sync_error ?? null,
                }}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['crate', crateId] })}
                onLinkPlaylist={() => setShowLinkPlaylist(true)}
              />
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setShowExportModal(true)} 
              className="gap-2"
              disabled={displayTracks.length === 0}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Export
            </Button>
            <Button variant="outline" onClick={() => setShowShareModal(true)} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Crate Analysis Section */}
        <CrateAnalysis tracks={displayTracks} />

        {/* Tracks List */}
        {displayTracks.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* In-Crate Search Bar - show when 3+ tracks */}
            {displayTracks.length >= 3 && (
              <CrateSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                bpmFilter={bpmFilter}
                onBpmFilterChange={setBpmFilter}
                energyFilter={energyFilter}
                onEnergyFilterChange={setEnergyFilter}
                filteredCount={filteredTracks.length}
                totalCount={displayTracks.length}
              />
            )}
            
            {/* No results message */}
            {filteredTracks.length === 0 && (searchQuery || bpmFilter || energyFilter) ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No tracks match your filters</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
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
                    items={filteredTracks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredTracks.map((track, index) => (
                      <SortableTrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        onRemove={handleRemoveTrack}
                        formatDuration={formatDuration}
                        currentPreviewId={previewTrackId}
                        isPreviewPlaying={isPreviewPlaying}
                        onTogglePreview={togglePreview}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </motion.div>
        ) : (
          /* Empty State - Action Cards */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🎵</div>
              <h3 className="font-display text-lg font-semibold mb-1">Your Crate is empty!</h3>
              <p className="text-sm text-muted-foreground">Quick ways to fill it:</p>
            </div>

            {/* Smart Suggestions Card */}
            <button
              onClick={() => setShowSmartSuggestions(true)}
              className="w-full bg-card/60 hover:bg-card/80 backdrop-blur-sm rounded-xl p-5 border border-border/40 hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-0.5">Try Smart Suggestions</h4>
                  <p className="text-sm text-muted-foreground">Get tracks from your library that match this vibe</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </button>

            {/* Filter Library Card */}
            <button
              onClick={() => setShowDiscoverByVibe(true)}
              className="w-full bg-card/60 hover:bg-card/80 backdrop-blur-sm rounded-xl p-5 border border-border/40 hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-0.5">Filter My Library by Vibe</h4>
                  <p className="text-sm text-muted-foreground">Search by BPM, energy, mood and more</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </button>

            {/* Manual Add Card */}
            <button
              onClick={() => setShowAddTracks(true)}
              className="w-full bg-card/60 hover:bg-card/80 backdrop-blur-sm rounded-xl p-5 border border-border/40 hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-0.5">Add Tracks Manually</h4>
                  <p className="text-sm text-muted-foreground">Search any song on Spotify</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </button>
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

      {/* Smart Suggestions Modal */}
      <SmartSuggestionsModal
        open={showSmartSuggestions}
        onOpenChange={setShowSmartSuggestions}
        crate={crate}
      />

      {/* Discover by Vibe Modal */}
      <DiscoverByVibeModal
        open={showDiscoverByVibe}
        onOpenChange={setShowDiscoverByVibe}
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

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="w-[95vw] max-w-[600px] bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <span className="text-2xl">{crate.emoji}</span>
              Share "{crate.name}"
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Anyone with this link can view this crate (but not edit it).
            </p>

            {/* Copy Link Section */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-xs text-muted-foreground break-all leading-relaxed">
                {shareUrl}
              </div>
              <Button
                onClick={handleCopyLink}
                variant={linkCopied ? "default" : "outline"}
                className={cn("gap-2 shrink-0 w-full sm:w-auto sm:min-w-[104px]", linkCopied && "bg-primary text-primary-foreground")}
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-3">Share on:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleShareTwitter}
                  className="w-full gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleShareWhatsApp}
                  className="w-full gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export to Spotify Modal */}
      <ExportToSpotifyModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        crate={crate}
        tracks={displayTracks}
      />
    </div>
  );
};

export default CrateDetail;
