import { FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EmptyCratesStateProps {
  onCreateCrate: () => void;
}

const exampleCrates = [
  {
    emoji: '🌙',
    name: 'Late Night Drives',
    description: 'Mid-tempo Afrobeats for calm vibes',
  },
  {
    emoji: '⚡',
    name: 'Pre-Game Energy',
    description: 'High-energy tracks to get hyped',
  },
  {
    emoji: '☀️',
    name: 'Sunday Soft Life',
    description: 'Smooth, chill songs for lazy days',
  },
  {
    emoji: '🎧',
    name: 'Deep Focus',
    description: 'Instrumental and low-energy work music',
  },
];

export const EmptyCratesState = ({ onCreateCrate }: EmptyCratesStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 sm:p-12 border border-border/50 max-w-xl mx-auto"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>

      {/* Heading */}
      <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center mb-3">
        Create Your First Crate
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-center mb-8 max-w-md mx-auto">
        Organize music by vibe, mood, or meaning—not just genre.
      </p>

      {/* Examples */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-4 font-medium">Examples:</p>
        <div className="space-y-4">
          {exampleCrates.map((crate, index) => (
            <motion.div
              key={crate.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              className="flex items-start gap-3"
            >
              <span className="text-2xl flex-shrink-0">{crate.emoji}</span>
              <div>
                <p className="font-medium text-foreground text-sm sm:text-base">
                  {crate.name}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground italic">
                  {crate.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onCreateCrate}
        size="lg"
        className="w-full h-12 text-base font-semibold gap-2"
      >
        <Plus className="w-5 h-5" />
        Create Your First Crate
      </Button>
    </motion.div>
  );
};

export default EmptyCratesState;
