import { Music, Globe, Gem } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface IdentityStatCardsProps {
  avgBpm: number;
  avgEnergy: number;
  undergroundPercent: number;
  hiddenGemsCount: number;
  isLoading: boolean;
}

const getBpmLabel = (bpm: number) => {
  if (bpm < 90) return 'Downtempo';
  if (bpm < 110) return 'Mid-tempo';
  if (bpm < 130) return 'Uptempo';
  return 'High-tempo';
};

const getReachLabel = (underground: number) => {
  if (underground < 30) return 'Mainstream focused';
  if (underground < 50) return 'Balanced taste';
  if (underground < 70) return 'Deep digger';
  return 'Underground expert';
};

const IdentityStatCards = ({
  avgBpm,
  avgEnergy,
  undergroundPercent,
  hiddenGemsCount,
  isLoading,
}: IdentityStatCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/70 backdrop-blur-xl border-border/40">
            <CardContent className="p-6">
              <Skeleton className="w-8 h-8 rounded-lg mb-4" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: Music,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      title: 'Your Sound',
      mainStat: `${avgBpm} BPM`,
      subStat: `${avgEnergy}% Energy`,
      description: getBpmLabel(avgBpm),
      delay: 0.6,
    },
    {
      icon: Globe,
      iconColor: 'text-chart-purple',
      iconBg: 'bg-chart-purple/10',
      title: 'Your Reach',
      mainStat: `${undergroundPercent}%`,
      subStat: 'Underground',
      description: getReachLabel(undergroundPercent),
      delay: 0.7,
    },
    {
      icon: Gem,
      iconColor: 'text-chart-cyan',
      iconBg: 'bg-chart-cyan/10',
      title: 'Hidden Gems',
      mainStat: `${hiddenGemsCount}`,
      subStat: 'tracks <50k',
      description: hiddenGemsCount > 10 ? 'True curator' : 'Dig deeper!',
      delay: 0.8,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay, duration: 0.4 }}
        >
          <Card className="bg-card/70 backdrop-blur-xl border-border/40 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full">
            <CardContent className="p-6">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-4`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {card.title}
              </h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl lg:text-3xl font-bold text-foreground">
                  {card.mainStat}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {card.subStat}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {card.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default IdentityStatCards;
