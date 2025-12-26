import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';
import { Crate } from '@/lib/crates-api';

interface CrateCardProps {
  crate: Crate;
}

const CrateCard = ({ crate }: CrateCardProps) => {
  return (
    <Link to={`/crates/${crate.id}`}>
      <Card 
        className="group bg-card/60 backdrop-blur-xl border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden cursor-pointer h-full"
      >
        <CardContent className="p-4 lg:p-5">
          {/* Emoji & Color Header */}
          <div 
            className="w-full aspect-square rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
            style={{ backgroundColor: `${crate.color}20` }}
          >
            <span className="text-4xl lg:text-5xl">{crate.emoji}</span>
          </div>

          {/* Name */}
          <h3 className="font-display font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
            {crate.name}
          </h3>

          {/* Track Count */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Music className="w-3.5 h-3.5" />
            <span>{crate.track_count} track{crate.track_count !== 1 ? 's' : ''}</span>
          </div>

          {/* Description Preview */}
          {crate.description && (
            <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">
              {crate.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default CrateCard;
