import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { calculateArchetype, Archetype, MusicProfile } from '@/lib/music-archetypes';

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

interface MusicSignatureHeroProps {
  stats: AudioStats | null;
  trackCount: number;
  undergroundCount?: number;
  isLoading: boolean;
  onExplore: () => void;
}

const MusicSignatureHero = ({
  stats,
  trackCount,
  undergroundCount = 0,
  isLoading,
  onExplore,
}: MusicSignatureHeroProps) => {
  const archetype = useMemo<Archetype | null>(() => {
    if (!stats) return null;
    
    const profile: MusicProfile = {
      avgBpm: stats.tempo.avg,
      avgEnergy: stats.energy.avg,
      avgDanceability: stats.danceability.avg,
      avgValence: stats.valence.avg,
      undergroundRatio: trackCount > 0 ? undergroundCount / trackCount : 0,
    };
    
    return calculateArchetype(profile);
  }, [stats, trackCount, undergroundCount]);

  const radarData = useMemo(() => {
    if (!stats) return [];
    return [
      { feature: 'Energy', value: stats.energy.avg * 100 },
      { feature: 'Dance', value: stats.danceability.avg * 100 },
      { feature: 'Valence', value: stats.valence.avg * 100 },
      { feature: 'Acoustic', value: stats.acousticness.avg * 100 },
      { feature: 'Instrum.', value: stats.instrumentalness.avg * 100 },
      { feature: 'Live', value: stats.liveness.avg * 100 },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-xl">
        <CardContent className="p-8 lg:p-12 flex flex-col items-center">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-[240px] w-[240px] lg:h-[300px] lg:w-[300px] rounded-full mb-6" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || !archetype) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-card/90 via-card/80 to-primary/5 backdrop-blur-xl border-primary/20 shadow-2xl overflow-hidden">
        <CardContent className="p-8 lg:p-12 flex flex-col items-center relative">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-8 flex items-center gap-2"
          >
            🎵 YOUR MUSIC SIGNATURE
          </motion.h2>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-[240px] w-[240px] lg:h-[300px] lg:w-[300px] mb-6"
            aria-label={`Audio DNA radar chart showing Energy ${Math.round(stats.energy.avg * 100)}%, Danceability ${Math.round(stats.danceability.avg * 100)}%, Valence ${Math.round(stats.valence.avg * 100)}%`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="feature"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Radar
                  name="Your Profile"
                  dataKey="value"
                  stroke="hsl(262, 83%, 58%)"
                  fill="url(#heroRadarGradient)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="heroRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                    <stop offset="100%" stopColor="hsl(192, 91%, 43%)" />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Archetype */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="text-center mb-6"
          >
            <p className="text-lg lg:text-xl text-muted-foreground mb-2">You're a</p>
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-primary flex items-center justify-center gap-2">
              <span>{archetype.emoji}</span>
              <span>{archetype.name}</span>
            </h3>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-base lg:text-lg text-muted-foreground text-center mb-8"
          >
            {archetype.traits.join(' • ')}
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={onExplore}
              className="group gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
            >
              Explore Your DNA
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MusicSignatureHero;
