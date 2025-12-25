import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SpotifyTrack, AudioFeatures } from '@/lib/spotify-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TrackWithFeatures extends SpotifyTrack {
  audioFeatures?: AudioFeatures | null;
}

interface TopSongsTableProps {
  tracks: TrackWithFeatures[];
  isLoading: boolean;
}

const formatPercent = (value: number | undefined | null): string => {
  if (value == null) return 'N/A';
  return `${Math.round(value * 100)}%`;
};

const formatBpm = (tempo: number | undefined | null): string => {
  if (tempo == null) return 'N/A';
  return Math.round(tempo).toString();
};

const TopSongsTable = ({ tracks, isLoading }: TopSongsTableProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  
  // Auto-expand when navigating from Home with hash
  useEffect(() => {
    if (location.hash === '#top-songs') {
      setIsExpanded(true);
    }
  }, [location.hash]);

  const displayCount = isExpanded ? 50 : 10;
  const displayTracks = tracks.slice(0, displayCount);
  const canExpand = tracks.length > 10;

  if (isLoading) {
    return (
      <section id="top-songs" className="scroll-mt-24">
        <Card className="bg-card/80 backdrop-blur-xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl font-bold flex items-center gap-2">
              🎵 Top Songs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 pt-0">
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-8 h-4" />
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="w-12 h-4" />
                  <Skeleton className="w-12 h-4" />
                  <Skeleton className="w-12 h-4" />
                  <Skeleton className="w-12 h-4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (tracks.length === 0) {
    return (
      <section id="top-songs" className="scroll-mt-24">
        <Card className="bg-card/80 backdrop-blur-xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl font-bold flex items-center gap-2">
              🎵 Top Songs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              No top tracks found. Listen to more music on Spotify!
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="top-songs" className="scroll-mt-24">
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg lg:text-xl font-bold flex items-center gap-2">
            🎵 Top Songs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 pt-0">
          {/* Desktop Table */}
          <div className="overflow-x-auto -mx-4 lg:mx-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead className="hidden sm:table-cell">Artist</TableHead>
                  <TableHead className="text-center w-16">BPM</TableHead>
                  <TableHead className="text-center w-16 hidden md:table-cell">Dance</TableHead>
                  <TableHead className="text-center w-16 hidden md:table-cell">Energy</TableHead>
                  <TableHead className="text-center w-16 hidden lg:table-cell">Mood</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTracks.map((track, index) => {
                  const features = track.audioFeatures;
                  return (
                    <TableRow 
                      key={track.id} 
                      className="border-border/30 hover:bg-muted/30 group cursor-pointer"
                      onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, '_blank')}
                    >
                      <TableCell className="text-center font-semibold text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={track.album.images[2]?.url || track.album.images[0]?.url}
                            alt={`${track.name} album art`}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate text-sm">
                              {track.name}
                            </p>
                            {/* Artist shown under track on mobile */}
                            <p className="text-xs text-muted-foreground truncate sm:hidden">
                              {track.artists.map(a => a.name).join(', ')}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground truncate block max-w-[150px]">
                          {track.artists.map(a => a.name).join(', ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm ${features?.tempo == null ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                          {formatBpm(features?.tempo)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <span className={`text-sm ${features?.danceability == null ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                          {formatPercent(features?.danceability)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <span className={`text-sm ${features?.energy == null ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                          {formatPercent(features?.energy)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        <span className={`text-sm ${features?.valence == null ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                          {formatPercent(features?.valence)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Expand/Collapse Button */}
          {canExpand && (
            <div className="flex justify-center pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    Show Less
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show All {tracks.length} Tracks
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default TopSongsTable;
