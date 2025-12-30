import { useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CrateSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  bpmFilter: [number, number] | null;
  onBpmFilterChange: (filter: [number, number] | null) => void;
  energyFilter: 'low' | 'medium' | 'high' | null;
  onEnergyFilterChange: (filter: 'low' | 'medium' | 'high' | null) => void;
  filteredCount: number;
  totalCount: number;
}

const BPM_PRESETS: { label: string; range: [number, number] | null }[] = [
  { label: 'Any BPM', range: null },
  { label: '60-90 (Slow)', range: [60, 90] },
  { label: '90-110 (Mid)', range: [90, 110] },
  { label: '110-130 (Dance)', range: [110, 130] },
  { label: '130-150 (High Energy)', range: [130, 150] },
  { label: '150+ (Fast)', range: [150, 200] },
];

const ENERGY_OPTIONS: { label: string; value: 'low' | 'medium' | 'high' | null; description: string }[] = [
  { label: 'Any Energy', value: null, description: 'Show all tracks' },
  { label: 'Low', value: 'low', description: 'Chill & mellow' },
  { label: 'Medium', value: 'medium', description: 'Balanced vibes' },
  { label: 'High', value: 'high', description: 'Peak energy' },
];

export function CrateSearchBar({
  searchQuery,
  onSearchChange,
  bpmFilter,
  onBpmFilterChange,
  energyFilter,
  onEnergyFilterChange,
  filteredCount,
  totalCount,
}: CrateSearchBarProps) {
  const hasActiveFilters = searchQuery || bpmFilter || energyFilter;

  const clearAllFilters = () => {
    onSearchChange('');
    onBpmFilterChange(null);
    onEnergyFilterChange(null);
  };

  const getBpmLabel = () => {
    if (!bpmFilter) return 'BPM';
    return `${bpmFilter[0]}-${bpmFilter[1]}`;
  };

  const getEnergyLabel = () => {
    if (!energyFilter) return 'Energy';
    return energyFilter.charAt(0).toUpperCase() + energyFilter.slice(1);
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Search Input Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, artist, or album..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 bg-card/60 border-border/40 focus:border-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* BPM Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "gap-1.5 min-w-[80px]",
                bpmFilter && "border-primary/50 text-primary"
              )}
            >
              {getBpmLabel()}
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/50">
            <DropdownMenuLabel className="text-xs text-muted-foreground">BPM Range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {BPM_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onClick={() => onBpmFilterChange(preset.range)}
                className={cn(
                  "cursor-pointer",
                  JSON.stringify(bpmFilter) === JSON.stringify(preset.range) && "bg-primary/10 text-primary"
                )}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Energy Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "gap-1.5 min-w-[90px]",
                energyFilter && "border-primary/50 text-primary"
              )}
            >
              {getEnergyLabel()}
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/50">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Energy Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ENERGY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.label}
                onClick={() => onEnergyFilterChange(option.value)}
                className={cn(
                  "cursor-pointer flex flex-col items-start",
                  energyFilter === option.value && "bg-primary/10 text-primary"
                )}
              >
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters & Count */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 bg-secondary/50">
                "{searchQuery}"
                <button onClick={() => onSearchChange('')} className="ml-0.5 hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {bpmFilter && (
              <Badge variant="secondary" className="gap-1 bg-secondary/50">
                {bpmFilter[0]}-{bpmFilter[1]} BPM
                <button onClick={() => onBpmFilterChange(null)} className="ml-0.5 hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {energyFilter && (
              <Badge variant="secondary" className="gap-1 bg-secondary/50 capitalize">
                {energyFilter} energy
                <button onClick={() => onEnergyFilterChange(null)} className="ml-0.5 hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-muted-foreground">
              {filteredCount} of {totalCount}
            </span>
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-xs">
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
