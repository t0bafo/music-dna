import { SearchFilters } from '@/lib/vibe-search-types';
import { FilterChip } from './FilterChip';
import { Sparkles } from 'lucide-react';

interface InterpretedFiltersProps {
  filters: SearchFilters;
  onRemoveVibe: (vibe: string) => void;
  onRemoveScene: (scene: string) => void;
  onRemoveTempo: () => void;
  onRemoveEnergy: () => void;
}

export function InterpretedFilters({
  filters,
  onRemoveVibe,
  onRemoveScene,
  onRemoveTempo,
  onRemoveEnergy,
}: InterpretedFiltersProps) {
  const hasFilters =
    (filters.vibes && filters.vibes.length > 0) ||
    (filters.scenes && filters.scenes.length > 0) ||
    filters.tempo ||
    filters.energy;

  if (!hasFilters) return null;

  return (
    <div className="mb-4 p-4 bg-card/60 backdrop-blur-sm rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary" />
        <span>What we understood:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Vibe chips */}
        {filters.vibes?.map(vibe => (
          <FilterChip
            key={`vibe-${vibe}`}
            label="Vibe"
            value={vibe}
            onRemove={() => onRemoveVibe(vibe)}
            color="purple"
          />
        ))}

        {/* Scene chips */}
        {filters.scenes?.map(scene => (
          <FilterChip
            key={`scene-${scene}`}
            label="Scene"
            value={scene}
            onRemove={() => onRemoveScene(scene)}
            color="blue"
          />
        ))}

        {/* Tempo chip */}
        {filters.tempo && (
          <FilterChip
            label="Tempo"
            value={filters.tempo}
            onRemove={onRemoveTempo}
            color="orange"
          />
        )}

        {/* Energy chip */}
        {filters.energy && (
          <FilterChip
            label="Energy"
            value={filters.energy}
            onRemove={onRemoveEnergy}
            color="green"
          />
        )}
      </div>
    </div>
  );
}
