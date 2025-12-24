import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface BpmDistributionCardProps {
  bpmData: Array<{ range: string; count: number; percentage: number }>;
  sweetSpot?: { min: number; max: number };
}

const BpmDistributionCard = ({ bpmData, sweetSpot }: BpmDistributionCardProps) => {
  // Find max for highlighting
  const maxCount = Math.max(...bpmData.map(d => d.count));
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          BPM Distribution
        </CardTitle>
        <CardDescription>
          Track count by tempo range
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bpmData.length > 0 ? (
          <>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={bpmData}
                  margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="range" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'count' ? `${value} tracks` : `${value.toFixed(1)}%`,
                      name === 'count' ? 'Tracks' : 'Share'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {bpmData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count === maxCount ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.4)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {sweetSpot && (
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Your sweet spot:</span> {sweetSpot.min}-{sweetSpot.max} BPM
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <p>No BPM data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BpmDistributionCard;
