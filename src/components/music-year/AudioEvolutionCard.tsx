import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Zap, Music2, Smile, Gauge } from 'lucide-react';
import { AudioFeatures } from '@/lib/spotify-api';

interface AudioEvolutionCardProps {
  currentFeatures: AudioFeatures | null;
  baselineFeatures: AudioFeatures | null;
  isLoading: boolean;
}

const AudioEvolutionCard = ({ currentFeatures, baselineFeatures, isLoading }: AudioEvolutionCardProps) => {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            Audio Evolution
          </CardTitle>
          <CardDescription className="text-xs">How your taste shifted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!currentFeatures) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            Audio Evolution
          </CardTitle>
          <CardDescription className="text-xs">How your taste shifted</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Not enough data to show evolution.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getChange = (current: number, baseline: number | undefined) => {
    if (baseline === undefined) return { diff: 0, direction: 'stable' as const };
    const diff = Math.round((current - baseline) * 100);
    if (Math.abs(diff) < 3) return { diff, direction: 'stable' as const };
    return { diff, direction: diff > 0 ? 'up' as const : 'down' as const };
  };

  const metrics = [
    {
      label: 'Energy',
      icon: Zap,
      value: Math.round(currentFeatures.energy * 100),
      change: getChange(currentFeatures.energy, baselineFeatures?.energy),
      insight: (dir: string) => dir === 'up' ? 'More energetic vibes' : dir === 'down' ? 'More chill selections' : 'Consistent energy levels',
    },
    {
      label: 'Danceability',
      icon: Music2,
      value: Math.round(currentFeatures.danceability * 100),
      change: getChange(currentFeatures.danceability, baselineFeatures?.danceability),
      insight: (dir: string) => dir === 'up' ? 'More groovy tracks' : dir === 'down' ? 'Less dance-focused' : 'Steady groove level',
    },
    {
      label: 'Mood (Valence)',
      icon: Smile,
      value: Math.round(currentFeatures.valence * 100),
      change: getChange(currentFeatures.valence, baselineFeatures?.valence),
      insight: (dir: string) => dir === 'up' ? 'Happier, brighter tracks' : dir === 'down' ? 'More melancholic vibes' : 'Balanced mood',
    },
    {
      label: 'Tempo',
      icon: Gauge,
      value: Math.round(currentFeatures.tempo),
      change: getChange(currentFeatures.tempo / 200, baselineFeatures ? baselineFeatures.tempo / 200 : undefined),
      insight: (dir: string) => dir === 'up' ? 'Faster tempo preference' : dir === 'down' ? 'Slower, relaxed pace' : 'Consistent tempo',
      unit: 'BPM',
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-primary" />
          Audio Evolution
        </CardTitle>
        <CardDescription className="text-xs">How your taste shifted</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          const direction = metric.change.direction;
          
          return (
            <div key={metric.label} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{metric.label}</span>
                  <span className="text-sm font-bold text-primary">
                    {metric.value}{metric.unit ? ` ${metric.unit}` : '%'}
                  </span>
                  {direction === 'up' && (
                    <span className="flex items-center text-xs text-green-500">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      +{Math.abs(metric.change.diff)}%
                    </span>
                  )}
                  {direction === 'down' && (
                    <span className="flex items-center text-xs text-red-400">
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                      -{Math.abs(metric.change.diff)}%
                    </span>
                  )}
                  {direction === 'stable' && (
                    <span className="flex items-center text-xs text-muted-foreground">
                      <Minus className="w-3 h-3 mr-0.5" />
                      stable
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {metric.insight(direction)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AudioEvolutionCard;
