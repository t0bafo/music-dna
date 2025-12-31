import { useMemo } from 'react';
import { CrateTrack } from '@/lib/crates-api';

interface CrateQualityScoreProps {
  tracks: CrateTrack[];
}

interface QualityScore {
  flow: number;
  balance: number;
  underground: number;
  length: number;
  total: number;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateQualityScore(tracks: CrateTrack[]): QualityScore {
  let flowScore = 3;
  let balanceScore = 3;
  let undergroundScore = 2;
  let lengthScore = 2;

  // Flow score (smooth transitions)
  const tracksWithEnergy = tracks.filter(t => t.energy !== undefined && t.energy !== null);
  if (tracksWithEnergy.length >= 3) {
    const energyValues = tracksWithEnergy.map(t => t.energy!);
    let sharpJumps = 0;
    
    for (let i = 1; i < energyValues.length; i++) {
      if (Math.abs(energyValues[i] - energyValues[i - 1]) > 0.3) {
        sharpJumps++;
      }
    }
    
    flowScore = Math.max(0, 3 - (sharpJumps * 0.5));
  }

  // Balance score (variety in energy)
  if (tracksWithEnergy.length > 0) {
    const avgEnergy = average(tracksWithEnergy.map(t => t.energy!));
    const energyVariety = tracksWithEnergy.filter(t => Math.abs(t.energy! - avgEnergy) > 0.2).length / tracksWithEnergy.length;
    
    if (energyVariety < 0.2) balanceScore = 1.5;
    else if (energyVariety < 0.4) balanceScore = 2.5;
    else balanceScore = 3;
  }

  // Underground score
  const tracksWithPopularity = tracks.filter(t => t.popularity !== undefined && t.popularity !== null);
  if (tracksWithPopularity.length > 0) {
    const undergroundPercent = (tracksWithPopularity.filter(t => (t.popularity || 0) < 50).length / tracksWithPopularity.length) * 100;
    if (undergroundPercent < 20) undergroundScore = 0.5;
    else if (undergroundPercent < 40) undergroundScore = 1;
    else if (undergroundPercent < 60) undergroundScore = 1.5;
    else undergroundScore = 2;
  }

  // Length score (sweet spot: 30-90 min)
  const totalMinutes = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / 1000 / 60;
  if (totalMinutes < 15) lengthScore = 1;
  else if (totalMinutes < 30) lengthScore = 1.5;
  else if (totalMinutes <= 90) lengthScore = 2;
  else lengthScore = 1.5; // Too long

  return {
    flow: Number(flowScore.toFixed(1)),
    balance: Number(balanceScore.toFixed(1)),
    underground: Number(undergroundScore.toFixed(1)),
    length: Number(lengthScore.toFixed(1)),
    total: Number((flowScore + balanceScore + undergroundScore + lengthScore).toFixed(1)),
  };
}

function ScoreItem({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{score}/{maxScore}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function CrateQualityScore({ tracks }: CrateQualityScoreProps) {
  const score = useMemo(() => calculateQualityScore(tracks), [tracks]);

  // Need at least 5 tracks for meaningful score
  if (tracks.length < 5) return null;

  const getScoreColor = (total: number) => {
    if (total >= 8) return 'text-primary';
    if (total >= 6) return 'text-amber-400';
    return 'text-orange-400';
  };

  const getScoreLabel = (total: number) => {
    if (total >= 9) return 'Exceptional 🔥';
    if (total >= 8) return 'Great';
    if (total >= 7) return 'Good';
    if (total >= 6) return 'Decent';
    return 'Needs work';
  };

  const getScoreEmoji = (total: number) => {
    if (total >= 8) return '🔥';
    if (total >= 6) return '👍';
    return '💡';
  };

  return (
    <div className="mb-6 p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Crate Quality
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(score.total)}`}>
              {score.total}
            </span>
            <span className="text-xl text-muted-foreground">/10</span>
            <span className="text-sm font-medium text-foreground ml-1">
              {getScoreLabel(score.total)}
            </span>
          </div>
        </div>

        <div className="text-5xl">
          {getScoreEmoji(score.total)}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="pt-4 border-t border-border/50 space-y-3">
        <ScoreItem label="Flow" score={score.flow} maxScore={3} />
        <ScoreItem label="Balance" score={score.balance} maxScore={3} />
        <ScoreItem label="Underground" score={score.underground} maxScore={2} />
        <ScoreItem label="Length" score={score.length} maxScore={2} />
      </div>
    </div>
  );
}
