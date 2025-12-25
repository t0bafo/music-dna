import { Zap, Disc3, Volume2, Heart, Gem } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  getEnergyDescription,
  getDanceabilityDescription,
  getValenceDescription,
  getBpmDescription,
} from '@/lib/music-archetypes';

interface AudioStats {
  tempo: { avg: number; min?: number; max?: number };
  danceability: { avg: number; min?: number; max?: number };
  energy: { avg: number; min?: number; max?: number };
  valence: { avg: number; min?: number; max?: number };
  acousticness: { avg: number };
  speechiness: { avg: number };
  instrumentalness: { avg: number };
  liveness: { avg: number };
}

interface SimplifiedMetricsGridProps {
  stats: AudioStats | null;
  undergroundCount: number;
  totalTracks: number;
  isLoading: boolean;
}

const formatPercent = (value: number | undefined) =>
  value != null ? `${(value * 100).toFixed(1)}%` : 'N/A';

const MetricCard = ({
  icon,
  label,
  value,
  range,
  description,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  range?: string;
  description: string;
  color: string;
  delay: number;
}) => {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    green: { bg: 'bg-primary/10', text: 'text-primary' },
    purple: { bg: 'bg-chart-purple/10', text: 'text-chart-purple' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-500' },
    cyan: { bg: 'bg-chart-cyan/10', text: 'text-chart-cyan' },
  };

  const { bg, text } = colorClasses[color] || colorClasses.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="bg-card/60 backdrop-blur-xl border-border/50 h-full">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${bg}`}>
              <div className={text}>{icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{value}</p>
              {range && (
                <p className="text-xs text-muted-foreground mt-0.5">{range}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SimplifiedMetricsGrid = ({
  stats,
  undergroundCount,
  totalTracks,
  isLoading,
}: SimplifiedMetricsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-card/60 backdrop-blur-xl border-border/50">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const undergroundRatio = totalTracks > 0 ? undergroundCount / totalTracks : 0;
  const undergroundPercent = Math.round(undergroundRatio * 100);

  return (
    <div className="space-y-4">
      {/* Main 4 metrics in 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label="Average BPM"
          value={Math.round(stats.tempo.avg).toString()}
          range={
            stats.tempo.min && stats.tempo.max
              ? `Range: ${Math.round(stats.tempo.min)}-${Math.round(stats.tempo.max)}`
              : undefined
          }
          description={getBpmDescription(stats.tempo.avg)}
          color="yellow"
          delay={0}
        />
        <MetricCard
          icon={<Volume2 className="w-5 h-5" />}
          label="Energy"
          value={formatPercent(stats.energy.avg)}
          range={
            stats.energy.min && stats.energy.max
              ? `Range: ${formatPercent(stats.energy.min)}-${formatPercent(stats.energy.max)}`
              : undefined
          }
          description={getEnergyDescription(stats.energy.avg)}
          color="purple"
          delay={0.1}
        />
        <MetricCard
          icon={<Disc3 className="w-5 h-5" />}
          label="Danceability"
          value={formatPercent(stats.danceability.avg)}
          range={
            stats.danceability.min && stats.danceability.max
              ? `Range: ${formatPercent(stats.danceability.min)}-${formatPercent(stats.danceability.max)}`
              : undefined
          }
          description={getDanceabilityDescription(stats.danceability.avg)}
          color="green"
          delay={0.2}
        />
        <MetricCard
          icon={<Heart className="w-5 h-5" />}
          label="Mood (Valence)"
          value={formatPercent(stats.valence.avg)}
          range={
            stats.valence.min && stats.valence.max
              ? `Range: ${formatPercent(stats.valence.min)}-${formatPercent(stats.valence.max)}`
              : undefined
          }
          description={getValenceDescription(stats.valence.avg)}
          color="pink"
          delay={0.3}
        />
      </div>

      {/* Underground ratio - full width insight card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-chart-cyan/10 via-chart-cyan/5 to-transparent border-chart-cyan/20">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-cyan/10">
                <Gem className="w-6 h-6 text-chart-cyan" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-bold text-chart-cyan">
                    {undergroundPercent}%
                  </span>
                  <span className="text-base text-muted-foreground">Underground</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {undergroundPercent > 40
                    ? "You're a true tastemaker! Most of your music flies under the radar."
                    : undergroundPercent > 25
                    ? 'Nice balance of discovery and popular hits.'
                    : 'You prefer established, popular tracks.'}
                </p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm text-muted-foreground">
                  {undergroundCount} of {totalTracks} tracks
                </p>
                <p className="text-xs text-muted-foreground">popularity &lt; 50</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SimplifiedMetricsGrid;
