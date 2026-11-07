import { useMemo } from 'react';
import { Clock, Music, Zap, Gem, AlertTriangle } from 'lucide-react';
import { CrateTrack } from '@/lib/crates-api';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CrateStatsProps {
  tracks: CrateTrack[];
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  label: string;
  highlight?: boolean;
  warning?: string;
}

function StatCard({ icon, title, value, label, highlight = false, warning }: StatCardProps) {
  return (
    <div className={`
      p-4 rounded-xl border-2 transition-all
      ${highlight 
        ? 'border-amber-500/50 bg-amber-500/10' 
        : 'border-border/50 bg-card/60'
      }
    `}>
      <div className="text-2xl mb-2 text-muted-foreground">{icon}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
        {title}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-2xl font-bold text-foreground">
          {value}
        </span>
        {warning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">{warning}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function getDurationLabel(ms: number): string {
  const minutes = ms / 1000 / 60;
  if (minutes < 20) return 'Quick listen';
  if (minutes < 45) return 'Short session';
  if (minutes < 90) return 'Mid-length';
  return 'Long session';
}

function getBpmLabel(bpm: number): string {
  if (!bpm || isNaN(bpm)) return '—';
  if (bpm < 90) return 'Slow';
  if (bpm < 120) return 'Mid-tempo';
  if (bpm < 140) return 'Uptempo';
  return 'Fast';
}

function getEnergyLabel(energy: number): string {
  if (isNaN(energy)) return '—';
  if (energy < 0.4) return 'Chill';
  if (energy < 0.7) return 'Balanced';
  return 'High energy';
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${totalMinutes} min`;
}

export function CrateStats({ tracks }: CrateStatsProps) {
  const stats = useMemo(() => {
    if (tracks.length === 0) return null;

    // Duration calculation with missing data tracking
    const tracksWithDuration = tracks.filter(t => t.duration_ms && t.duration_ms > 0);
    const totalDurationFromKnown = tracksWithDuration.reduce((sum, t) => sum + t.duration_ms!, 0);
    const missingDurationCount = tracks.length - tracksWithDuration.length;
    
    // Estimate missing durations using average of known tracks, or 3 min default
    const avgDuration = tracksWithDuration.length > 0 
      ? totalDurationFromKnown / tracksWithDuration.length 
      : 180000; // 3 min default
    const estimatedTotal = totalDurationFromKnown + (missingDurationCount * avgDuration);
    
    const tracksWithBpm = tracks.filter(t => t.bpm && t.bpm > 0);
    const avgBpm = tracksWithBpm.length > 0
      ? tracksWithBpm.reduce((sum, t) => sum + t.bpm!, 0) / tracksWithBpm.length
      : NaN;
    
    const tracksWithEnergy = tracks.filter(t => t.energy !== undefined && t.energy !== null);
    const avgEnergy = tracksWithEnergy.length > 0
      ? tracksWithEnergy.reduce((sum, t) => sum + t.energy!, 0) / tracksWithEnergy.length
      : NaN;
    
    const tracksWithPopularity = tracks.filter(t => t.popularity !== undefined && t.popularity !== null);
    const undergroundScore = tracksWithPopularity.length > 0
      ? Math.round((tracksWithPopularity.filter(t => (t.popularity || 0) < 50).length / tracksWithPopularity.length) * 100)
      : null;

    return {
      duration: formatDuration(estimatedTotal),
      durationLabel: getDurationLabel(estimatedTotal),
      hasMissingDurations: missingDurationCount > 0,
      missingDurationCount,
      avgBpm: isNaN(avgBpm) ? '—' : Math.round(avgBpm),
      avgBpmLabel: getBpmLabel(avgBpm),
      avgEnergy: isNaN(avgEnergy) ? '—' : `${Math.round(avgEnergy * 100)}%`,
      avgEnergyLabel: getEnergyLabel(avgEnergy),
      undergroundScore,
      undergroundLabel: undergroundScore === null ? 'Popularity unknown' : `Below 50 on Spotify popularity · known for ${tracksWithPopularity.length}/${tracks.length}`,
      bpmCoverage: `${tracksWithBpm.length}/${tracks.length} tracks`,
      energyCoverage: `${tracksWithEnergy.length}/${tracks.length} tracks`,
    };
  }, [tracks]);

  if (!stats || tracks.length < 3) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <StatCard
        icon={<Clock className="w-5 h-5" />}
        title="Duration"
        value={stats.duration}
        label={stats.durationLabel}
        warning={stats.hasMissingDurations 
          ? `Estimated: ${stats.missingDurationCount} track${stats.missingDurationCount > 1 ? 's' : ''} missing duration data` 
          : undefined
        }
      />
      <StatCard
        icon={<Music className="w-5 h-5" />}
        title="Avg BPM"
        value={stats.avgBpm}
        label={stats.avgBpm === '—' ? `No BPM data (${stats.bpmCoverage})` : `${stats.avgBpmLabel} · ${stats.bpmCoverage}`}
      />
      <StatCard
        icon={<Zap className="w-5 h-5" />}
        title="Avg Energy"
        value={stats.avgEnergy}
        label={stats.avgEnergy === '—' ? `No energy data (${stats.energyCoverage})` : `${stats.avgEnergyLabel} · ${stats.energyCoverage}`}
      />
      <StatCard
        icon={<Gem className="w-5 h-5" />}
        title="Spotify popularity signal"
        value={stats.undergroundScore === null ? '—' : `${stats.undergroundScore}%`}
        label={stats.undergroundLabel}
        highlight={(stats.undergroundScore ?? 0) > 60}
      />
    </div>
  );
}
