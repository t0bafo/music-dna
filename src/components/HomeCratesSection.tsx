import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCrates } from '@/hooks/use-crates';
import { Loader2, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CreateCrateModal from '@/components/crates/CreateCrateModal';
import { cn } from '@/lib/utils';

const HomeCratesSection = () => {
  const navigate = useNavigate();
  const { data: crates = [], isLoading } = useCrates();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Show first 5 crates
  const displayCrates = crates.slice(0, 5);
  const hasMoreCrates = crates.length > 5;

  if (isLoading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
          🗂️ Your Crates
        </h2>
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 text-center border border-border/50">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
        🗂️ Your Crates
      </h2>

      {/* Horizontal scroll container */}
      <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-x-visible lg:flex-wrap scrollbar-hide">
        {displayCrates.length > 0 ? (
          <>
            {displayCrates.map((crate) => (
              <Link
                key={crate.id}
                to={`/crates/${crate.id}`}
                className="shrink-0 w-[140px] lg:w-[160px]"
              >
                <div className="group bg-card/60 backdrop-blur-xl rounded-xl border border-border/50 hover:border-primary/30 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg h-full">
                  {/* Emoji */}
                  <div 
                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${crate.color}25` }}
                  >
                    <span className="text-2xl lg:text-3xl">{crate.emoji}</span>
                  </div>
                  
                  {/* Name */}
                  <p className="font-semibold text-sm text-foreground truncate mb-1 group-hover:text-primary transition-colors">
                    {crate.name}
                  </p>
                  
                  {/* Track count */}
                  <p className="text-xs text-muted-foreground">
                    {crate.track_count} track{crate.track_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}

            {/* See All button - inline with cards */}
            {hasMoreCrates && (
              <Link
                to="/crates"
                className="shrink-0 w-[140px] lg:w-[160px] flex items-center justify-center"
              >
                <div className="flex items-center gap-2 text-primary font-bold hover:underline">
                  <span>See All</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            )}
          </>
        ) : (
          /* Empty state - create first crate */
          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 w-[140px] lg:w-[160px] group"
          >
            <div className="bg-card/40 backdrop-blur-xl rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 p-4 transition-all duration-200 hover:-translate-y-1 h-full flex flex-col items-center justify-center text-center min-h-[140px]">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Create your first crate
              </p>
            </div>
          </button>
        )}

        {/* If user has crates but wants to create more */}
        {displayCrates.length > 0 && !hasMoreCrates && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 w-[140px] lg:w-[160px] group"
          >
            <div className="bg-card/40 backdrop-blur-xl rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 p-4 transition-all duration-200 hover:-translate-y-1 h-full flex flex-col items-center justify-center text-center min-h-[130px]">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                New Crate
              </p>
            </div>
          </button>
        )}
      </div>

      {/* View All link for mobile when there are more */}
      {hasMoreCrates && (
        <div className="mt-3 lg:hidden">
          <Link 
            to="/crates" 
            className="text-sm text-primary font-bold flex items-center gap-1 hover:underline"
          >
            See All {crates.length} Crates
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <CreateCrateModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </motion.section>
  );
};

export default HomeCratesSection;
