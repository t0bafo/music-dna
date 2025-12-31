import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Archetype } from '@/lib/music-archetypes';

interface MusicalIdentityHeroProps {
  archetype: Archetype | null;
  undergroundIndex: number;
  isLoading: boolean;
  onShare: () => void;
}

const getUndergroundColor = (index: number) => {
  if (index <= 30) return 'text-yellow-500';
  if (index <= 60) return 'text-orange-500';
  if (index <= 80) return 'text-red-500';
  return 'text-purple-500';
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
  isLoading,
  onShare,
}: MusicalIdentityHeroProps) => {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-card/95 via-card/90 to-primary/10 backdrop-blur-xl border-primary/20 shadow-2xl">
        <CardContent className="py-12 px-8 lg:py-16 lg:px-12 flex flex-col items-center">
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-12 w-72 mb-4" />
          <Skeleton className="h-5 w-64 mb-8" />
          <Skeleton className="h-1 w-full max-w-md mb-8" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-36 mb-8" />
          <Skeleton className="h-10 w-44" />
        </CardContent>
      </Card>
    );
  }

  if (!archetype) {
    return (
      <Card className="bg-gradient-to-br from-card/95 via-card/90 to-primary/10 backdrop-blur-xl border-primary/20 shadow-2xl">
        <CardContent className="py-12 px-8 lg:py-16 lg:px-12 flex flex-col items-center">
          <p className="text-muted-foreground text-lg text-center">
            Listen to more music to discover your archetype
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-card/95 via-card/90 to-primary/10 backdrop-blur-xl border-primary/20 shadow-2xl overflow-hidden">
        <CardContent className="py-12 px-8 lg:py-16 lg:px-12 flex flex-col items-center relative">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-transparent to-transparent pointer-events-none" />
          
          {/* You're a */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg lg:text-xl text-muted-foreground mb-3 relative z-10"
          >
            You're a
          </motion.p>
          
          {/* Archetype Name */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary flex items-center justify-center gap-3 lg:gap-4 mb-5 relative z-10"
          >
            <span className="text-4xl lg:text-5xl">{archetype.emoji}</span>
            <span>{archetype.name}</span>
          </motion.h2>
          
          {/* Traits */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base lg:text-lg text-muted-foreground text-center max-w-lg leading-relaxed mb-8 relative z-10"
          >
            {archetype.traits.join(' • ')}
          </motion.p>
          
          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8 relative z-10"
          />
          
          {/* Underground Index */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-8 relative z-10"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🔥</span>
              <span className="text-lg lg:text-xl text-muted-foreground">Underground Index:</span>
              <span className={`text-2xl lg:text-3xl font-bold ${getUndergroundColor(undergroundIndex)}`}>
                {undergroundIndex}/100
              </span>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground">
              {getUndergroundLabel(undergroundIndex)}
            </p>
          </motion.div>
          
          {/* Share Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="relative z-10"
          >
            <Button
              onClick={onShare}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-5 text-base font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Share My Identity
              <Share2 className="w-4 h-4" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MusicalIdentityHero;
