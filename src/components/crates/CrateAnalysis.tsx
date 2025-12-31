import { CrateTrack } from '@/lib/crates-api';
import { CrateStats } from './CrateStats';
import { CrateQualityScore } from './CrateQualityScore';
import { CrateFlowVisualization } from './CrateFlowVisualization';

interface CrateAnalysisProps {
  tracks: CrateTrack[];
}

/**
 * Crate Analysis Section
 * Shows stats, quality score, and flow analysis for curated crates
 * Only renders when there are enough tracks for meaningful analysis (3+)
 */
export function CrateAnalysis({ tracks }: CrateAnalysisProps) {
  // Don't show analysis for crates with fewer than 3 tracks
  if (tracks.length < 3) return null;

  return (
    <div className="mb-6">
      {/* Stats Cards */}
      <CrateStats tracks={tracks} />
      
      {/* Quality Score (5+ tracks) */}
      <CrateQualityScore tracks={tracks} />
      
      {/* Flow Visualization (3+ tracks with energy data) */}
      <CrateFlowVisualization tracks={tracks} />
    </div>
  );
}
