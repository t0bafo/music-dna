import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, ExternalLink } from 'lucide-react';
import { SpotifyTrack } from '@/lib/spotify-api';

interface TopSongsCardProps {
  tracks: SpotifyTrack[];
  isLoading: boolean;
}

const TopSongsCard = ({ tracks, isLoading }: TopSongsCardProps) => {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="w-4 h-4 text-primary" />
            Top Songs
          </CardTitle>
          <CardDescription className="text-xs">Your most played tracks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (tracks.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="w-4 h-4 text-primary" />
            Top Songs
          </CardTitle>
          <CardDescription className="text-xs">Your most played tracks</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Not enough listening data for this period.
            <br />
            <span className="text-xs">Try selecting a longer time range.</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music className="w-4 h-4 text-primary" />
          Top Songs
        </CardTitle>
        <CardDescription className="text-xs">Your most played tracks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {tracks.slice(0, 10).map((track, index) => (
          <a
            key={track.id}
            href={`https://open.spotify.com/track/${track.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <img
              src={track.album.images[2]?.url || track.album.images[0]?.url}
              alt={track.album.name}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {track.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {track.artists.map(a => a.name).join(', ')}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
};

export default TopSongsCard;
