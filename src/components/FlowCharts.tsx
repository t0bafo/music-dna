import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceDot,
} from 'recharts';
import { TrackWithFeatures } from '@/lib/flow-analysis';

interface FlowChartsProps {
  tracks: TrackWithFeatures[];
  onTrackClick?: (index: number) => void;
}

const FlowCharts = ({ tracks, onTrackClick }: FlowChartsProps) => {
  const chartData = useMemo(() => {
    return tracks.map((track, index) => ({
      position: index + 1,
      name: track.name,
      artist: track.artist,
      bpm: track.tempo ? Math.round(track.tempo) : null,
      energy: track.energy ? Math.round(track.energy * 100) : null,
      hasSharpBpmChange: index > 0 && track.tempo && tracks[index - 1]?.tempo
        ? Math.abs(track.tempo - (tracks[index - 1]?.tempo || 0)) > 20
        : false,
    }));
  }, [tracks]);

  const sharpJumps = chartData.filter(d => d.hasSharpBpmChange);

  // Find peak energy
  const peakEnergy = useMemo(() => {
    let peak = { position: 0, energy: 0 };
    chartData.forEach(d => {
      if (d.energy && d.energy > peak.energy) {
        peak = { position: d.position, energy: d.energy };
      }
    });
    return peak;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-popover-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.artist}</p>
          <div className="mt-2 space-y-1">
            {data.bpm && (
              <p className="text-sm">
                <span className="text-muted-foreground">BPM:</span>{' '}
                <span className="font-medium text-popover-foreground">{data.bpm}</span>
              </p>
            )}
            {data.energy && (
              <p className="text-sm">
                <span className="text-muted-foreground">Energy:</span>{' '}
                <span className="font-medium text-popover-foreground">{data.energy}%</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.position && onTrackClick) {
      onTrackClick(data.activePayload[0].payload.position - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* BPM Chart */}
      <div className="bg-card rounded-xl p-6 card-shadow">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">BPM Over Time</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Track position vs. tempo. Red dots indicate sharp jumps (&gt;20 BPM change).
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              onClick={handleChartClick}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="position" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="bpm"
                stroke="hsl(var(--spotify))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--spotify))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: 'hsl(var(--spotify))' }}
                connectNulls
              />
              {sharpJumps.map(jump => (
                <ReferenceDot
                  key={jump.position}
                  x={jump.position}
                  y={jump.bpm || 0}
                  r={6}
                  fill="hsl(var(--destructive))"
                  stroke="none"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Energy Chart */}
      <div className="bg-card rounded-xl p-6 card-shadow">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Energy Over Time</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Energy progression through the playlist. Star marks the peak energy point.
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData} 
              onClick={handleChartClick}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--spotify))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--spotify))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="position" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="hsl(var(--spotify))"
                strokeWidth={2}
                fill="url(#energyGradient)"
                connectNulls
              />
              {peakEnergy.energy > 0 && (
                <ReferenceDot
                  x={peakEnergy.position}
                  y={peakEnergy.energy}
                  r={8}
                  fill="hsl(var(--spotify))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FlowCharts;
