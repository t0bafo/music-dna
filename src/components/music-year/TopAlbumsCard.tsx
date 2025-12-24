import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Disc3, ExternalLink } from 'lucide-react';
import { SpotifyTrack } from '@/lib/spotify-api';

interface AlbumData {
  id: string;
  name: string;
  artist: string;
  imageUrl: string;
  trackCount: number;
}

interface TopAlbumsCardProps {
  tracks: SpotifyTrack[];
  isLoading: boolean;
}

const TopAlbumsCard = ({ tracks, isLoading }: TopAlbumsCardProps) => {
  // Derive top albums from tracks
  const albums = tracks.reduce<Record<string, AlbumData>>((acc, track) => {
    const albumId = track.album.id;
    if (!acc[albumId]) {
      acc[albumId] = {
        id: albumId,
        name: track.album.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        imageUrl: track.album.images[1]?.url || track.album.images[0]?.url || '',
        trackCount: 0,
      };
    }
    acc[albumId].trackCount++;
    return acc;
  }, {});

  const sortedAlbums = Object.values(albums)
    .sort((a, b) => b.trackCount - a.trackCount)
    .slice(0, 6);

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Disc3 className="w-4 h-4 text-primary" />
            Top Albums
          </CardTitle>
          <CardDescription className="text-xs">Albums you loved most</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-16 h-16 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedAlbums.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Disc3 className="w-4 h-4 text-primary" />
            Top Albums
          </CardTitle>
          <CardDescription className="text-xs">Albums you loved most</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Not enough listening data for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Disc3 className="w-4 h-4 text-primary" />
          Top Albums
        </CardTitle>
        <CardDescription className="text-xs">Albums you loved most</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedAlbums.map((album) => (
            <a
              key={album.id}
              href={`https://open.spotify.com/album/${album.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <img
                src={album.imageUrl}
                alt={album.name}
                className="w-16 h-16 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {album.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {album.artist}
                </p>
                <p className="text-xs text-primary mt-1">
                  {album.trackCount} track{album.trackCount > 1 ? 's' : ''} in top 50
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopAlbumsCard;
