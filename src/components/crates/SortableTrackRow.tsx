import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Music, MoreVertical, Trash2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptics } from '@/hooks/use-haptics';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  track_id: string;
  name?: string | null;
  artist_name?: string | null;
  album_name?: string | null;
  album_art_url?: string | null;
  duration_ms?: number | null;
  bpm?: number | null;
  preview_url?: string | null;
}

interface SortableTrackRowProps {
  track: Track;
  index: number;
  onRemove: (trackId: string, trackName: string) => void;
  formatDuration: (ms: number | undefined) => string;
  currentPreviewId: string | null;
  isPreviewPlaying: boolean;
  onTogglePreview: (trackId: string, previewUrl: string) => void;
}

export function SortableTrackRow({ 
  track, 
  index, 
  onRemove, 
  formatDuration,
  currentPreviewId,
  isPreviewPlaying,
  onTogglePreview
}: SortableTrackRowProps) {
  const isMobile = useIsMobile();
  const { selectionChanged, heavyTap, lightTap, error: errorHaptic } = useHaptics();
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const hasTriggeredDeleteHaptic = useRef(false);

  const isCurrentlyPlaying = currentPreviewId === track.track_id && isPreviewPlaying;
  const hasPreview = !!track.preview_url;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style: React.CSSProperties = {
    transition: isSwiping ? 'none' : transition,
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
  };

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
    hasTriggeredDeleteHaptic.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isSwiping) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Determine if this is a horizontal or vertical swipe
    if (!isHorizontalSwipe.current && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }
    
    // Only handle horizontal swipes (left swipe to delete)
    if (isHorizontalSwipe.current && deltaX < 0) {
      const newSwipeX = Math.max(deltaX, -120);
      setSwipeX(newSwipeX); // Max swipe distance
      
      // Trigger haptic when crossing delete threshold
      if (newSwipeX < -80 && !hasTriggeredDeleteHaptic.current) {
        hasTriggeredDeleteHaptic.current = true;
        heavyTap();
      } else if (newSwipeX >= -80 && hasTriggeredDeleteHaptic.current) {
        hasTriggeredDeleteHaptic.current = false;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsSwiping(false);
    
    // If swiped far enough, trigger delete
    if (swipeX < -80) {
      errorHaptic();
      onRemove(track.track_id, track.name || 'Track');
    }
    
    // Reset swipe position
    setSwipeX(0);
  };

  const handleDragStart = () => {
    selectionChanged();
  };

  const handlePreviewToggle = () => {
    lightTap();
    onTogglePreview(track.track_id, track.preview_url!);
  };

  const deleteProgress = Math.min(Math.abs(swipeX) / 80, 1);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background (revealed on swipe) */}
      {isMobile && (
        <div 
          className="absolute inset-0 bg-destructive flex items-center justify-end pr-6 rounded-xl"
          style={{ opacity: deleteProgress }}
        >
          <Trash2 className="w-6 h-6 text-destructive-foreground" />
        </div>
      )}
      
      <div
        ref={setNodeRef}
        style={{
          ...style,
          touchAction: 'pan-y',
          transform: isMobile && swipeX < 0 
            ? `translateX(${swipeX}px)` 
            : style.transform,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-card/40 rounded-xl border border-border/30 hover:border-border/60 hover:bg-card/60 transition-all group touch-target-lg",
          isDragging && "opacity-70 shadow-lg shadow-primary/10 border-primary/30 z-10 bg-card/80"
        )}
      >
        {/* Drag Handle - touch-action:none to capture drag gestures */}
        <button
          {...attributes}
          {...listeners}
          onPointerDown={(e) => {
            handleDragStart();
            listeners?.onPointerDown?.(e);
          }}
          style={{ touchAction: 'none' }}
          className={cn(
            "p-2 -m-1 rounded cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-all touch-target",
            "lg:opacity-0 lg:group-hover:opacity-100",
            isDragging && "cursor-grabbing opacity-100"
          )}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Position Number */}
        <span className="text-sm text-muted-foreground/70 w-5 text-center font-mono">
          {index + 1}
        </span>

        {/* Album Art */}
        <div className="w-12 h-12 rounded-md bg-secondary/50 shrink-0 overflow-hidden">
          {track.album_art_url ? (
            <img
              src={track.album_art_url}
              alt={track.album_name || 'Album art'}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-5 h-5 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {track.name || 'Unknown Track'}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{track.artist_name || 'Unknown Artist'}</span>
            {track.duration_ms && (
              <>
                <span className="text-border">•</span>
                <span className="shrink-0">{formatDuration(track.duration_ms)}</span>
              </>
            )}
            {track.bpm && (
              <>
                <span className="text-border hidden sm:inline">•</span>
                <span className="shrink-0 hidden sm:inline">{Math.round(track.bpm)} BPM</span>
              </>
            )}
          </div>
        </div>

        {/* Preview Button */}
        {hasPreview && (
          <button
            onClick={handlePreviewToggle}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all touch-target",
              isCurrentlyPlaying
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            aria-label={isCurrentlyPlaying ? "Pause preview" : "Play preview"}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
        )}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 touch-target"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50">
            <DropdownMenuItem
              onClick={() => {
                heavyTap();
                onRemove(track.track_id, track.name || 'Track');
              }}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 touch-target"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove from crate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
