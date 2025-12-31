import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Plus, Check, ChevronDown, ChevronUp, Loader2, Music2, Square, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { GroupedSearchResult, SearchableTrack } from '@/hooks/use-crates-search';
import { useAudioPreview } from '@/hooks/use-audio-preview';
import { useCrates, useAddTracksToCrate } from '@/hooks/use-crates';
import { TrackToAdd, Crate } from '@/lib/crates-api';
import { toast } from 'sonner';
import { BulkActionsToolbar } from '@/components/search/BulkActionsToolbar';
import { TargetCrateSelector, useTargetCrate } from '@/components/search/TargetCrateSelector';
import { SelectionTray } from '@/components/search/SelectionTray';
import { CreateCrateFromSearchModal } from '@/components/crates/CreateCrateFromSearchModal';
import { SearchFilters } from '@/lib/vibe-search-types';
import { cn } from '@/lib/utils';

interface CratesSearchResultsProps {
  results: GroupedSearchResult[];
  totalTrackCount: number;
  crateCount: number;
  isLimitReached: boolean;
  onClear: () => void;
  searchQuery: string;
  expandedFilters?: SearchFilters | null;
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface SearchTrackRowProps {
  track: SearchableTrack;
  currentTrackId: string | null;
  isPlaying: boolean;
  onTogglePreview: (trackId: string, previewUrl: string) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  showCheckbox: boolean;
  targetCrate: Crate | null;
  onQuickAdd: () => void;
  isAdding: boolean;
  matchReasons?: string[];
}

function SearchTrackRow({ 
  track, 
  currentTrackId, 
  isPlaying, 
  onTogglePreview,
  isSelected,
  onToggleSelect,
  showCheckbox,
  targetCrate,
  onQuickAdd,
  isAdding,
  matchReasons,
}: SearchTrackRowProps) {
  const [justAdded, setJustAdded] = useState(false);
  const isCurrentlyPlaying = currentTrackId === track.track_id && isPlaying;
  const hasPreview = !!track.preview_url;

  const handleQuickAdd = async () => {
    await onQuickAdd();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const openInSpotify = () => {
    // Try Spotify app first, then web player
    const spotifyUri = `spotify:track:${track.track_id}`;
    const webUrl = `https://open.spotify.com/track/${track.track_id}`;
    
    // Create an invisible link to try opening the app
    const a = document.createElement('a');
    a.href = spotifyUri;
    a.click();
    
    // Fallback to web after a short delay
    setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-sm group",
        isSelected ? "bg-primary/10 border border-primary/30" : "bg-background/50 hover:bg-background/80"
      )}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <button
          onClick={onToggleSelect}
          className="w-5 h-5 shrink-0 flex items-center justify-center"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      )}

      {/* Album Art */}
      <div className="relative w-[60px] h-[60px] flex-shrink-0">
        {track.album_art_url ? (
          <img
            src={track.album_art_url}
            alt={track.album_name || 'Album art'}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
            <span className="text-2xl">🎵</span>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{track.name}</p>
        <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
        <p className="text-xs text-muted-foreground/60">{formatDuration(track.duration_ms)}</p>
        
        {/* Match reasons */}
        {matchReasons && matchReasons.length > 0 && (
          <p className="text-xs text-muted-foreground/50 mt-1 truncate">
            matches: {matchReasons.join(', ')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        {/* Preview Button */}
        {hasPreview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePreview(track.track_id, track.preview_url!)}
            className="h-8 w-8 p-0 rounded-full"
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Quick Add Button */}
        {targetCrate && (
          <Button
            variant={justAdded ? "secondary" : "default"}
            size="sm"
            onClick={handleQuickAdd}
            disabled={isAdding || justAdded}
            className="h-8 gap-1.5"
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </Button>
        )}

        {/* Open in Spotify */}
        <Button
          variant="outline"
          size="sm"
          onClick={openInSpotify}
          className="h-8 gap-1.5"
        >
          <Music2 className="w-4 h-4" />
          <span className="hidden sm:inline">Spotify</span>
        </Button>
      </div>
    </motion.div>
  );
}

interface CrateGroupProps {
  group: GroupedSearchResult;
  initialShowCount?: number;
  currentTrackId: string | null;
  isPlaying: boolean;
  onTogglePreview: (trackId: string, previewUrl: string) => void;
  selectedTrackIds: Set<string>;
  onToggleTrackSelect: (trackId: string) => void;
  showCheckboxes: boolean;
  targetCrate: Crate | null;
  onQuickAdd: (track: SearchableTrack) => Promise<void>;
  addingTrackId: string | null;
  expandedFilters?: SearchFilters | null;
}

function CrateGroup({ 
  group, 
  initialShowCount = 3, 
  currentTrackId, 
  isPlaying, 
  onTogglePreview,
  selectedTrackIds,
  onToggleTrackSelect,
  showCheckboxes,
  targetCrate,
  onQuickAdd,
  addingTrackId,
  expandedFilters,
}: CrateGroupProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  
  const visibleTracks = expanded ? group.tracks : group.tracks.slice(0, initialShowCount);
  const hasMore = group.tracks.length > initialShowCount;

  // Build match reasons from expanded filters
  const getMatchReasons = (track: SearchableTrack): string[] => {
    if (!expandedFilters) return [];
    const reasons: string[] = [];
    
    if (expandedFilters.vibes) {
      const matchingVibes = expandedFilters.vibes.filter(vibe => 
        track.name?.toLowerCase().includes(vibe.toLowerCase()) ||
        group.crate_name?.toLowerCase().includes(vibe.toLowerCase())
      );
      reasons.push(...matchingVibes);
    }
    
    if (expandedFilters.scenes) {
      const matchingScenes = expandedFilters.scenes.filter(scene =>
        group.crate_name?.toLowerCase().includes(scene.toLowerCase())
      );
      reasons.push(...matchingScenes);
    }
    
    return reasons.slice(0, 3);
  };

  return (
    <div className="space-y-3">
      {/* Crate Header */}
      <button
        onClick={() => navigate(`/crates/${group.crate_id}`)}
        className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-xl">{group.crate_emoji}</span>
        <span className="font-semibold text-foreground">
          From "{group.crate_name}"
        </span>
        <span className="text-sm text-muted-foreground">
          ({group.tracks.length} track{group.tracks.length !== 1 ? 's' : ''})
        </span>
      </button>

      {/* Tracks */}
      <div className="space-y-2">
        {visibleTracks.map((track) => (
          <SearchTrackRow
            key={`${group.crate_id}-${track.track_id}`}
            track={track}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onTogglePreview={onTogglePreview}
            isSelected={selectedTrackIds.has(track.track_id)}
            onToggleSelect={() => onToggleTrackSelect(track.track_id)}
            showCheckbox={showCheckboxes}
            targetCrate={targetCrate}
            onQuickAdd={() => onQuickAdd(track)}
            isAdding={addingTrackId === track.track_id}
            matchReasons={getMatchReasons(track)}
          />
        ))}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-primary hover:text-primary hover:bg-primary/10"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show all {group.tracks.length} tracks from this crate
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export function CratesSearchResults({
  results,
  totalTrackCount,
  crateCount,
  isLimitReached,
  onClear,
  searchQuery,
  expandedFilters,
}: CratesSearchResultsProps) {
  const navigate = useNavigate();
  const { currentTrackId, isPlaying, toggle, stop } = useAudioPreview();
  const { data: crates = [] } = useCrates();
  const addTracksMutation = useAddTracksToCrate();
  
  // Selection state
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  
  // Target crate state
  const { targetCrateId, setTargetCrateId } = useTargetCrate();
  const targetCrate = crates.find(c => c.id === targetCrateId) || null;
  
  // Create crate modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateFromSearchModal, setShowCreateFromSearchModal] = useState(false);
  
  // Track being added
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  // Get all tracks flat
  const allTracks = results.flatMap(group => group.tracks);

  const handleTogglePreview = (trackId: string, previewUrl: string) => {
    toggle(trackId, previewUrl);
  };

  const toggleTrackSelect = (trackId: string) => {
    setShowCheckboxes(true);
    setSelectedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setShowCheckboxes(true);
    setSelectedTrackIds(new Set(allTracks.map(t => t.track_id)));
  };

  const clearSelection = () => {
    setSelectedTrackIds(new Set());
    setShowCheckboxes(false);
  };

  const handleQuickAdd = async (track: SearchableTrack) => {
    if (!targetCrateId) return;
    
    setAddingTrackId(track.track_id);
    
    try {
      const trackData: TrackToAdd = {
        track_id: track.track_id,
        name: track.name || '',
        artist_name: track.artist_name || '',
        album_name: track.album_name || '',
        album_art_url: track.album_art_url || '',
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        bpm: track.bpm,
        energy: track.energy,
        danceability: track.danceability,
        valence: track.valence,
        preview_url: track.preview_url,
      };

      await addTracksMutation.mutateAsync({
        crateId: targetCrateId,
        tracks: [trackData],
      });
      
      toast.success(`Added "${track.name}" to ${targetCrate?.emoji || '📦'} ${targetCrate?.name}`, {
        action: {
          label: 'View Crate',
          onClick: () => navigate(`/crates/${targetCrateId}`),
        },
      });
    } catch (error) {
      toast.error('Failed to add track');
    } finally {
      setAddingTrackId(null);
    }
  };

  const handleBulkAddToCrate = async () => {
    if (!targetCrateId || selectedTrackIds.size === 0) return;
    
    setIsBulkAdding(true);
    
    try {
      const selectedTracks = allTracks.filter(t => selectedTrackIds.has(t.track_id));
      const tracksToAdd: TrackToAdd[] = selectedTracks.map(track => ({
        track_id: track.track_id,
        name: track.name || '',
        artist_name: track.artist_name || '',
        album_name: track.album_name || '',
        album_art_url: track.album_art_url || '',
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        bpm: track.bpm,
        energy: track.energy,
        danceability: track.danceability,
        valence: track.valence,
        preview_url: track.preview_url,
      }));

      await addTracksMutation.mutateAsync({
        crateId: targetCrateId,
        tracks: tracksToAdd,
      });
      
      toast.success(`Added ${selectedTracks.length} tracks to ${targetCrate?.emoji || '📦'} ${targetCrate?.name}`, {
        action: {
          label: 'View Crate',
          onClick: () => navigate(`/crates/${targetCrateId}`),
        },
      });
      
      clearSelection();
    } catch (error) {
      toast.error('Failed to add tracks');
    } finally {
      setIsBulkAdding(false);
    }
  };

  const handleOpenSelectedInSpotify = () => {
    if (selectedTrackIds.size === 0) return;
    
    const firstTrackId = Array.from(selectedTrackIds)[0];
    const webUrl = `https://open.spotify.com/track/${firstTrackId}`;
    window.open(webUrl, '_blank');
    
    if (selectedTrackIds.size > 1) {
      toast.info(`Opening first track. ${selectedTrackIds.size - 1} more selected.`);
    }
  };

  const handleCreateFromSearchSuccess = (crateId: string) => {
    setTargetCrateId(crateId);
    clearSelection();
    navigate(`/crates/${crateId}`);
  };

  const selectedTracks = allTracks.filter(t => selectedTrackIds.has(t.track_id));
  const isAllSelected = selectedTrackIds.size === allTracks.length && allTracks.length > 0;

  // Empty state
  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[900px] mx-auto"
      >
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-lg">
          <span className="text-4xl mb-4 block">😕</span>
          <h3 className="text-lg font-semibold text-foreground mb-2">No tracks found</h3>
          <p className="text-muted-foreground mb-4">Try searching for:</p>
          <ul className="text-sm text-muted-foreground space-y-1 mb-6">
            <li>• Track name: "Midnight Drive"</li>
            <li>• Artist name: "Burna Boy"</li>
            <li>• Vibe: "late night Lagos drive"</li>
          </ul>
          <Button variant="outline" onClick={onClear}>
            Clear Search
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[900px] mx-auto"
      >
        {/* Target Crate Selector */}
        <TargetCrateSelector
          selectedCrateId={targetCrateId}
          onSelectCrate={setTargetCrateId}
          onCreateNew={() => setShowCreateModal(true)}
        />

        <div 
          className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-lg mt-4 max-h-[600px] overflow-y-auto"
          role="region"
          aria-live="polite"
          aria-label={`Found ${totalTrackCount} tracks across ${crateCount} crates`}
        >
          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            totalResults={totalTrackCount}
            crateCount={crateCount}
            selectedCount={selectedTrackIds.size}
            isAllSelected={isAllSelected}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
          />

          {/* Results Limit Warning */}
          {isLimitReached && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Showing first 50 results. Try a more specific search.
            </p>
          )}

          {/* Grouped Results */}
          <div className="space-y-8 mt-4">
            {results.map((group, index) => (
              <div key={group.crate_id}>
                <CrateGroup
                  group={group}
                  currentTrackId={currentTrackId}
                  isPlaying={isPlaying}
                  onTogglePreview={handleTogglePreview}
                  selectedTrackIds={selectedTrackIds}
                  onToggleTrackSelect={toggleTrackSelect}
                  showCheckboxes={showCheckboxes}
                  targetCrate={targetCrate}
                  onQuickAdd={handleQuickAdd}
                  addingTrackId={addingTrackId}
                  expandedFilters={expandedFilters}
                />
                {index < results.length - 1 && (
                  <div className="border-t border-border/30 mt-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Selection Tray */}
      <SelectionTray
        selectedCount={selectedTrackIds.size}
        targetCrate={targetCrate}
        isAdding={isBulkAdding}
        onAddToCrate={handleBulkAddToCrate}
        onSaveAsNewCrate={() => setShowCreateFromSearchModal(true)}
        onOpenInSpotify={handleOpenSelectedInSpotify}
        onClear={clearSelection}
      />

      {/* Create Crate from Search Modal */}
      <CreateCrateFromSearchModal
        open={showCreateFromSearchModal}
        onOpenChange={setShowCreateFromSearchModal}
        selectedTracks={selectedTracks}
        searchQuery={searchQuery}
        expandedFilters={expandedFilters || null}
        onSuccess={handleCreateFromSearchSuccess}
      />
    </>
  );
}

export function SearchLoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[900px] mx-auto"
    >
      <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-lg">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
        <p className="text-muted-foreground">Searching your crates...</p>
      </div>
    </motion.div>
  );
}
