import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface ScatterDataPoint {
  x: number; // danceability
  y: number; // energy
  z: number; // count (for bubble size)
  isMainstream: boolean;
}

interface EnergyDanceScatterCardProps {
  data: ScatterDataPoint[];
  clusterInfo?: {
    avgDance: number;
    avgEnergy: number;
  };
}

const EnergyDanceScatterCard = ({ data, clusterInfo }: EnergyDanceScatterCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Energy vs Danceability
        </CardTitle>
        <CardDescription>
          Where your tracks cluster on the dance floor
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Danceability" 
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    label={{ value: 'Danceability', position: 'bottom', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Energy" 
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    label={{ value: 'Energy', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    width={40}
                  />
                  <ZAxis type="number" dataKey="z" range={[20, 200]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Scatter name="Tracks" data={data}>
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isMainstream ? 'hsl(var(--primary))' : 'hsl(265 89% 66%)'}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {clusterInfo && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-muted-foreground">Mainstream</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(265 89% 66%)' }}></div>
                  <span className="text-muted-foreground">Underground</span>
                </div>
                <p className="text-foreground">
                  <span className="font-medium">Center:</span> {clusterInfo.avgDance}% dance, {clusterInfo.avgEnergy}% energy
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnergyDanceScatterCard;
