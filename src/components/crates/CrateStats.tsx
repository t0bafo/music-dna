import { useMemo } from 'react';
import { Clock, Music, Zap, Gem } from 'lucide-react';
import { CrateTrack } from '@/lib/crates-api';

interface CrateStatsProps {
  tracks: CrateTrack[];
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  label: string;
  highlight?: boolean;
}

function StatCard({ icon, title, value, label, highlight = false }: StatCardProps) {
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
      <div className="text-2xl font-bold text-foreground mb-1">
        {value}
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

function getUndergroundLabel(score: number): string {
  if (score < 30) return 'Mainstream';
  if (score < 60) return 'Balanced mix';
  if (score < 80) return 'Deep cuts';
  return 'True digger';
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

    const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
    
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
      : 0;

    return {
      duration: formatDuration(totalDuration),
      durationLabel: getDurationLabel(totalDuration),
      avgBpm: isNaN(avgBpm) ? '—' : Math.round(avgBpm),
      avgBpmLabel: getBpmLabel(avgBpm),
      avgEnergy: isNaN(avgEnergy) ? '—' : `${Math.round(avgEnergy * 100)}%`,
      avgEnergyLabel: getEnergyLabel(avgEnergy),
      undergroundScore,
      undergroundLabel: getUndergroundLabel(undergroundScore),
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
      />
      <StatCard
        icon={<Music className="w-5 h-5" />}
        title="Avg BPM"
        value={stats.avgBpm}
        label={stats.avgBpmLabel}
      />
      <StatCard
        icon={<Zap className="w-5 h-5" />}
        title="Avg Energy"
        value={stats.avgEnergy}
        label={stats.avgEnergyLabel}
      />
      <StatCard
        icon={<Gem className="w-5 h-5" />}
        title="Underground"
        value={`${stats.undergroundScore}/100`}
        label={stats.undergroundLabel}
        highlight={stats.undergroundScore > 60}
      />
    </div>
  );
}
