import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Guitar } from 'lucide-react';
import { SpotifyArtist } from '@/lib/spotify-api';

interface TopGenresCardProps {
  artists: SpotifyArtist[];
  isLoading: boolean;
}

const TopGenresCard = ({ artists, isLoading }: TopGenresCardProps) => {
  // Extract and count genres from artists
  const genreCounts = artists.reduce<Record<string, number>>((acc, artist) => {
    artist.genres.forEach(genre => {
      acc[genre] = (acc[genre] || 0) + 1;
    });
    return acc;
  }, {});

  const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
  
  const sortedGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([genre, count]) => ({
      name: genre,
      count,
      percentage: Math.round((count / totalGenreCount) * 100),
    }));

  const maxCount = sortedGenres[0]?.count || 1;

  // Color palette for bars
  const colors = [
    'from-primary to-primary/70',
    'from-purple-500 to-purple-500/70',
    'from-cyan-500 to-cyan-500/70',
    'from-pink-500 to-pink-500/70',
    'from-orange-500 to-orange-500/70',
    'from-blue-500 to-blue-500/70',
  ];

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Guitar className="w-4 h-4 text-primary" />
            Top Genres
          </CardTitle>
          <CardDescription className="text-xs">Your sound spectrum</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sortedGenres.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Guitar className="w-4 h-4 text-primary" />
            Top Genres
          </CardTitle>
          <CardDescription className="text-xs">Your sound spectrum</CardDescription>
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
          <Guitar className="w-4 h-4 text-primary" />
          Top Genres
        </CardTitle>
        <CardDescription className="text-xs">Your sound spectrum</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedGenres.map((genre, index) => (
          <div key={genre.name} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground capitalize">
                {genre.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {genre.percentage}%
              </span>
            </div>
            <div className="h-6 bg-muted/50 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                style={{ width: `${(genre.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TopGenresCard;
