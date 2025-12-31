import { useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface CratesSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearching: boolean;
  onClear: () => void;
  placeholder?: string;
}

export function CratesSearchBar({
  value,
  onChange,
  isSearching,
  onClear,
  placeholder = "Search your crates...",
}: CratesSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle ESC key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && value) {
        onClear();
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [value, onClear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[800px] mx-auto mb-6"
    >
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search your crates"
          className="h-14 pl-12 pr-12 text-base bg-card border-2 border-border/50 rounded-xl 
                     focus:border-primary focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
                     shadow-sm hover:border-border transition-colors"
        />
        
        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                aria-label="Clear search"
                className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
