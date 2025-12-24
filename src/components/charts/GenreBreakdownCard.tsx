import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface GenreBreakdownCardProps {
  genres: Array<{ genre: string; count: number; percentage: number }>;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(265 89% 66%)',  // purple
  'hsl(240 91% 65%)',  // indigo
  'hsl(200 98% 60%)',  // blue
  'hsl(160 84% 50%)',  // teal
  'hsl(var(--muted-foreground))',
];

const GenreBreakdownCard = ({ genres }: GenreBreakdownCardProps) => {
  // Take top 6 artists and use track counts for better visualization
  const topArtists = genres.slice(0, 6);
  const maxCount = Math.max(...topArtists.map(a => a.count), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-primary" />
          Most Played Artists
        </CardTitle>
        <CardDescription>
          By track count in your library
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topArtists.length > 0 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topArtists} 
                layout="vertical"
                margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
              >
                <XAxis 
                  type="number" 
                  domain={[0, Math.ceil(maxCount * 1.1)]}
                  tickFormatter={(v) => `${v}`}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="genre" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} 
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} tracks`, 'Count']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topArtists.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <p>No artist data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenreBreakdownCard;
