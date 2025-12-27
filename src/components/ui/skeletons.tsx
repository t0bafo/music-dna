import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// Skeleton for a track row in crate detail
export function TrackRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-card/40 rounded-xl border border-border/30",
      className
    )}>
      {/* Drag handle placeholder */}
      <Skeleton className="w-5 h-5 rounded" />
      
      {/* Position number */}
      <Skeleton className="w-5 h-5 rounded" />
      
      {/* Album art */}
      <Skeleton className="w-10 h-10 lg:w-12 lg:h-12 rounded-md shrink-0" />
      
      {/* Track info */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      
      {/* Actions */}
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
    </div>
  );
}

// Skeleton for crate cards in grid
export function CrateCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex flex-col p-5 lg:p-6 rounded-2xl border border-border/40 bg-card/40 min-h-[220px]",
      className
    )}>
      {/* Emoji placeholder */}
      <Skeleton className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl mb-4" />
      
      {/* Title */}
      <Skeleton className="h-5 w-3/4 rounded mb-2" />
      
      {/* Description */}
      <Skeleton className="h-3 w-full rounded mb-1" />
      <Skeleton className="h-3 w-2/3 rounded mb-4" />
      
      {/* Stats */}
      <div className="mt-auto flex items-center gap-2">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  );
}

// Skeleton grid for crates
export function CrateGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CrateCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton for track search results
export function SearchResultSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl",
      className
    )}>
      {/* Album art */}
      <Skeleton className="w-10 h-10 rounded-md shrink-0" />
      
      {/* Track info */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      
      {/* Add button */}
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
    </div>
  );
}

// Skeleton list for search results
export function SearchResultsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <SearchResultSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton for track list in crate detail
export function TrackListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TrackRowSkeleton key={i} />
      ))}
    </div>
  );
}
