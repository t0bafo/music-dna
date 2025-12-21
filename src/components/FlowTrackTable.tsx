import { TrackWithFeatures, TrackFlowImpact, calculateTrackFlowImpact } from '@/lib/flow-analysis';
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

interface FlowTrackTableProps {
  tracks: TrackWithFeatures[];
  highlightedIndex?: number;
}

const FlowTrackTable = ({ tracks, highlightedIndex }: FlowTrackTableProps) => {
  const formatPercent = (value?: number) => 
    value != null ? `${Math.round(value * 100)}%` : '-';

  const getBpmIndicator = (index: number) => {
    if (index === 0 || !tracks[index].tempo || !tracks[index - 1]?.tempo) {
      return null;
    }
    const change = (tracks[index].tempo || 0) - (tracks[index - 1].tempo || 0);
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

  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden">
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
              <TableHead className="text-center text-muted-foreground w-24">Flow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks.map((track, index) => {
              const flowImpact = calculateTrackFlowImpact(tracks, index);
              const isHighlighted = highlightedIndex === index;

              return (
                <TableRow 
                  key={track.id} 
                  className={`border-border transition-colors ${isHighlighted ? 'bg-spotify/10' : ''}`}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                      {index + 1}
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
                      {getBpmIndicator(index)}
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
