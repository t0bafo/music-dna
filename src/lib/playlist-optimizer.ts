// Playlist optimization algorithm for better flow
import { TrackWithFeatures, calculateFlowScore, FlowScore } from './flow-analysis';

export interface OptimizationResult {
  optimizedTracks: TrackWithFeatures[];
  originalScore: number;
  newScore: number;
  improvement: number;
  bpmJumpsReduced: { before: number; after: number };
  dataAvailability: {
    totalTracks: number;
    tracksWithTempo: number;
    tracksWithEnergy: number;
    tracksWithBoth: number;
  };
}

// Count BPM jumps > 20 in a track list
const countBpmJumps = (tracks: TrackWithFeatures[]): number => {
  let jumps = 0;
  for (let i = 1; i < tracks.length; i++) {
    const prev = tracks[i - 1].tempo;
    const curr = tracks[i].tempo;
    if (prev != null && curr != null && Math.abs(curr - prev) > 20) {
      jumps++;
    }
  }
  return jumps;
};

// Sort tracks by a specific property
const sortByProperty = (
  tracks: TrackWithFeatures[],
  property: 'tempo' | 'energy',
  direction: 'asc' | 'desc' = 'asc'
): TrackWithFeatures[] => {
  return [...tracks].sort((a, b) => {
    const valA = a[property] ?? 0;
    const valB = b[property] ?? 0;
    return direction === 'asc' ? valA - valB : valB - valA;
  });
};

// Optimize using energy arc algorithm
export const optimizePlaylist = (tracks: TrackWithFeatures[]): OptimizationResult => {
  // Debug: Log incoming track data
  console.log('[Optimizer] Input tracks sample:', tracks.slice(0, 3).map(t => ({
    id: t.id,
    name: t.name,
    tempo: t.tempo,
    energy: t.energy,
  })));
  console.log('[Optimizer] Tracks with tempo:', tracks.filter(t => t.tempo != null).length);
  console.log('[Optimizer] Tracks with energy:', tracks.filter(t => t.energy != null).length);
  console.log('[Optimizer] Tracks with both:', tracks.filter(t => t.tempo != null && t.energy != null).length);

  const originalScore = calculateFlowScore(tracks).score;
  const originalJumps = countBpmJumps(tracks);

  if (tracks.length < 5) {
    const tracksWithTempo = tracks.filter(t => t.tempo != null).length;
    const tracksWithEnergy = tracks.filter(t => t.energy != null).length;
    const tracksWithBoth = tracks.filter(t => t.tempo != null && t.energy != null).length;
    return {
      optimizedTracks: tracks,
      originalScore,
      newScore: originalScore,
      improvement: 0,
      bpmJumpsReduced: { before: originalJumps, after: originalJumps },
      dataAvailability: {
        totalTracks: tracks.length,
        tracksWithTempo,
        tracksWithEnergy,
        tracksWithBoth,
      },
    };
  }

  // Filter tracks with valid audio features
  const tracksWithData = tracks.filter(t => t.tempo != null && t.energy != null);
  const tracksWithoutData = tracks.filter(t => t.tempo == null || t.energy == null);

  // Calculate section sizes
  const total = tracksWithData.length;
  const openerCount = Math.max(2, Math.floor(total * 0.15));
  const buildCount = Math.max(2, Math.floor(total * 0.25));
  const peakCount = Math.max(3, Math.floor(total * 0.35));
  const cooldownCount = total - openerCount - buildCount - peakCount;

  // Sort all tracks by energy for categorization
  const byEnergy = sortByProperty(tracksWithData, 'energy', 'asc');
  
  // Openers: lowest energy tracks, sorted by ascending BPM
  const openers = sortByProperty(byEnergy.slice(0, openerCount), 'tempo', 'asc');
  
  // Build section: low-medium energy, sorted by ascending BPM
  const buildTracks = sortByProperty(
    byEnergy.slice(openerCount, openerCount + buildCount),
    'tempo',
    'asc'
  );
  
  // Peak section: highest energy tracks, clustered by similar BPM
  const peakTracks = sortByProperty(
    byEnergy.slice(total - peakCount),
    'tempo',
    'asc'
  );
  
  // Cooldown: remaining medium energy tracks, descending energy
  const cooldownTracks = sortByProperty(
    byEnergy.slice(openerCount + buildCount, total - peakCount),
    'energy',
    'desc'
  );

  // Combine sections
  let optimized = [...openers, ...buildTracks, ...peakTracks, ...cooldownTracks];

  // Smooth BPM transitions within sections
  optimized = smoothBpmTransitions(optimized);

  // Add tracks without audio data at the end
  optimized = [...optimized, ...tracksWithoutData];

  const newScore = calculateFlowScore(optimized).score;
  const newJumps = countBpmJumps(optimized);

  // Calculate data availability
  const tracksWithTempo = tracks.filter(t => t.tempo != null).length;
  const tracksWithEnergy = tracks.filter(t => t.energy != null).length;

  return {
    optimizedTracks: optimized,
    originalScore,
    newScore,
    improvement: newScore - originalScore,
    bpmJumpsReduced: { before: originalJumps, after: newJumps },
    dataAvailability: {
      totalTracks: tracks.length,
      tracksWithTempo,
      tracksWithEnergy,
      tracksWithBoth: tracksWithData.length,
    },
  };
};

