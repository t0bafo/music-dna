import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';
import { CRATE_EMOJIS, CRATE_COLORS } from '@/lib/crates-api';
import { useCreateCrate, useAddTracksToCrate } from '@/hooks/use-crates';
import { cn } from '@/lib/utils';
import { SearchFilters } from '@/lib/vibe-search-types';
import { toast } from 'sonner';
import { SearchableTrack } from '@/hooks/use-crates-search';
import { TrackToAdd } from '@/lib/crates-api';

interface CreateCrateFromSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTracks: SearchableTrack[];
  searchQuery: string;
  expandedFilters: SearchFilters | null;
  onSuccess: (crateId: string) => void;
}

export function CreateCrateFromSearchModal({
  open,
  onOpenChange,
  selectedTracks,
  searchQuery,
  expandedFilters,
  onSuccess,
}: CreateCrateFromSearchModalProps) {
  // Pre-fill name from search query
  const suggestedName = searchQuery
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Pre-fill tags from expanded filters
  const suggestedTags = [
    ...(expandedFilters?.vibes || []),
    ...(expandedFilters?.scenes || []),
  ].slice(0, 6);

  const [name, setName] = useState(suggestedName);
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎵');
  const [selectedColor, setSelectedColor] = useState('#00ff87');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [vibeKeywords, setVibeKeywords] = useState<string[]>(suggestedTags);
  const [error, setError] = useState('');

  const createCrate = useCreateCrate();
  const addTracks = useAddTracksToCrate();

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      setName(suggestedName);
      setVibeKeywords(suggestedTags);
      setDescription('');
      setError('');
    }
  }, [open, suggestedName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Crate name is required');
      return;
    }

    try {
      // Create the crate
      const newCrate = await createCrate.mutateAsync({
        name: trimmedName,
        description: description.trim() || null,
        emoji: selectedEmoji,
        color: selectedColor,
        vibe_keywords: vibeKeywords,
      });

      // Add all selected tracks
      if (selectedTracks.length > 0) {
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

        await addTracks.mutateAsync({
          crateId: newCrate.id,
          tracks: tracksToAdd,
        });
      }

      toast.success(`Created "${trimmedName}" with ${selectedTracks.length} tracks`);
      onSuccess(newCrate.id);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to create crate:', err);
      setError('Failed to create crate. Please try again.');
    }
  };

  const toggleTag = (tag: string) => {
    if (vibeKeywords.includes(tag)) {
      setVibeKeywords(vibeKeywords.filter(t => t !== tag));
    } else if (vibeKeywords.length < 6) {
      setVibeKeywords([...vibeKeywords, tag]);
    }
  };

  const isLoading = createCrate.isPending || addTracks.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Create Crate from Search
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Track count preview */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-2xl">{selectedEmoji}</span>
            <div className="flex-1">
              <p className="font-medium text-foreground">{selectedTracks.length} tracks selected</p>
              <p className="text-xs text-muted-foreground">Will be added to your new crate</p>
            </div>
          </div>

          {/* Emoji Picker */}
          <div className="space-y-1.5">
            <Label className="text-sm">Emoji:</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors border border-border/50"
              >
                <span className="text-xl">{selectedEmoji}</span>
                <span className="text-xs text-muted-foreground">Click to change</span>
              </button>
              
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-card/95 backdrop-blur-xl rounded-lg border border-border/50 shadow-xl z-50">
                  <div className="grid grid-cols-6 gap-1.5">
                    {CRATE_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center text-lg transition-all hover:scale-110",
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
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm">Crate Name:</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Late Night Drives"
              maxLength={50}
              className="bg-secondary/30 border-border/50 focus:border-primary/50 h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm">Description (optional):</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this crate for?"
              maxLength={200}
              rows={2}
              className="bg-secondary/30 border-border/50 focus:border-primary/50 resize-none text-sm"
            />
          </div>

          {/* Vibe Tags */}
          {(suggestedTags.length > 0 || vibeKeywords.length > 0) && (
            <div className="space-y-1.5">
              <Label className="text-sm">Vibe Tags:</Label>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...suggestedTags, ...vibeKeywords])].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-all",
                      vibeKeywords.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Picker */}
          <div className="space-y-1.5">
            <Label className="text-sm">Color:</Label>
            <div className="flex gap-2">
              {CRATE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create with {selectedTracks.length} Tracks
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
