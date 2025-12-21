import { Music } from 'lucide-react';
import { SpotifyPlaylist } from '@/lib/spotify-api';

interface PlaylistGridProps {
  playlists: SpotifyPlaylist[];
  onSelectPlaylist: (playlist: SpotifyPlaylist) => void;
  selectedPlaylistId?: string;
}

const PlaylistGrid = ({ playlists, onSelectPlaylist, selectedPlaylistId }: PlaylistGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {playlists.map((playlist) => {
        const imageUrl = playlist.images?.[0]?.url;
        const isSelected = playlist.id === selectedPlaylistId;

        return (
          <button
            key={playlist.id}
            onClick={() => onSelectPlaylist(playlist)}
            className={`
              group bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover 
              transition-all duration-300 text-left
              ${isSelected ? 'ring-2 ring-spotify' : ''}
            `}
          >
            <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={playlist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-card-foreground truncate group-hover:text-spotify transition-colors">
              {playlist.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {playlist.tracks.total} tracks
            </p>
            {playlist.owner.display_name && (
              <p className="text-xs text-muted-foreground truncate">
                by {playlist.owner.display_name}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PlaylistGrid;
