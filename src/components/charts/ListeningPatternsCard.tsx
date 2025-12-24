import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface ListeningPatternsCardProps {
  data: Array<{ day: string; count: number }>;
  mostActiveDay?: string;
}

const ListeningPatternsCard = ({ data, mostActiveDay }: ListeningPatternsCardProps) => {
  const maxCount = Math.max(...data.map(d => d.count));
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          When You Add Music
        </CardTitle>
        <CardDescription>
          Discovery patterns by day of week
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.some(d => d.count > 0) ? (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data}
                  margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="day" 
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
                    formatter={(value: number) => [`${value} tracks`, 'Added']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count === maxCount ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.4)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {mostActiveDay && (
              <p className="mt-3 text-sm text-muted-foreground text-center">
                Most active on <span className="font-semibold text-foreground">{mostActiveDay}s</span>
              </p>
            )}
          </>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p>No date data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListeningPatternsCard;
