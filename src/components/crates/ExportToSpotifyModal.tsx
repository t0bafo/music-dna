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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, ExternalLink, Loader2, Music2, RefreshCw } from 'lucide-react';
import { createAndLinkPlaylist } from '@/lib/spotify-sync';
import { useAuth } from '@/contexts/AuthContext';

interface CrateTrack {
  id: string;
  track_id: string;
  position: number;
  name?: string;
  artist_name?: string;
}

interface Crate {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
}

interface ExportToSpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  crate: Crate;
  tracks: CrateTrack[];
  onExported?: () => void;
}

const ExportToSpotifyModal = ({
  isOpen,
  onClose,
  crate,
  tracks,
  onExported,
}: ExportToSpotifyModalProps) => {
  const { accessToken } = useAuth();
  const [playlistName, setPlaylistName] = useState(`${crate.emoji} ${crate.name}`);
  const [description, setDescription] = useState('Synced from Music DNA - Crates for music lovers');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [enableSync, setEnableSync] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedPlaylist, setExportedPlaylist] = useState<{ id: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!accessToken) {
      setError('Please reconnect Spotify to export playlists.');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const result = await createAndLinkPlaylist(
        crate.id,
        playlistName.trim(),
        description.trim(),
        visibility === 'public',
        enableSync,
        accessToken
      );

      setExportedPlaylist({
        id: result.playlistId,
        url: result.playlistUrl,
      });

      onExported?.();
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setExportedPlaylist(null);
    setError(null);
    setPlaylistName(`${crate.emoji} ${crate.name}`);
    setDescription('Synced from Music DNA - Crates for music lovers');
    setVisibility('private');
    setEnableSync(true);
    onClose();
  };

  // Success state
  if (exportedPlaylist) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-[#1DB954]/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#1DB954]" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Playlist Created!</h3>
            <p className="text-muted-foreground text-center mb-4">
              {enableSync ? (
                <>Your Crate will stay in sync with Spotify.</>
              ) : (
                <>Your Crate is now on Spotify.</>
              )}
            </p>
            
            <div className="bg-accent/50 rounded-lg p-4 w-full mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1DB954]/20 rounded flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-[#1DB954]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{playlistName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{tracks.length} tracks</span>
                    {enableSync && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#1DB954]">
                          <RefreshCw className="w-3 h-3" />
                          Auto-sync on
                        </span>
                      </>
                    )}
                  </div>
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
                className="flex-1 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
                onClick={() => window.open(exportedPlaylist.url, '_blank')}
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
          <DialogTitle className="font-display flex items-center gap-2">
            <Music2 className="w-5 h-5 text-[#1DB954]" />
            Export to Spotify
          </DialogTitle>
          <DialogDescription>
            Create a new Spotify playlist with all {tracks.length} tracks from this Crate.
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
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              maxLength={300}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <RadioGroup
              value={visibility}
              onValueChange={(value) => setVisibility(value as 'private' | 'public')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal cursor-pointer">
                  Private
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal cursor-pointer">
                  Public
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sync option */}
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="enable-sync"
              checked={enableSync}
              onCheckedChange={(checked) => setEnableSync(checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="enable-sync" className="font-medium cursor-pointer">
                Keep synced with crate
              </Label>
              <p className="text-xs text-muted-foreground">
                Changes to this crate will automatically update the Spotify playlist.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {error}
            </p>
          )}

          {!enableSync && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p>This creates a <strong>one-time export</strong>. Changes to your Crate won't sync to Spotify.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || !playlistName.trim() || tracks.length === 0}
            className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
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

export default ExportToSpotifyModal;
