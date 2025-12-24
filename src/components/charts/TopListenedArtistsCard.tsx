import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Headphones, Loader2, ExternalLink } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TopArtist {
  name: string;
  rank: number;
  score: number;
  genres: string[];
  imageUrl?: string;
  spotifyUrl: string;
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

const TIME_RANGES: Record<TimeRange, string> = {
  'short_term': 'Last 4 Weeks',
  'medium_term': 'Last 6 Months',
  'long_term': 'All Time',
};

const COLORS = [
  'hsl(var(--primary))',      // #1
  'hsl(280, 70%, 60%)',       // #2 - Purple
  'hsl(220, 70%, 55%)',       // #3 - Blue
  'hsl(190, 80%, 45%)',       // #4 - Cyan
  'hsl(160, 60%, 45%)',       // #5 - Teal
  'hsl(var(--muted-foreground))', // #6+
];

interface TopListenedArtistsCardProps {
  accessToken: string | null;
}

const TopListenedArtistsCard = ({ accessToken }: TopListenedArtistsCardProps) => {
  const [artists, setArtists] = useState<TopArtist[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopArtists = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=10`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch top artists');
        }

        const data = await response.json();

        const formatted: TopArtist[] = data.items.map((artist: any, index: number) => ({
          name: artist.name,
          rank: index + 1,
          score: 100 - (index * 9), // #1 = 100, #2 = 91, etc. for visual bar difference
          genres: artist.genres || [],
          imageUrl: artist.images?.[0]?.url,
          spotifyUrl: artist.external_urls?.spotify || '',
        }));

        setArtists(formatted);
      } catch (err) {
        console.error('Error fetching top artists:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopArtists();
  }, [accessToken, timeRange]);

  const getColorForRank = (rank: number) => {
    return COLORS[Math.min(rank - 1, COLORS.length - 1)];
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              Top Artists
            </CardTitle>
            <CardDescription>
              Based on your actual listening
            </CardDescription>
          </div>

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_RANGES).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            {error}
          </div>
        ) : artists.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            No listening data available
          </div>
        ) : (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={artists}
                  layout="vertical"
                  margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 110]}
                    hide
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const artist = payload[0].payload as TopArtist;
                        return (
                          <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                            <p className="font-semibold text-foreground">
                              #{artist.rank} {artist.name}
                            </p>
                            {artist.genres?.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {artist.genres.slice(0, 3).join(', ')}
                              </p>
                            )}
                            <a
                              href={artist.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open in Spotify
                            </a>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {artists.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorForRank(index + 1)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Rankings based on listening affinity calculated by Spotify
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TopListenedArtistsCard;
