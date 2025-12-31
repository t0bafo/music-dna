/**
 * Types and utilities for AI-powered vibe search
 */

export interface SearchFilters {
  vibes?: string[];
  scenes?: string[];
  tempo?: 'slow' | 'midtempo' | 'uptempo' | 'fast';
  energy?: 'low' | 'medium' | 'high';
  bpmRange?: [number, number];
  exclude?: string[];
  artistHint?: string;
  trackHint?: string;
}

export interface ExpandedSearchResult {
  filters: SearchFilters | null;
  skipped?: boolean;
  error?: string;
}

// BPM ranges for tempo categories
export const TEMPO_RANGES: Record<string, [number, number]> = {
  slow: [0, 90],
  midtempo: [90, 120],
  uptempo: [120, 140],
  fast: [140, 300],
};

// Energy ranges
export const ENERGY_RANGES: Record<string, [number, number]> = {
  low: [0, 0.4],
  medium: [0.4, 0.7],
  high: [0.7, 1.0],
};

// Color mappings for filter chips
export const FILTER_COLORS = {
  vibe: 'purple',
  scene: 'blue',
  tempo: 'orange',
  energy: 'green',
} as const;

// Helper to get BPM range from filters
export function getBpmRange(filters: SearchFilters): [number, number] | undefined {
  if (filters.bpmRange) return filters.bpmRange;
  if (filters.tempo) return TEMPO_RANGES[filters.tempo];
  return undefined;
}

// Helper to get energy range from filters
export function getEnergyRange(filters: SearchFilters): [number, number] | undefined {
  if (filters.energy) return ENERGY_RANGES[filters.energy];
  return undefined;
}
