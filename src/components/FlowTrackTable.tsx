import { TrackWithFeatures, TrackFlowImpact, calculateTrackFlowImpact } from '@/lib/flow-analysis';
import { getAppealTier } from '@/lib/appeal-analysis';
import { CheckCircle2, AlertTriangle, XCircle, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export type SortField = 'position' | 'appeal' | 'flow';
export type FilterType = 'all' | 'underground' | 'mainstream';

interface FlowTrackTableProps {
  tracks: TrackWithFeatures[];
  highlightedIndex?: number;
  showAppeal?: boolean;
}

const FlowTrackTable = ({ tracks, highlightedIndex, showAppeal = true }: FlowTrackTableProps) => {
  const [sortField, setSortField] = useState<SortField>('position');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const formatPercent = (value?: number) => 
    value != null ? `${Math.round(value * 100)}%` : '-';

  const getBpmIndicator = (index: number, sortedTracks: TrackWithFeatures[]) => {
    if (index === 0 || !sortedTracks[index].tempo || !sortedTracks[index - 1]?.tempo) {
      return null;
    }
    const change = (sortedTracks[index].tempo || 0) - (sortedTracks[index - 1].tempo || 0);
    if (Math.abs(change) > 15) {
      if (change > 0) {
        return <ArrowUp className="w-4 h-4 text-yellow-500" />;
      }
      return <ArrowDown className="w-4 h-4 text-yellow-500" />;
    }
    return null;
  };

  const getFlowImpactIcon = (impact: TrackFlowImpact) => {
    switch (impact.status) {
      case 'good':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'review':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'issue':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getEnergyBarColor = (energy?: number) => {
    if (!energy) return 'bg-muted';
    if (energy >= 0.7) return 'bg-green-500';
    if (energy >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Add original position to tracks for sorting
  const tracksWithPosition = tracks.map((track, index) => ({
    ...track,
    originalIndex: index,
  }));

  // Filter tracks
  let filteredTracks = tracksWithPosition;
  if (filterType === 'underground') {
    filteredTracks = tracksWithPosition.filter(t => (t.popularity ?? 50) < 40);
  } else if (filterType === 'mainstream') {
    filteredTracks = tracksWithPosition.filter(t => (t.popularity ?? 50) >= 80);
  }

  // Sort tracks
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortField === 'appeal') {
      return (b.popularity ?? 0) - (a.popularity ?? 0);
    }
    if (sortField === 'flow') {
      const impactA = calculateTrackFlowImpact(tracks, a.originalIndex);
      const impactB = calculateTrackFlowImpact(tracks, b.originalIndex);
      const statusOrder = { issue: 0, review: 1, good: 2 };
      return statusOrder[impactA.status] - statusOrder[impactB.status];
    }
    return a.originalIndex - b.originalIndex;
  });

  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden">
      {/* Sort/Filter Controls */}
      <div className="p-4 border-b border-border flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground mr-2 self-center">Sort:</span>
        <Button
          size="sm"
          variant={sortField === 'position' ? 'default' : 'outline'}
          onClick={() => setSortField('position')}
          className="text-xs"
        >
          Position
        </Button>
        {showAppeal && (
          <Button
            size="sm"
            variant={sortField === 'appeal' ? 'default' : 'outline'}
            onClick={() => setSortField('appeal')}
            className="text-xs"
          >
            Appeal ↓
          </Button>
        )}
        <Button
          size="sm"
          variant={sortField === 'flow' ? 'default' : 'outline'}
          onClick={() => setSortField('flow')}
          className="text-xs"
        >
          Flow Issues ↓
        </Button>

        <div className="w-px h-6 bg-border mx-2 self-center" />

        <span className="text-sm text-muted-foreground mr-2 self-center">Filter:</span>
        <Button
          size="sm"
          variant={filterType === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterType('all')}
          className="text-xs"
        >
          All ({tracks.length})
        </Button>
        {showAppeal && (
          <>
            <Button
              size="sm"
              variant={filterType === 'underground' ? 'default' : 'outline'}
              onClick={() => setFilterType('underground')}
              className="text-xs"
            >
              💎 Underground
            </Button>
            <Button
              size="sm"
              variant={filterType === 'mainstream' ? 'default' : 'outline'}
              onClick={() => setFilterType('mainstream')}
              className="text-xs"
            >
              🔥 Mainstream
            </Button>
          </>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="w-12 text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Track</TableHead>
              <TableHead className="text-center text-muted-foreground w-24">BPM</TableHead>
              <TableHead className="text-center text-muted-foreground w-28">Energy</TableHead>
              <TableHead className="text-center text-muted-foreground w-20 hidden md:table-cell">Dance</TableHead>
              <TableHead className="text-center text-muted-foreground w-20 hidden md:table-cell">Mood</TableHead>
              {showAppeal && (
                <TableHead className="text-center text-muted-foreground w-24">Appeal</TableHead>
              )}
              <TableHead className="text-center text-muted-foreground w-24">Flow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTracks.map((track, index) => {
              const flowImpact = calculateTrackFlowImpact(tracks, track.originalIndex);
              const isHighlighted = highlightedIndex === track.originalIndex;
              const appealTier = showAppeal && track.popularity != null ? getAppealTier(track.popularity) : null;

              return (
                <TableRow 
                  key={track.id} 
                  className={`border-border transition-colors ${isHighlighted ? 'bg-spotify/10' : ''}`}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                      {track.originalIndex + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {track.albumImage && (
                        <img
                          src={track.albumImage}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground truncate max-w-[200px] md:max-w-[300px]">
                          {track.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">
                          {track.artist}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-card-foreground font-medium">
                        {track.tempo ? Math.round(track.tempo) : '-'}
                      </span>
                      {getBpmIndicator(index, sortedTracks)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getEnergyBarColor(track.energy)} transition-all`}
                          style={{ width: track.energy ? `${track.energy * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {formatPercent(track.energy)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-card-foreground hidden md:table-cell">
                    {formatPercent(track.danceability)}
                  </TableCell>
                  <TableCell className="text-center text-card-foreground hidden md:table-cell">
                    {formatPercent(track.valence)}
                  </TableCell>
                  {showAppeal && (
                    <TableCell className="text-center">
                      {appealTier ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1.5">
                              <span>{appealTier.icon}</span>
                              <span className={`font-medium ${appealTier.color}`}>
                                {track.popularity}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{appealTier.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center justify-center">
                          {getFlowImpactIcon(flowImpact)}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[200px]">
                        <p>{flowImpact.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FlowTrackTable;
