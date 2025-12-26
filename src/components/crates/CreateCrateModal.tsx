import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { CRATE_EMOJIS, CRATE_COLORS } from '@/lib/crates-api';
import { useCreateCrate } from '@/hooks/use-crates';
import { cn } from '@/lib/utils';

interface CreateCrateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCrateModal = ({ open, onOpenChange }: CreateCrateModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📦');
  const [selectedColor, setSelectedColor] = useState('#1DB954');

  const createCrate = useCreateCrate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createCrate.mutateAsync({
      name: name.trim(),
      description: description.trim() || null,
      emoji: selectedEmoji,
      color: selectedColor
    });

    // Reset and close
    setName('');
    setDescription('');
    setSelectedEmoji('📦');
    setSelectedColor('#1DB954');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create New Crate</DialogTitle>
          <DialogDescription>
            Organize your music by vibe, mood, or meaning.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Late Night Drives"
              maxLength={50}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this crate for?"
              maxLength={200}
              rows={2}
            />
          </div>

          {/* Emoji Picker */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-secondary/30 rounded-lg">
              {CRATE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                    selectedEmoji === emoji
                      ? "bg-primary/20 ring-2 ring-primary scale-110"
                      : "hover:bg-secondary"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CRATE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-secondary/30 rounded-xl flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${selectedColor}30` }}
            >
              <span className="text-2xl">{selectedEmoji}</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{name || 'Crate Name'}</p>
              <p className="text-sm text-muted-foreground">0 tracks</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={!name.trim() || createCrate.isPending}
            >
              {createCrate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Crate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCrateModal;
