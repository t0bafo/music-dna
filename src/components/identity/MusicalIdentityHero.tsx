import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Archetype } from '@/lib/music-archetypes';

interface MusicalIdentityHeroProps {
  archetype: Archetype | null;
  undergroundIndex: number;
  avgBpm: number;
  avgEnergy: number;
  undergroundGemsCount: number;
  topTracks: { name: string; artist: string }[];
  isLoading: boolean;
  onShare: () => void;
}

// Dynamic gradient backgrounds based on archetype (using hex colors for reliability)
const archetypeStyles: Record<string, { from: string; via: string; to: string }> = {
  'MIDNIGHT CURATOR': { from: '#581c87', via: '#312e81', to: '#1e3a8a' },
  'ENERGY ARCHITECT': { from: '#ea580c', via: '#dc2626', to: '#db2777' },
  'VIBES ENGINEER': { from: '#ec4899', via: '#a855f7', to: '#6366f1' },
  'UNDERGROUND EXPLORER': { from: '#115e59', via: '#166534', to: '#064e3b' },
  'PEAK COMMANDER': { from: '#ca8a04', via: '#ea580c', to: '#dc2626' },
  'BALANCED CURATOR': { from: '#2563eb', via: '#0891b2', to: '#0d9488' },
};

const getUndergroundColor = (index: number): { from: string; to: string } => {
  if (index <= 30) return { from: '#facc15', to: '#eab308' };
  if (index <= 60) return { from: '#fb923c', to: '#f97316' };
  if (index <= 80) return { from: '#f87171', to: '#ef4444' };
  return { from: '#c084fc', to: '#ec4899' };
};

const getUndergroundLabel = (index: number) => {
  if (index <= 30) return 'Mainstream listener';
  if (index <= 60) return 'Balanced explorer';
  if (index <= 80) return 'Underground digger';
  return 'True tastemaker';
};

const MusicalIdentityHero = ({
  archetype,
  undergroundIndex,
  avgBpm,
  avgEnergy,
  undergroundGemsCount,
  topTracks,
  isLoading,
  onShare,
}: MusicalIdentityHeroProps) => {
  if (isLoading) {
    return (
      <div className="w-full max-w-[900px] mx-auto">
        <div 
          className="rounded-3xl shadow-2xl p-8 md:p-12"
          style={{ background: 'linear-gradient(135deg, #581c87, #312e81, #1e3a8a)' }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center min-h-[400px]">
            <Skeleton className="h-16 w-16 rounded-full bg-white/20 mb-4" />
            <Skeleton className="h-10 w-64 bg-white/20 mb-4" />
            <Skeleton className="h-5 w-48 bg-white/20 mb-8" />
            <Skeleton className="h-3 w-full max-w-md bg-white/20 mb-8" />
            <Skeleton className="h-8 w-32 bg-white/20" />
          </div>
        </div>
      </div>
    );
  }

  if (!archetype) {
    return (
      <div className="w-full max-w-[900px] mx-auto">
        <div 
          className="rounded-3xl shadow-2xl p-8 md:p-12"
          style={{ background: 'linear-gradient(135deg, #581c87, #312e81, #1e3a8a)' }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center min-h-[300px]">
            <p className="text-white/80 text-lg text-center">
              Listen to more music to discover your archetype
            </p>
          </div>
        </div>
      </div>
    );
  }

  const colors = archetypeStyles[archetype.name] || archetypeStyles['BALANCED CURATOR'];
  const undergroundColors = getUndergroundColor(undergroundIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[900px] mx-auto"
    >
      {/* Outer gradient container */}
      <div 
        id="identity-card-export"
        className="rounded-3xl shadow-2xl p-6 md:p-10 lg:p-12"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.via}, ${colors.to})` }}
      >
        {/* Inner glassmorphism card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-10">
          {/* 1. Archetype Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center mb-6 md:mb-8"
          >
            <span className="text-5xl md:text-6xl lg:text-7xl block mb-3">{archetype.emoji}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight uppercase mb-3 text-white drop-shadow-lg">
              {archetype.name}
            </h2>
            <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-lg mx-auto">
              {archetype.traits.join(' • ')}
            </p>
          </motion.div>

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-6 md:mb-8" />

          {/* 2. Underground Index Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6 md:mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
              <span className="text-xl md:text-2xl">🔥</span>
              <span className="text-white/90 text-base md:text-lg font-medium">Underground Index:</span>
              <span 
                className="text-2xl md:text-3xl lg:text-4xl font-bold"
                style={{
                  background: `linear-gradient(to right, ${undergroundColors.from}, ${undergroundColors.to})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {undergroundIndex}/100
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto mb-3">
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${undergroundIndex}%` }}
                  transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full shadow-lg"
                  style={{ background: `linear-gradient(to right, ${undergroundColors.from}, ${undergroundColors.to})` }}
                />
              </div>
            </div>

            <p className="text-white/80 text-sm md:text-base">
              {getUndergroundLabel(undergroundIndex)}
            </p>
          </motion.div>

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-6 md:mb-8" />

          {/* 3. Music Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 md:mb-8"
          >
            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl md:text-2xl">🎵</span>
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{avgBpm}</span>
                </div>
                <p className="text-white/80 text-xs md:text-sm">Average BPM</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl md:text-2xl">⚡</span>
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{avgEnergy}%</span>
                </div>
                <p className="text-white/80 text-xs md:text-sm">Energy Level</p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-xl md:text-2xl">💎</span>
                <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{undergroundGemsCount}</span>
              </div>
              <p className="text-white/80 text-xs md:text-sm">Underground Gems</p>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-6 md:mb-8" />

          {/* 4. Top Tracks Section */}
          {topTracks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 md:mb-8"
            >
              <h3 className="text-white/90 text-base md:text-lg font-semibold text-center mb-4">
                Top Tracks That Define You:
              </h3>
              <div className="space-y-2 max-w-md mx-auto">
                {topTracks.slice(0, 3).map((track, i) => (
                  <p key={i} className="text-white text-sm md:text-base text-left leading-relaxed">
                    <span className="font-bold text-base md:text-lg">{i + 1}.</span>{' '}
                    {track.name} <span className="text-white/80">- {track.artist}</span>
                  </p>
                ))}
              </div>
            </motion.div>
          )}

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-6 md:mb-8" />

          {/* 5. Footer/CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-white/70 text-xs md:text-sm mb-1">
              Discover your music identity at
            </p>
            <p className="text-white font-bold text-sm md:text-base">
              musicdna.app
            </p>
          </motion.div>
        </div>
      </div>

      {/* Share Button - Below Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center mt-6"
      >
        <Button
          onClick={onShare}
          size="lg"
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 rounded-xl"
        >
          <Share2 className="w-5 h-5" />
          Share My Identity
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default MusicalIdentityHero;
