import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface AudioStats {
  tempo: { avg: number };
  danceability: { avg: number };
  energy: { avg: number };
  valence: { avg: number };
  acousticness: { avg: number };
  speechiness: { avg: number };
  instrumentalness: { avg: number };
  liveness: { avg: number };
}

interface ComparisonViewProps {
  userStats: AudioStats;
  chartStats: AudioStats;
  userLabel?: string;
  chartLabel?: string;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const ComparisonRow = ({
  label,
  userValue,
  chartValue,
  format = 'percent',
}: {
  label: string;
  userValue: number;
  chartValue: number;
  format?: 'percent' | 'bpm';
}) => {
  const diff = userValue - chartValue;
  const diffPercent = chartValue !== 0 ? (diff / chartValue) * 100 : 0;
  
  const formatValue = (v: number) => 
    format === 'bpm' ? `${Math.round(v)} BPM` : formatPercent(v);

  const getDiffIcon = () => {
    if (Math.abs(diffPercent) < 1) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (diff > 0) return <ArrowUp className="w-4 h-4 text-spotify" />;
    return <ArrowDown className="w-4 h-4 text-destructive" />;
  };

  const getDiffText = () => {
    if (Math.abs(diffPercent) < 1) return 'Same';
    const direction = diff > 0 ? 'higher' : 'lower';
    if (format === 'bpm') {
      return `${Math.abs(Math.round(diff))} BPM ${direction}`;
    }
    return `${Math.abs(diffPercent).toFixed(1)}% ${direction}`;
  };

  return (
    <div className="grid grid-cols-4 gap-4 py-3 border-b border-border last:border-0">
      <div className="font-medium text-card-foreground">{label}</div>
      <div className="text-center">
        <span className="font-bold text-spotify">{formatValue(userValue)}</span>
      </div>
      <div className="text-center">
        <span className="font-bold text-nigeria">{formatValue(chartValue)}</span>
      </div>
      <div className="flex items-center justify-end gap-2 text-sm">
        {getDiffIcon()}
        <span className="text-muted-foreground">{getDiffText()}</span>
      </div>
    </div>
  );
};

const ComparisonView = ({
  userStats,
  chartStats,
  userLabel = 'Your DNA',
  chartLabel = 'Nigeria Top 100',
}: ComparisonViewProps) => {
  // Generate insights
  const insights: string[] = [];
  
  const tempoDiff = userStats.tempo.avg - chartStats.tempo.avg;
  if (Math.abs(tempoDiff) > 5) {
    insights.push(
      `Your music is ${Math.abs(Math.round(tempoDiff))} BPM ${tempoDiff > 0 ? 'faster' : 'slower'} than Nigeria's chart`
    );
  }

  const danceDiff = (userStats.danceability.avg - chartStats.danceability.avg) * 100;
  if (Math.abs(danceDiff) > 5) {
    insights.push(
      `You prefer ${danceDiff > 0 ? 'more' : 'less'} danceable tracks by ${Math.abs(danceDiff).toFixed(1)}%`
    );
  }

  const energyDiff = userStats.energy.avg - chartStats.energy.avg;
  if (Math.abs(energyDiff) > 0.05) {
    insights.push(
      `Your energy level is ${energyDiff > 0 ? 'higher' : 'lower'} than the chart`
    );
  }

  const valenceDiff = userStats.valence.avg - chartStats.valence.avg;
  if (Math.abs(valenceDiff) > 0.05) {
    insights.push(
      `Your music is ${valenceDiff > 0 ? 'more upbeat/positive' : 'more melancholic/dark'}`
    );
  }

  return (
    <div className="bg-card rounded-xl card-shadow p-6">
      <h2 className="text-xl font-bold text-card-foreground mb-6">
        🎯 DNA Comparison
      </h2>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-6 p-4 bg-spotify/5 rounded-lg border border-spotify/20">
          <h3 className="font-semibold text-card-foreground mb-2">Key Insights</h3>
          <ul className="space-y-1">
            {insights.map((insight, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-spotify" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 pb-3 border-b-2 border-border">
            <div className="font-semibold text-muted-foreground">Feature</div>
            <div className="text-center font-semibold text-spotify">{userLabel}</div>
            <div className="text-center font-semibold text-nigeria">{chartLabel}</div>
            <div className="text-right font-semibold text-muted-foreground">Difference</div>
          </div>

          {/* Rows */}
          <ComparisonRow
            label="Tempo"
            userValue={userStats.tempo.avg}
            chartValue={chartStats.tempo.avg}
            format="bpm"
          />
          <ComparisonRow
            label="Danceability"
            userValue={userStats.danceability.avg}
            chartValue={chartStats.danceability.avg}
          />
          <ComparisonRow
            label="Energy"
            userValue={userStats.energy.avg}
            chartValue={chartStats.energy.avg}
          />
          <ComparisonRow
            label="Valence"
            userValue={userStats.valence.avg}
            chartValue={chartStats.valence.avg}
          />
          <ComparisonRow
            label="Acousticness"
            userValue={userStats.acousticness.avg}
            chartValue={chartStats.acousticness.avg}
          />
          <ComparisonRow
            label="Speechiness"
            userValue={userStats.speechiness.avg}
            chartValue={chartStats.speechiness.avg}
          />
          <ComparisonRow
            label="Instrumentalness"
            userValue={userStats.instrumentalness.avg}
            chartValue={chartStats.instrumentalness.avg}
          />
          <ComparisonRow
            label="Liveness"
            userValue={userStats.liveness.avg}
            chartValue={chartStats.liveness.avg}
          />
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
