import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Lightbulb } from 'lucide-react';
import { CRATE_EMOJIS, CRATE_COLORS, Crate } from '@/lib/crates-api';
import { useCreateCrate } from '@/hooks/use-crates';
import { cn } from '@/lib/utils';
import SmartSuggestionsModal from './SmartSuggestionsModal';

interface CreateCrateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCrateModal = ({ open, onOpenChange }: CreateCrateModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎵');
  const [selectedColor, setSelectedColor] = useState('#00ff87');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  
  // Smart suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [createdCrate, setCreatedCrate] = useState<Crate | null>(null);

  const createCrate = useCreateCrate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Crate name is required');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }
    if (description.length > 200) {
      setError('Description must be 200 characters or less');
      return;
    }

    const newCrate = await createCrate.mutateAsync({
      name: trimmedName,
      description: description.trim() || null,
      emoji: selectedEmoji,
      color: selectedColor
    });

    // Close create modal and show suggestions
    onOpenChange(false);
    setCreatedCrate(newCrate);
    setShowSuggestions(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedEmoji('🎵');
    setSelectedColor('#00ff87');
    setShowEmojiPicker(false);
    setError('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleSuggestionsComplete = () => {
    resetForm();
    setCreatedCrate(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create New Crate</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-2">
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
                placeholder="e.g., Late Night Drives"
                maxLength={50}
                className="bg-secondary/30 border-border/50 focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground text-right">{name.length}/50</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional):</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this crate for? (helps find matching tracks)"
                maxLength={200}
                rows={2}
                className="bg-secondary/30 border-border/50 focus:border-primary/50 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/200</p>
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
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-secondary/30 rounded-xl flex items-center gap-4 border border-border/30">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${selectedColor}30`, borderColor: selectedColor, borderWidth: 1 }}
              >
                <span className="text-2xl">{selectedEmoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {name || 'Crate Name'}
                </p>
                <p className="text-sm text-muted-foreground">0 tracks</p>
              </div>
            </div>

            {/* What's a Crate? Helper */}
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">What's a Crate?</span>
                <br />
                Crates are moodboards for music — organized by vibe, not genre. We'll suggest tracks to get you started!
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
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={createCrate.isPending}
              >
                {createCrate.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* Smart Suggestions Modal */}
      <SmartSuggestionsModal
        open={showSuggestions}
        onOpenChange={setShowSuggestions}
        crate={createdCrate}
        onComplete={handleSuggestionsComplete}
      />
    </>
  );
};

export default CreateCrateModal;
