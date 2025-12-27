import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Music, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
}

interface SortableTrackRowProps {
  track: Track;
  index: number;
  onRemove: (trackId: string, trackName: string) => void;
  formatDuration: (ms: number | undefined) => string;
}

export function SortableTrackRow({ 
  track, 
  index, 
  onRemove, 
  formatDuration 
}: SortableTrackRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style: React.CSSProperties = {
    transition,
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: 'pan-y', // Allow vertical scrolling on the row
      }}
      className={cn(
        "flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-card/40 rounded-xl border border-border/30 hover:border-border/60 hover:bg-card/60 transition-all group",
        isDragging && "opacity-70 shadow-lg shadow-primary/10 border-primary/30 z-10 bg-card/80"
      )}
    >
      {/* Drag Handle - touch-action:none to capture drag gestures */}
      <button
        {...attributes}
        {...listeners}
        style={{ touchAction: 'none' }}
        className={cn(
          "p-2 -m-1 rounded cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-all",
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
      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-md bg-secondary/50 shrink-0 overflow-hidden">
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

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50">
          <DropdownMenuItem
            onClick={() => onRemove(track.track_id, track.name || 'Track')}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove from crate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
