import { useMemo } from 'react';
import { CrateTrack } from '@/lib/crates-api';
import {
  qualityScore, energyCoverage, popularitySignal, durationInfo, LOW_POPULARITY_THRESHOLD,
} from '@/lib/crate-analysis';

interface CrateQualityScoreProps {
  tracks: CrateTrack[];
}

function ScoreItem({ label, score, maxScore, note }: { label: string; score: number | null; maxScore: number; note?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1 gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground text-right">
          {score === null ? 'Not enough audio data' : `${score}/${maxScore}`}
        </span>
      </div>
      {score !== null && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${(score / maxScore) * 100}%` }} />
        </div>
      )}
      {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

export function CrateQualityScore({ tracks }: CrateQualityScoreProps) {
  const score = useMemo(() => qualityScore(tracks), [tracks]);
  const energy = useMemo(() => energyCoverage(tracks), [tracks]);
  const pop = useMemo(() => popularitySignal(tracks), [tracks]);
  const duration = useMemo(() => durationInfo(tracks), [tracks]);

  if (tracks.length < 5) return null;

  const popNote = pop.percentLow === null
    ? 'Popularity unknown for these tracks.'
    : `${pop.percentLow}% of tracks score below ${LOW_POPULARITY_THRESHOLD} on Spotify popularity (known for ${pop.coverage.available} of ${pop.coverage.total}).`;

  return (
    <section className="mb-6 p-5 rounded-xl border border-border/50 bg-card/60" aria-label="Crate quality">
      <div className="mb-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Crate Quality</div>
        {score.total !== null ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">{score.total}</span>
            <span className="text-lg text-muted-foreground">/10</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Overall score hidden until enough audio data is available.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Energy available for {energy.available} of {energy.total} tracks
        </p>
      </div>

      <div className="pt-4 border-t border-border/50 space-y-3">
        <ScoreItem label="Flow" score={score.flow} maxScore={3} />
        <ScoreItem label="Balance" score={score.balance} maxScore={3} />
        <ScoreItem label="Spotify popularity signal" score={score.underground} maxScore={2} note={popNote} />
        <ScoreItem
          label="Length"
          score={score.length}
          maxScore={2}
          note={duration.isEstimated ? `Estimated — ${duration.missingCount} track${duration.missingCount !== 1 ? 's' : ''} missing duration.` : undefined}
        />
      </div>
    </section>
  );
}
