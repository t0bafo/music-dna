import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Music } from 'lucide-react';
import { CRATE_EMOJIS, CRATE_COLORS, TrackToAdd } from '@/lib/crates-api';
import { useCreateCrate, useAddTracksToCrate } from '@/hooks/use-crates';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TrackInput {
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
}

interface CreateCrateWithTracksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracks: TrackInput[];
  defaultName?: string;
  defaultDescription?: string;
}

const CreateCrateWithTracksModal = ({ 
  open, 
  onOpenChange, 
  tracks,
  defaultName = 'My Signature Sound',
  defaultDescription = ''
}: CreateCrateWithTracksModalProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [selectedEmoji, setSelectedEmoji] = useState('🎵');
  const [selectedColor, setSelectedColor] = useState('#00ff87');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createCrate = useCreateCrate();
  const addTracks = useAddTracksToCrate();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(defaultName);
      setDescription(defaultDescription);
      setSelectedEmoji('🎵');
      setSelectedColor('#00ff87');
      setError('');
    }
  }, [open, defaultName, defaultDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Crate name is required');
      return;
    }

    setIsCreating(true);

    try {
      // Create the crate
      const newCrate = await createCrate.mutateAsync({
        name: trimmedName,
        description: description.trim() || null,
        emoji: selectedEmoji,
        color: selectedColor
      });

      // Add tracks to crate
      if (tracks.length > 0) {
        const tracksToAdd: TrackToAdd[] = tracks.map(t => ({
          track_id: t.id,
          name: t.name,
          artist_name: t.artist,
          album_name: t.albumName || '',
          album_art_url: t.albumImage || '',
          duration_ms: t.duration_ms,
          popularity: t.popularity,
          bpm: t.tempo,
          energy: t.energy,
          danceability: t.danceability,
          valence: t.valence,
          preview_url: t.preview_url,
        }));

        await addTracks.mutateAsync({
          crateId: newCrate.id,
          tracks: tracksToAdd,
        });
      }

      toast.success(`Created "${trimmedName}" with ${tracks.length} track${tracks.length !== 1 ? 's' : ''}!`);
      onOpenChange(false);
      navigate(`/crates/${newCrate.id}`);
    } catch (err) {
      setError('Failed to create crate. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Create Crate with {tracks.length} Track{tracks.length !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Track Preview */}
          <div className="p-3 bg-secondary/30 rounded-lg border border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Tracks to add:</p>
            <div className="flex flex-wrap gap-2">
              {tracks.slice(0, 5).map((track) => (
                <div 
                  key={track.id}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/50"
                >
                  {track.albumImage ? (
                    <img src={track.albumImage} alt="" className="w-5 h-5 rounded" />
                  ) : (
                    <Music className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-xs truncate max-w-[100px]">{track.name}</span>
                </div>
              ))}
              {tracks.length > 5 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{tracks.length - 5} more
                </span>
              )}
            </div>
          </div>

          {/* Emoji Picker */}
          <div className="space-y-2">
            <Label>Emoji:</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors border border-border/50"
              >
                <span className="text-2xl">{selectedEmoji}</span>
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
                          setSelectedEmoji(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110",
                          selectedEmoji === emoji
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
            <Label htmlFor="name">Crate Name:</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., My Signature Sound"
              maxLength={50}
              className="bg-secondary/30 border-border/50 focus:border-primary/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional):</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this crate for?"
              maxLength={200}
              rows={2}
              className="bg-secondary/30 border-border/50 focus:border-primary/50 resize-none"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color:</Label>
            <div className="flex gap-3">
              {CRATE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all",
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive animate-fade-in">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Crate
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCrateWithTracksModal;
