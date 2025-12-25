import { useNavigate, Link } from 'react-router-dom';
import { Music, BarChart3, ArrowRight } from 'lucide-react';
import { SpotifyPlaylist } from '@/lib/spotify-api';

interface PlaylistGridProps {
  playlists: SpotifyPlaylist[];
  selectedPlaylistId?: string;
  showViewAll?: boolean;
  totalCount?: number;
}

const PlaylistGrid = ({ playlists, selectedPlaylistId, showViewAll, totalCount }: PlaylistGridProps) => {
  const navigate = useNavigate();

  const handlePlaylistClick = (playlist: SpotifyPlaylist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {playlists.map((playlist) => {
        const imageUrl = playlist.images?.[0]?.url;
        const isSelected = playlist.id === selectedPlaylistId;

        return (
          <button
            key={playlist.id}
            onClick={() => handlePlaylistClick(playlist)}
            className={`
              group bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover 
              transition-all duration-300 text-left relative
              ${isSelected ? 'ring-2 ring-spotify' : ''}
            `}
          >
            {/* Analyze overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center z-10">
              <div className="text-center text-white">
                <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Analyze Flow</span>
              </div>
            </div>

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
      
      {/* View All button - flows inline as grid item */}
      {showViewAll && totalCount && totalCount > playlists.length && (
        <Link
          to="/playlists"
          className="flex items-center justify-center lg:justify-start"
          aria-label={`View all ${totalCount} playlists`}
        >
          <span className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
            View All {totalCount}
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}
    </div>
  );
};

export default PlaylistGrid;
