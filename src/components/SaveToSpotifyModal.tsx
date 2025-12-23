import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ExternalLink, Loader2, Music } from 'lucide-react';

interface SaveToSpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playlistName: string) => Promise<string | null>;
  originalName: string;
  flowScore: number;
  originalScore: number;
}

const SaveToSpotifyModal = ({
  isOpen,
  onClose,
  onSave,
  originalName,
  flowScore,
  originalScore,
}: SaveToSpotifyModalProps) => {
  const [playlistName, setPlaylistName] = useState(`${originalName} (Optimized)`);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      const newPlaylistId = await onSave(playlistName);
      if (newPlaylistId) {
        setSavedPlaylistId(newPlaylistId);
      } else {
        setError('Failed to create playlist. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSavedPlaylistId(null);
    setError(null);
    setPlaylistName(`${originalName} (Optimized)`);
    onClose();
  };

  const improvement = flowScore - originalScore;

  // Success state
  if (savedPlaylistId) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Playlist Created!</h3>
            <p className="text-muted-foreground text-center mb-4">
              Your optimized playlist has been saved to Spotify.
            </p>
            
            <div className="bg-accent/50 rounded-lg p-4 w-full mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-spotify/20 rounded flex items-center justify-center">
                  <Music className="w-6 h-6 text-spotify" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{playlistName}</p>
                  <p className="text-sm text-muted-foreground">
                    Flow Score: {originalScore} → {flowScore}
                    {improvement > 0 && (
                      <span className="text-green-500 ml-1">(+{improvement})</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Done
              </Button>
              <Button
                className="flex-1 bg-spotify hover:bg-spotify/90"
                onClick={() => window.open(`https://open.spotify.com/playlist/${savedPlaylistId}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Spotify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Spotify</DialogTitle>
          <DialogDescription>
            Create a new playlist with your optimized track order. The original playlist will remain unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input
              id="playlist-name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="bg-accent/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>This will create a <strong>new private playlist</strong> in your Spotify account.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !playlistName.trim()}
            className="bg-spotify hover:bg-spotify/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Create Playlist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveToSpotifyModal;
