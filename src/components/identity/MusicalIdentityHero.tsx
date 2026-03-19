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

// Dynamic gradient backgrounds based on archetype
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
  if (index <= 30) return 'Mainstream';
  if (index <= 60) return 'Balanced';
  if (index <= 80) return 'Underground';
  return 'Tastemaker';
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
  // Generate top tracks inline text for desktop
  const topTracksInline = topTracks
    .slice(0, 3)
    .map(track => track.name)
    .join(' • ');
  
  const displayTracksText = topTracksInline.length > 70 
    ? topTracksInline.slice(0, 67) + '...'
    : topTracksInline;

  if (isLoading) {
    return (
      <div className="w-full max-w-[1000px] mx-auto px-4 md:px-0">
        <div 
          className="rounded-3xl shadow-2xl p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, #581c87, #312e81, #1e3a8a)' }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-8 flex flex-col items-center justify-center h-[300px] md:h-[400px]">
            <Skeleton className="h-12 w-12 rounded-full bg-white/20 mb-3" />
            <Skeleton className="h-8 w-48 bg-white/20 mb-3" />
            <Skeleton className="h-4 w-64 bg-white/20 mb-6" />
            <div className="grid grid-cols-4 gap-4 w-full max-w-lg">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 bg-white/20 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!archetype) {
    return (
      <div className="w-full max-w-[1000px] mx-auto px-4 md:px-0">
        <div 
          className="rounded-3xl shadow-2xl p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, #581c87, #312e81, #1e3a8a)' }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-8 flex flex-col items-center justify-center h-[200px]">
            <p className="text-white/80 text-base text-center">
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
      className="w-full max-w-[1000px] mx-auto px-4 md:px-0 mb-8 md:mb-12"
    >
      {/* Outer gradient container - max-height enforced */}
      <div 
        id="identity-card-export"
        className="rounded-3xl shadow-2xl p-5 md:p-8 max-h-[350px] md:max-h-[500px] overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.via}, ${colors.to})` }}
      >
        {/* Inner glassmorphism card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-8">
          
          {/* Header Section - Archetype */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-center mb-5 md:mb-6"
          >
            <span className="text-4xl md:text-5xl block mb-2">{archetype.emoji}</span>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase mb-1 text-white drop-shadow-lg">
              {archetype.name}
            </h2>
            <p className="text-white/90 text-xs md:text-sm leading-relaxed truncate max-w-md mx-auto">
              {archetype.traits.join(' • ')}
            </p>
          </motion.div>

          {/* Stats Row - 4 columns on desktop, 2x2 grid on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 md:mb-5"
          >
            {/* Desktop: 4-column grid */}
            <div className="hidden md:grid grid-cols-4 gap-4">
              {/* Underground Index */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-lg">🔥</span>
                  <span 
                    className="text-xl font-bold"
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
                <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden mx-auto mb-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${undergroundIndex}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ 
                      background: `linear-gradient(to right, ${undergroundColors.from}, ${undergroundColors.to})`,
                      boxShadow: `0 0 8px ${undergroundColors.from}50`
                    }}
                  />
                </div>
                <p className="text-white/80 text-[11px]">{getUndergroundLabel(undergroundIndex)}</p>
              </div>

              {/* BPM */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-lg">🎵</span>
                  <span className="text-xl font-bold text-white">{avgBpm || '--'}</span>
                </div>
                <p className="text-white/80 text-[11px]">Average BPM</p>
              </div>

              {/* Energy */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-lg">⚡</span>
                  <span className="text-xl font-bold text-white">{avgEnergy}%</span>
                </div>
                <p className="text-white/80 text-[11px]">Energy Level</p>
              </div>

              {/* Underground Gems */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-lg">💎</span>
                  <span className="text-xl font-bold text-white">{undergroundGemsCount}</span>
                </div>
                <p className="text-white/80 text-[11px]">Underground Gems</p>
              </div>
            </div>

            {/* Mobile: Underground Index prominent + 2x2 grid for others */}
            <div className="md:hidden">
              {/* Underground Index - Full width, prominent */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="text-xl">🔥</span>
                  <span 
                    className="text-2xl font-bold"
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
                <div className="w-full max-w-xs h-2 rounded-full bg-white/10 overflow-hidden mx-auto mb-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${undergroundIndex}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ 
                      background: `linear-gradient(to right, ${undergroundColors.from}, ${undergroundColors.to})`,
                      boxShadow: `0 0 8px ${undergroundColors.from}50`
                    }}
                  />
                </div>
                <p className="text-white/80 text-xs">{getUndergroundLabel(undergroundIndex)}</p>
              </div>

              {/* Other stats - 3 in a row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="text-base">🎵</span>
                    <span className="text-lg font-bold text-white">{avgBpm || '--'}</span>
                  </div>
                  <p className="text-white/80 text-[10px]">BPM</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="text-base">⚡</span>
                    <span className="text-lg font-bold text-white">{avgEnergy}%</span>
                  </div>
                  <p className="text-white/80 text-[10px]">Energy</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="text-base">💎</span>
                    <span className="text-lg font-bold text-white">{undergroundGemsCount}</span>
                  </div>
                  <p className="text-white/80 text-[10px]">Gems</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Tracks Inline - Desktop only */}
          {topTracks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden md:block text-center mb-4"
            >
              <p className="text-white/90 text-sm">
                <span className="font-semibold">Top Tracks:</span>{' '}
                <span className="text-white/80">{displayTracksText}</span>
              </p>
            </motion.div>
          )}

          {/* Share Button + Footer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button
              onClick={onShare}
              size="default"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-sm md:text-base font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 rounded-xl mb-2"
            >
              <Share2 className="w-4 h-4" />
              Share My Identity
            </Button>
            <p className="text-white/60 text-[11px] md:text-xs">
              musicdna.tobiafo.com
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MusicalIdentityHero;