// Smooth BPM transitions by swapping adjacent tracks if it reduces BPM jumps
const smoothBpmTransitions = (tracks: TrackWithFeatures[]): TrackWithFeatures[] => {
  const smoothed = [...tracks];
  let improved = true;
  let iterations = 0;
  const maxIterations = 50; // Prevent infinite loops

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < smoothed.length - 2; i++) {
      const curr = smoothed[i].tempo;
      const next = smoothed[i + 1].tempo;
      const nextNext = smoothed[i + 2].tempo;

      if (curr == null || next == null || nextNext == null) continue;

      const currentJump = Math.abs(next - curr) + Math.abs(nextNext - next);
      
      // Try swapping i+1 and i+2
      const swappedJump = Math.abs(nextNext - curr) + Math.abs(next - nextNext);

      if (swappedJump < currentJump - 2) { // Must improve by at least 2 BPM
        [smoothed[i + 1], smoothed[i + 2]] = [smoothed[i + 2], smoothed[i + 1]];
        improved = true;
      }
    }
  }

  return smoothed;
};

// Calculate a quick flow score for comparison (lighter than full calculation)
export const getQuickFlowMetrics = (tracks: TrackWithFeatures[]): {
  avgBpmJump: number;
  maxBpmJump: number;
  jumpCount: number;
  energyArc: 'building' | 'flat' | 'declining';
} => {
  const tracksWithTempo = tracks.filter(t => t.tempo != null);
  
  let totalJumps = 0;
  let maxJump = 0;
  let jumpCount = 0;

  for (let i = 1; i < tracksWithTempo.length; i++) {
    const jump = Math.abs((tracksWithTempo[i].tempo || 0) - (tracksWithTempo[i - 1].tempo || 0));
    totalJumps += jump;
    if (jump > maxJump) maxJump = jump;
    if (jump > 20) jumpCount++;
  }

  const avgBpmJump = tracksWithTempo.length > 1 ? totalJumps / (tracksWithTempo.length - 1) : 0;

  // Determine energy arc
  const tracksWithEnergy = tracks.filter(t => t.energy != null);
  const midpoint = Math.floor(tracksWithEnergy.length / 2);
  const firstHalf = tracksWithEnergy.slice(0, midpoint);
  const secondHalf = tracksWithEnergy.slice(midpoint);

  const avgFirst = firstHalf.reduce((sum, t) => sum + (t.energy || 0), 0) / (firstHalf.length || 1);
  const avgSecond = secondHalf.reduce((sum, t) => sum + (t.energy || 0), 0) / (secondHalf.length || 1);

  let energyArc: 'building' | 'flat' | 'declining' = 'flat';
  if (avgSecond > avgFirst * 1.1) energyArc = 'building';
  else if (avgSecond < avgFirst * 0.9) energyArc = 'declining';

  return { avgBpmJump: Math.round(avgBpmJump), maxBpmJump: Math.round(maxJump), jumpCount, energyArc };
};
