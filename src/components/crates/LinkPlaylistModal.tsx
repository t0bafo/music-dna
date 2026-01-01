import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Link as LinkIcon, ExternalLink, Loader2, Music2 } from 'lucide-react';
import { getUserPlaylists, linkPlaylist, syncCrateToSpotify } from '@/lib/spotify-sync';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  external_urls: { spotify: string };
}

interface LinkPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  crateId: string;
  crateName: string;
  onLinked: () => void;
}

export function LinkPlaylistModal({
  isOpen,
  onClose,
  crateId,
  crateName,
  onLinked,
}: LinkPlaylistModalProps) {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUserPlaylists();
    }
  }, [isOpen]);

  const loadUserPlaylists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userPlaylists = await getUserPlaylists();
      setPlaylists(userPlaylists);
    } catch (err: any) {
      console.error('Failed to load playlists:', err);
      setError(err.message || 'Failed to load playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async (playlist: SpotifyPlaylist) => {
    if (!accessToken) return;

    setIsLinking(playlist.id);
    try {
      await linkPlaylist(crateId, playlist.id, true, accessToken);
      
      // Immediately sync after linking
      await syncCrateToSpotify(crateId, accessToken);

      toast.success('Playlist linked!', {
        description: `"${crateName}" is now synced with "${playlist.name}"`,
      });

      onLinked();
      onClose();
    } catch (err: any) {
      toast.error('Failed to link playlist', { description: err.message });
    } finally {
      setIsLinking(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[#1DB954]" />
            Link Spotify Playlist
          </DialogTitle>
          <DialogDescription>
            Link "{crateName}" to an existing Spotify playlist to keep them in sync.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your playlists..."
            className="pl-9"
          />
        </div>

        {/* Playlist list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading playlists...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadUserPlaylists} className="mt-2">
                Retry
              </Button>
            </div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No playlists found' : 'No playlists available'}
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  {playlist.images?.[0] ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {playlist.tracks.total} tracks
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(playlist.external_urls.spotify, '_blank')}
                      className="h-8 w-8"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleLink(playlist)}
                      disabled={isLinking !== null}
                      className="gap-1.5 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
                    >
                      {isLinking === playlist.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LinkIcon className="w-3.5 h-3.5" />
                      )}
                      Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
