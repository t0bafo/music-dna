import { FlowScore } from '@/lib/flow-analysis';
import { TrendingUp, TrendingDown, Minus, Music, Zap, AlertCircle } from 'lucide-react';

interface FlowScoreCardProps {
  flowScore: FlowScore;
  trackCount: number;
  tracksWithData: number;
  tracksWithTempo?: number;
  tracksWithEnergy?: number;
}

const FlowScoreCard = ({ 
  flowScore, 
  trackCount, 
  tracksWithData,
  tracksWithTempo,
  tracksWithEnergy 
}: FlowScoreCardProps) => {
  const hasMissingData = flowScore.score === 0 && tracksWithData < 2;
  const hasTempoOnly = (tracksWithTempo ?? 0) >= 2 && (tracksWithEnergy ?? 0) < 2;

  const getScoreColor = () => {
    if (hasMissingData) return 'text-muted-foreground';
    if (flowScore.color === 'green') return 'text-green-500';
    if (flowScore.color === 'yellow') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = () => {
    if (hasMissingData) return 'bg-muted/50 border-border';
    if (flowScore.color === 'green') return 'bg-green-500/10 border-green-500/30';
    if (flowScore.color === 'yellow') return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getIcon = () => {
    if (hasMissingData) return <AlertCircle className="w-8 h-8" />;
    if (flowScore.color === 'green') return <TrendingUp className="w-8 h-8" />;
    if (flowScore.color === 'yellow') return <Minus className="w-8 h-8" />;
    return <TrendingDown className="w-8 h-8" />;
  };

  return (
    <div className={`bg-card rounded-xl p-6 card-shadow border ${getScoreBgColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-1">Flow Score</h3>
          <p className="text-sm text-muted-foreground">
            Based on {tracksWithData} of {trackCount} tracks analyzed
          </p>
        </div>
        <div className={`${getScoreColor()}`}>
          {getIcon()}
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <span className={`text-5xl font-bold ${getScoreColor()}`}>
          {hasMissingData ? '—' : flowScore.score}
        </span>
        {!hasMissingData && <span className="text-2xl text-muted-foreground">/100</span>}
      </div>

      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getScoreBgColor()} ${getScoreColor()}`}>
        {hasMissingData ? 'Insufficient Data' : flowScore.grade}
      </div>

      {hasMissingData ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Flow score requires both BPM and energy data to calculate.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span className={tracksWithTempo && tracksWithTempo >= 2 ? 'text-green-500' : 'text-muted-foreground'}>
                BPM Data: {tracksWithTempo ?? 0} tracks
                {tracksWithTempo && tracksWithTempo >= 2 && ' ✓'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className={tracksWithEnergy && tracksWithEnergy >= 2 ? 'text-green-500' : 'text-muted-foreground'}>
                Energy Data: {tracksWithEnergy ?? 0} tracks
                {(!tracksWithEnergy || tracksWithEnergy < 2) && ' (missing)'}
              </span>
            </div>
          </div>
          {hasTempoOnly && (
            <p className="text-xs text-muted-foreground mt-2">
              💡 BPM optimization still works! Use "Auto-Optimize" to improve transitions.
            </p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">
          {flowScore.summary}
        </p>
      )}
    </div>
  );
};

export default FlowScoreCard;
