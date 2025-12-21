import { Zap, Disc3, Volume2, Heart, Radio, Mic2, Music, TrendingUp } from 'lucide-react';

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

interface AudioDNACardProps {
  title: string;
  subtitle?: string;
  stats: AudioStats;
  trackCount?: number;
  variant?: 'default' | 'compact';
}

const formatPercent = (value: number | undefined) =>
  value != null ? `${(value * 100).toFixed(1)}%` : 'N/A';

const StatItem = ({ 
  icon, 
  label, 
  value, 
  range,
  color = 'muted' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  range?: string;
  color?: string;
}) => {
  const colorClasses: Record<string, string> = {
    spotify: 'bg-spotify/10 text-spotify',
    nigeria: 'bg-nigeria/10 text-nigeria',
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent-foreground',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-card-foreground">{value}</p>
        {range && <p className="text-xs text-muted-foreground">{range}</p>}
      </div>
    </div>
  );
};

const AudioDNACard = ({ title, subtitle, stats, trackCount, variant = 'default' }: AudioDNACardProps) => {
  const isCompact = variant === 'compact';

  return (
    <div className="bg-card rounded-xl card-shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {trackCount && (
          <span className="px-3 py-1 bg-spotify/10 text-spotify rounded-full text-sm font-medium">
            {trackCount} tracks
          </span>
        )}
      </div>

      <div className={`grid ${isCompact ? 'grid-cols-2' : 'md:grid-cols-2'} gap-3`}>
        <StatItem
          icon={<Zap className="w-4 h-4" />}
          label="Average BPM"
          value={Math.round(stats.tempo.avg).toString()}
          range={stats.tempo.min && stats.tempo.max ? 
            `Range: ${Math.round(stats.tempo.min)}-${Math.round(stats.tempo.max)}` : undefined}
          color="nigeria"
        />
        <StatItem
          icon={<Disc3 className="w-4 h-4" />}
          label="Danceability"
          value={formatPercent(stats.danceability.avg)}
          range={stats.danceability.min && stats.danceability.max ?
            `Range: ${formatPercent(stats.danceability.min)}-${formatPercent(stats.danceability.max)}` : undefined}
          color="primary"
        />
        <StatItem
          icon={<Volume2 className="w-4 h-4" />}
          label="Energy"
          value={formatPercent(stats.energy.avg)}
          range={stats.energy.min && stats.energy.max ?
            `Range: ${formatPercent(stats.energy.min)}-${formatPercent(stats.energy.max)}` : undefined}
          color="accent"
        />
        <StatItem
          icon={<Heart className="w-4 h-4" />}
          label="Valence (Positivity)"
          value={formatPercent(stats.valence.avg)}
          range={stats.valence.min && stats.valence.max ?
            `Range: ${formatPercent(stats.valence.min)}-${formatPercent(stats.valence.max)}` : undefined}
          color="spotify"
        />
        {!isCompact && (
          <>
            <StatItem
              icon={<Radio className="w-4 h-4" />}
              label="Acousticness"
              value={formatPercent(stats.acousticness.avg)}
            />
            <StatItem
              icon={<Mic2 className="w-4 h-4" />}
              label="Speechiness"
              value={formatPercent(stats.speechiness.avg)}
            />
            <StatItem
              icon={<Music className="w-4 h-4" />}
              label="Instrumentalness"
              value={formatPercent(stats.instrumentalness.avg)}
            />
            <StatItem
              icon={<TrendingUp className="w-4 h-4" />}
              label="Liveness"
              value={formatPercent(stats.liveness.avg)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AudioDNACard;
