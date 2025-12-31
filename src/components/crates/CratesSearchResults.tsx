import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Plus, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { GroupedSearchResult, SearchableTrack } from '@/hooks/use-crates-search';
import { useAudioPreview } from '@/hooks/use-audio-preview';
import { useCrates, useAddTracksToCrate } from '@/hooks/use-crates';
import { TrackToAdd } from '@/lib/crates-api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface CratesSearchResultsProps {
  results: GroupedSearchResult[];
  totalTrackCount: number;
  crateCount: number;
  isLimitReached: boolean;
  onClear: () => void;
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
}

function SearchTrackRow({ track, currentTrackId, isPlaying, onTogglePreview }: SearchTrackRowProps) {
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { data: crates = [] } = useCrates();
  const addTracksMutation = useAddTracksToCrate();

  const isCurrentlyPlaying = currentTrackId === track.track_id && isPlaying;
  const hasPreview = !!track.preview_url;

  const handleAddToCrate = async (crateId: string) => {
    setAddingTo(crateId);
    
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
        crateId,
        tracks: [trackData],
      });
      
      const crate = crates.find(c => c.id === crateId);
      toast.success(`Added "${track.name}" to ${crate?.emoji || '📦'} ${crate?.name}`);
      setJustAdded(crateId);
      setTimeout(() => setJustAdded(null), 2000);
    } catch (error) {
      toast.error('Failed to add track to crate');
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 
                 transition-all hover:scale-[1.01] hover:shadow-sm group"
    >
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
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

        {/* Add to Crate Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-card/95 backdrop-blur-xl border-border/50"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground truncate">
                Add to crate:
              </p>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[200px] overflow-y-auto">
              {crates.map((crate) => (
                <DropdownMenuItem
                  key={crate.id}
                  onClick={() => handleAddToCrate(crate.id)}
                  disabled={addingTo === crate.id}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-lg">{crate.emoji || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{crate.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {crate.track_count} track{crate.track_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {addingTo === crate.id && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
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
}

function CrateGroup({ 
  group, 
  initialShowCount = 3, 
  currentTrackId, 
  isPlaying, 
  onTogglePreview 
}: CrateGroupProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  
  const visibleTracks = expanded ? group.tracks : group.tracks.slice(0, initialShowCount);
  const hasMore = group.tracks.length > initialShowCount;

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
}: CratesSearchResultsProps) {
  const { currentTrackId, isPlaying, toggle, stop } = useAudioPreview();

  const handleTogglePreview = (trackId: string, previewUrl: string) => {
    toggle(trackId, previewUrl);
  };

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
            <li>• Crate name: "Late Night"</li>
          </ul>
          <Button variant="outline" onClick={onClear}>
            Clear Search
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[900px] mx-auto"
    >
      <div 
        className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-lg 
                   max-h-[600px] overflow-y-auto"
        role="region"
        aria-live="polite"
        aria-label={`Found ${totalTrackCount} tracks across ${crateCount} crates`}
      >
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
          <p className="text-foreground">
            <span className="font-semibold">Found {totalTrackCount}</span>
            {' '}
            <span className="text-muted-foreground">
              {totalTrackCount === 1 ? 'track' : 'tracks'} across {crateCount} {crateCount === 1 ? 'crate' : 'crates'}
            </span>
          </p>
          {isLimitReached && (
            <p className="text-xs text-muted-foreground">
              Showing first 50 results. Try a more specific search.
            </p>
          )}
        </div>

        {/* Grouped Results */}
        <div className="space-y-8">
          {results.map((group, index) => (
            <div key={group.crate_id}>
              <CrateGroup
                group={group}
                currentTrackId={currentTrackId}
                isPlaying={isPlaying}
                onTogglePreview={handleTogglePreview}
              />
              {index < results.length - 1 && (
                <div className="border-t border-border/30 mt-6" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
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
