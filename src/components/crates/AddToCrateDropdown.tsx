import { useState } from 'react';
import { Plus, Loader2, Music, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCrates, useAddTracksToCrate } from '@/hooks/use-crates';
import { TrackToAdd } from '@/lib/crates-api';
import { toast } from 'sonner';

interface AddToCrateDropdownProps {
  track: {
    id: string;
    name: string;
    artist: string;
    albumName?: string;
    albumImage?: string;
    duration_ms?: number;
    popularity?: number;
    tempo?: number;
    energy?: number;
    danceability?: number;
    valence?: number;
    preview_url?: string | null;
  };
  onCreateNew?: () => void;
  variant?: 'default' | 'compact' | 'outline';
  className?: string;
}

const AddToCrateDropdown = ({ 
  track, 
  onCreateNew,
  variant = 'default',
  className = ''
}: AddToCrateDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  
  const { data: crates = [] } = useCrates();
  const addTracksMutation = useAddTracksToCrate();

  const handleAddToCrate = async (crateId: string) => {
    setAddingTo(crateId);
    
    try {
      const trackData: TrackToAdd = {
        track_id: track.id,
        name: track.name,
        artist_name: track.artist,
        album_name: track.albumName || '',
        album_art_url: track.albumImage || '',
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        bpm: track.tempo,
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
      setOpen(false);
    } catch (error) {
      toast.error('Failed to add track to crate');
    } finally {
      setAddingTo(null);
    }
  };

  const buttonContent = variant === 'compact' ? (
    <Plus className="w-4 h-4" />
  ) : (
    <>
      <Plus className="w-4 h-4 mr-1" />
      <span className="hidden sm:inline">Add to Crate</span>
    </>
  );

  const buttonVariant = variant === 'outline' ? 'outline' : 'ghost';
  const buttonClass = variant === 'outline' 
    ? 'border-primary/30 text-primary hover:bg-primary/10 hover:border-primary'
    : 'text-primary hover:text-primary hover:bg-primary/10';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant}
          size="sm"
          className={`${buttonClass} ${className}`}
        >
          {buttonContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-card/95 backdrop-blur-xl border-border/50"
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground truncate">
            Add "{track.name}" to:
          </p>
        </div>
        <DropdownMenuSeparator />
        
        {crates.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No crates yet
            </p>
            {onCreateNew && (
              <Button 
                size="sm" 
                onClick={() => {
                  setOpen(false);
                  onCreateNew();
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create First Crate
              </Button>
            )}
          </div>
        ) : (
          <>
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
            
            {onCreateNew && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                  className="cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2 text-primary" />
                  <span className="text-primary font-medium">Create New Crate</span>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToCrateDropdown;
