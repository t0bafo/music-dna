import { FlowScore } from '@/lib/flow-analysis';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FlowScoreCardProps {
  flowScore: FlowScore;
  trackCount: number;
  tracksWithData: number;
}

const FlowScoreCard = ({ flowScore, trackCount, tracksWithData }: FlowScoreCardProps) => {
  const getScoreColor = () => {
    if (flowScore.color === 'green') return 'text-green-500';
    if (flowScore.color === 'yellow') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = () => {
    if (flowScore.color === 'green') return 'bg-green-500/10 border-green-500/30';
    if (flowScore.color === 'yellow') return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getIcon = () => {
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
          {flowScore.score}
        </span>
        <span className="text-2xl text-muted-foreground">/100</span>
      </div>

      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getScoreBgColor()} ${getScoreColor()}`}>
        {flowScore.grade}
      </div>

      <p className="text-muted-foreground">
        {flowScore.summary}
      </p>
    </div>
  );
};

export default FlowScoreCard;
