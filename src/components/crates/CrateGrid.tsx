import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Crate } from '@/lib/crates-api';
import CrateCard from './CrateCard';

interface CrateGridProps {
  crates: Crate[];
  showViewAll?: boolean;
  totalCount?: number;
}

const CrateGrid = ({ crates, showViewAll = false, totalCount = 0 }: CrateGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
      {crates.map((crate) => (
        <CrateCard key={crate.id} crate={crate} />
      ))}
      
      {showViewAll && (
        <Link 
          to="/crates"
          className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300 text-muted-foreground hover:text-primary font-semibold min-h-[180px]"
        >
          <span>View All {totalCount}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};

export default CrateGrid;
