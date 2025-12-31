import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { CrateTrack } from '@/lib/crates-api';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface CrateFlowVisualizationProps {
  tracks: CrateTrack[];
}

interface FlowInsight {
  type: 'success' | 'warning';
  message: string;
}

function analyzeFlow(flowData: { position: number; energy: number; bpm: number; name: string }[]): FlowInsight[] {
  const insights: FlowInsight[] = [];

  if (flowData.length < 3) {
    return insights;
  }

  // Check for sharp energy jumps
  let hasSharpJump = false;
  for (let i = 1; i < flowData.length; i++) {
    const energyDiff = Math.abs(flowData[i].energy - flowData[i - 1].energy);
    if (energyDiff > 30) {
      hasSharpJump = true;
      insights.push({
        type: 'warning',
        message: `Sharp energy change between tracks ${i} and ${i + 1} (${Math.round(energyDiff)}% jump). Consider reordering for smoother flow.`,
      });
      break;
    }
  }

  if (!hasSharpJump) {
    insights.push({
      type: 'success',
      message: 'Great flow! Energy transitions smoothly between tracks.',
    });
  }

  // Check for variety
  const energyValues = flowData.map(d => d.energy);
  const energyStdDev = standardDeviation(energyValues);
  
  if (energyStdDev < 10) {
    insights.push({
      type: 'warning',
      message: 'Energy stays very consistent. Consider adding 1-2 tracks with different energy for variety.',
    });
  }

  // Check for good arc (builds or winds down)
  const thirdLength = Math.max(1, Math.floor(flowData.length / 3));
  const firstThirdAvg = average(energyValues.slice(0, thirdLength));
  const lastThirdAvg = average(energyValues.slice(-thirdLength));
  
  if (lastThirdAvg > firstThirdAvg + 15) {
    insights.push({
      type: 'success',
      message: 'Great buildup! Energy increases toward the end.',
    });
  } else if (lastThirdAvg < firstThirdAvg - 15) {
    insights.push({
      type: 'success',
      message: 'Great wind-down! Energy decreases for a smooth ending.',
    });
  }

  return insights.slice(0, 3); // Max 3 insights
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = average(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function CrateFlowVisualization({ tracks }: CrateFlowVisualizationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const flowData = useMemo(() => {
    return tracks.map((track, index) => ({
      position: index + 1,
      energy: Math.round((track.energy || 0.5) * 100),
      bpm: track.bpm || 0,
      name: track.name || 'Unknown',
      artist: track.artist_name || 'Unknown',
    }));
  }, [tracks]);

  const insights = useMemo(() => analyzeFlow(flowData), [flowData]);

  // Need at least 3 tracks with energy data for meaningful analysis
  const tracksWithEnergy = tracks.filter(t => t.energy !== undefined && t.energy !== null);
  if (tracksWithEnergy.length < 3) return null;

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between py-3 px-4 h-auto text-sm font-medium hover:bg-card/80 rounded-xl border border-border/30"
      >
        <span className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          View Flow Analysis
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
              <h3 className="text-base font-semibold text-foreground mb-4">Energy Flow</h3>

              {/* Chart */}
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={flowData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="position" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      width={35}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border text-sm">
                            <div className="font-semibold truncate max-w-[200px]">{data.name}</div>
                            <div className="text-muted-foreground truncate">{data.artist}</div>
                            <div className="mt-1 text-xs">
                              Energy: {data.energy}%
                              {data.bpm > 0 && ` • BPM: ${data.bpm}`}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2.5}
                      dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Insights */}
              {insights.length > 0 && (
                <div className="mt-5 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Insights
                  </div>
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className={`
                        flex items-start gap-2 p-3 rounded-lg text-sm
                        ${insight.type === 'warning' 
                          ? 'bg-amber-500/10 text-amber-200' 
                          : 'bg-primary/10 text-primary'
                        }
                      `}
                    >
                      {insight.type === 'warning' 
                        ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      }
                      <span>{insight.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
