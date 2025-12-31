import { useState, useEffect } from 'react';
import { Check, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCrates } from '@/hooks/use-crates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'last-used-crate-id';

interface TargetCrateSelectorProps {
  selectedCrateId: string | null;
  onSelectCrate: (crateId: string | null) => void;
  onCreateNew: () => void;
}

export function TargetCrateSelector({
  selectedCrateId,
  onSelectCrate,
  onCreateNew,
}: TargetCrateSelectorProps) {
  const { data: crates = [] } = useCrates();
  
  // Load last used crate from localStorage on mount
  useEffect(() => {
    if (!selectedCrateId && crates.length > 0) {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && crates.find(c => c.id === savedId)) {
        onSelectCrate(savedId);
      }
    }
  }, [crates, selectedCrateId, onSelectCrate]);

  // Save to localStorage when selection changes
  useEffect(() => {
    if (selectedCrateId) {
      localStorage.setItem(STORAGE_KEY, selectedCrateId);
    }
  }, [selectedCrateId]);

  const selectedCrate = crates.find(c => c.id === selectedCrateId);

  if (crates.length === 0) {
    return (
      <div className="sticky top-0 bg-card/95 backdrop-blur-xl z-10 py-3 border-b border-border/30">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <span className="text-sm font-medium text-muted-foreground">
            No crates yet.
          </span>
          <Button onClick={onCreateNew} variant="default" size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Create Your First Crate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 bg-card/95 backdrop-blur-xl z-10 py-3 border-b border-border/30">
      <div className="flex items-center gap-3 max-w-2xl mx-auto flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          Adding to:
        </span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 max-w-xs justify-between gap-2 h-10",
                selectedCrate && "border-primary/50"
              )}
            >
              {selectedCrate ? (
                <span className="flex items-center gap-2 truncate">
                  <span>{selectedCrate.emoji || '📦'}</span>
                  <span className="truncate">{selectedCrate.name}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Choose a crate...</span>
              )}
              <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-64 bg-card/95 backdrop-blur-xl border-border/50"
          >
            <div className="max-h-[240px] overflow-y-auto">
              {crates.slice(0, 20).map((crate) => (
                <DropdownMenuItem
                  key={crate.id}
                  onClick={() => onSelectCrate(crate.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-lg">{crate.emoji || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{crate.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {crate.track_count} track{crate.track_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedCrateId === crate.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            {crates.length > 20 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  Showing first 20 crates
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedCrate && (
          <Check className="w-5 h-5 text-primary shrink-0" />
        )}

        <Button
          onClick={onCreateNew}
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create New
        </Button>
      </div>
    </div>
  );
}

// Export hook for external use
export function useTargetCrate() {
  const [targetCrateId, setTargetCrateId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  return {
    targetCrateId,
    setTargetCrateId,
  };
}
