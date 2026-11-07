import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CRATE_STARTERS } from '@/lib/library';
import PlaylistCrateStart from './PlaylistCrateStart';
import AlbumMixtapeStudio from '@/components/AlbumMixtapeStudio';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronDown } from 'lucide-react';
import { CRATE_EMOJIS, CRATE_COLORS } from '@/lib/crates-api';
import { useCreateCrate } from '@/hooks/use-crates';
import { cn } from '@/lib/utils';

interface CreateCrateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_EMOJI = '🎵';
const DEFAULT_COLOR = CRATE_COLORS[0] ?? '#00ff87';

const CreateCrateModal = ({ open, onOpenChange }: CreateCrateModalProps) => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [start, setStart] = useState('empty');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJI);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  const createCrate = useCreateCrate();

  const resetForm = () => {
    setStart('empty');
    setName('');
    setDescription('');
    setSelectedEmoji(DEFAULT_EMOJI);
    setSelectedColor(DEFAULT_COLOR);
    setShowDetails(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current || createCrate.isPending) return;
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) return setError('Give your crate a name');
    if (trimmedName.length > 50) return setError('Name must be 50 characters or less');
    if (description.length > 200) return setError('Description must be 200 characters or less');

    submitting.current = true;
    try {
      const newCrate = await createCrate.mutateAsync({
        name: trimmedName,
        description: description.trim() || null,
        emoji: selectedEmoji,
        color: selectedColor,
      });
      resetForm();
      onOpenChange(false);
      navigate(`/crates/${newCrate.id}?add=1`);
    } catch {
      // Keep what they typed so they can retry.
      setError("Couldn't create the crate. Check your connection and press Create Crate again.");
    } finally {
      submitting.current = false;
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (createCrate.isPending) return;
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[680px] max-h-[85vh] overflow-y-auto px-4 py-6 sm:px-6">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">New crate</DialogTitle>
          <DialogDescription>A crate is a named collection of tracks you want to find again.</DialogDescription>
        </DialogHeader>

        <Tabs value={start} onValueChange={setStart}>
          <TabsList className="grid grid-cols-3 w-full h-auto">
            <TabsTrigger value="empty" className="text-xs sm:text-sm whitespace-normal">Start empty</TabsTrigger>
            <TabsTrigger value="playlist" className="text-xs sm:text-sm whitespace-normal">Spotify playlist</TabsTrigger>
            <TabsTrigger value="albums" className="text-xs sm:text-sm whitespace-normal">Mix albums</TabsTrigger>
          </TabsList>
          <TabsContent value="playlist">{accessToken && <PlaylistCrateStart accessToken={accessToken} />}</TabsContent>
          <TabsContent value="albums">{accessToken && <AlbumMixtapeStudio accessToken={accessToken} />}</TabsContent>
          <TabsContent value="empty">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="crate-name">Crate Name</Label>
            <Input
              id="crate-name"
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., Late Night Drives"
              maxLength={50}
              aria-invalid={!!error}
              aria-describedby={error ? 'crate-error' : undefined}
              className="h-11"
            />
          </div>

          <div className="border-y border-border py-3">
            <p className="text-xs text-muted-foreground mb-2">A starting thought, if you want one</p>
            <div className="flex flex-wrap gap-1">{CRATE_STARTERS.map(starter => <Button key={starter.name} type="button" variant="ghost" size="sm" className="h-auto py-2 whitespace-normal text-left" onClick={() => { setName(starter.name); setDescription(starter.note); setShowDetails(true); }}>{starter.name}</Button>)}</div>
          </div>
          <Button variant="ghost"
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', showDetails && 'rotate-180')} />
            Description, emoji and color (optional)
          </Button>

          {showDetails && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="crate-description">Description</Label>
                <Textarea
                  id="crate-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this crate for?"
                  maxLength={200}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium mb-1.5">Emoji</legend>
                <div className="grid grid-cols-8 gap-1">
                  {CRATE_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      aria-pressed={selectedEmoji === emoji}
                      aria-label={`Emoji ${emoji}`}
                      className={cn(
                        'h-10 rounded-md text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-secondary'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium mb-1.5">Color</legend>
                <div className="flex flex-wrap gap-2">
                  {CRATE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-pressed={selectedColor === color}
                      aria-label={`Color ${color}`}
                      className={cn(
                        'w-9 h-9 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selectedColor === color && 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {error && <p id="crate-error" role="alert" className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1 h-11" onClick={() => handleOpenChange(false)} disabled={createCrate.isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-11" disabled={createCrate.isPending || !name.trim()}>
              {createCrate.isPending ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Creating" /> : 'Create Crate'}
            </Button>
          </div>
        </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCrateModal;
