import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, Gem, Clock } from 'lucide-react';
import { SpotifyArtist, SpotifyTrack } from '@/lib/spotify-api';

interface DiscoveryStatsCardProps {
  currentArtists: SpotifyArtist[];
  allTimeArtists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  isLoading: boolean;
}

const DiscoveryStatsCard = ({ currentArtists, allTimeArtists, tracks, isLoading }: DiscoveryStatsCardProps) => {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-4 h-4 text-primary" />
            Discovery Stats
          </CardTitle>
          <CardDescription className="text-xs">New artists you found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate new artists (in current period but not in all-time top)
  const allTimeArtistIds = new Set(allTimeArtists.map(a => a.id));
  const newArtists = currentArtists.filter(a => !allTimeArtistIds.has(a.id));
  
  // Underground artists (popularity < 50)
  const undergroundArtists = newArtists.filter(a => a.popularity < 50);
  
  // Estimate listening time from tracks (rough calculation)
  const totalDurationMs = tracks.reduce((sum, t) => sum + t.duration_ms, 0);
  const estimatedMinutes = Math.round((totalDurationMs * 3) / 60000); // Assume ~3 plays per track

  const stats = [
    {
      icon: Users,
      value: newArtists.length,
      label: 'New Artists',
      sublabel: 'discovered this period',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Gem,
      value: undergroundArtists.length,
      label: 'Underground',
      sublabel: 'gems found',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Clock,
      value: estimatedMinutes > 1000 ? `${Math.round(estimatedMinutes / 60)}h` : `${estimatedMinutes}m`,
      label: 'Est. Time',
      sublabel: 'listened*',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="w-4 h-4 text-primary" />
          Discovery Stats
        </CardTitle>
        <CardDescription className="text-xs">New artists you found</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                  <IconComponent className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-foreground font-medium">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t border-border/50">
          *Estimate based on top tracks - actual listening may vary
        </p>
      </CardContent>
    </Card>
  );
};

export default DiscoveryStatsCard;
