import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderPlus, Music2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Crate } from '@/lib/crates-api';

interface SelectionTrayProps {
  selectedCount: number;
  targetCrate: Crate | null;
  isAdding: boolean;
  onAddToCrate: () => void;
  onSaveAsNewCrate: () => void;
  onOpenInSpotify: () => void;
  onClear: () => void;
}

export function SelectionTray({
  selectedCount,
  targetCrate,
  isAdding,
  onAddToCrate,
  onSaveAsNewCrate,
  onOpenInSpotify,
  onClear,
}: SelectionTrayProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        >
          <div className="bg-card/95 backdrop-blur-xl border-t-2 border-primary shadow-2xl">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-base sm:text-lg font-semibold text-foreground">
                  {selectedCount} selected
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {targetCrate && (
                    <Button
                      onClick={onAddToCrate}
                      disabled={isAdding}
                      className="gap-2"
                    >
                      {isAdding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Add to</span>{' '}
                      {targetCrate.emoji} {targetCrate.name}
                    </Button>
                  )}

                  <Button
                    onClick={onSaveAsNewCrate}
                    variant="outline"
                    className="gap-2 border-primary text-primary hover:bg-primary/10"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Save as New Crate</span>
                    <span className="sm:hidden">New Crate</span>
                  </Button>

                  <Button
                    onClick={onOpenInSpotify}
                    variant="outline"
                    className="gap-2"
                  >
                    <Music2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Open in Spotify</span>
                    <span className="sm:hidden">Spotify</span>
                  </Button>

                  <Button
                    onClick={onClear}
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
