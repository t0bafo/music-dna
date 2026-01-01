import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';
import { Crate } from '@/lib/crates-api';
import { useHaptics } from '@/hooks/use-haptics';

interface CrateCardProps {
  crate: Crate;
}

const CrateCard = ({ crate }: CrateCardProps) => {
  const { lightTap } = useHaptics();

  return (
    <Link to={`/crates/${crate.id}`} onClick={lightTap}>
      <Card 
        className="group bg-card/70 backdrop-blur-xl border-border/40 hover:border-primary/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl overflow-hidden cursor-pointer h-full"
      >
        <CardContent className="p-5 lg:p-6">
          {/* Emoji & Color Header */}
          <div 
            className="w-full aspect-square rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-[1.02]"
            style={{ backgroundColor: `${crate.color}18` }}
          >
            <span className="text-5xl lg:text-6xl">{crate.emoji}</span>
          </div>

          {/* Name */}
          <h3 className="font-display text-lg lg:text-xl font-bold text-foreground truncate mb-1.5 group-hover:text-primary transition-colors">
            {crate.name}
          </h3>

          {/* Track Count */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Music className="w-3.5 h-3.5" />
            <span>{crate.track_count} track{crate.track_count !== 1 ? 's' : ''}</span>
          </div>

          {/* Description Preview */}
          {crate.description && (
            <p className="text-sm text-muted-foreground/80 mt-2.5 line-clamp-2 leading-relaxed">
              {crate.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default CrateCard;
