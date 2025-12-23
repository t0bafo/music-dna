import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrackWithFeatures, calculateTrackFlowImpact, TrackFlowImpact } from '@/lib/flow-analysis';
import { getAppealTier } from '@/lib/appeal-analysis';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  GripVertical, 
  ArrowUp, 
  ArrowDown,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
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

interface DraggableTrackTableProps {
  tracks: TrackWithFeatures[];
  originalTracks: TrackWithFeatures[];
  onReorder: (newTracks: TrackWithFeatures[]) => void;
  showAppeal?: boolean;
}

interface SortableRowProps {
  track: TrackWithFeatures & { currentIndex: number; originalIndex: number };
  tracks: TrackWithFeatures[];
  showAppeal: boolean;
  positionChange: number;
}

const formatPercent = (value?: number) => 
  value != null ? `${Math.round(value * 100)}%` : '-';

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

const getBpmIndicator = (index: number, tracks: TrackWithFeatures[]) => {
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

const SortableRow = ({ track, tracks, showAppeal, positionChange }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const flowImpact = calculateTrackFlowImpact(tracks, track.currentIndex);
  const appealTier = showAppeal && track.popularity != null ? getAppealTier(track.popularity) : null;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`border-border transition-colors ${isDragging ? 'bg-accent shadow-lg' : ''}`}
    >
      <TableCell className="font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-accent rounded"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/70" />
          </button>
          <span className="w-6">{track.currentIndex + 1}</span>
          {positionChange !== 0 && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${
              positionChange < 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {positionChange < 0 ? (
                <>
                  <ArrowUpCircle className="w-3 h-3" />
                  {Math.abs(positionChange)}
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-3 h-3" />
                  {positionChange}
                </>
              )}
            </span>
          )}
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
          {getBpmIndicator(track.currentIndex, tracks)}
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
};

const DraggableTrackTable = ({ 
  tracks, 
  originalTracks, 
  onReorder, 
  showAppeal = true 
}: DraggableTrackTableProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create a map of original positions for comparison
  const originalPositionMap = useMemo(() => {
    const map = new Map<string, number>();
    originalTracks.forEach((track, index) => {
      map.set(track.id, index);
    });
    return map;
  }, [originalTracks]);

  // Add current and original index to tracks
  const tracksWithIndices = useMemo(() => {
    return tracks.map((track, index) => ({
      ...track,
      currentIndex: index,
      originalIndex: originalPositionMap.get(track.id) ?? index,
    }));
  }, [tracks, originalPositionMap]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex(t => t.id === active.id);
      const newIndex = tracks.findIndex(t => t.id === over.id);
      const reordered = arrayMove(tracks, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="w-20 text-muted-foreground">#</TableHead>
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
              <SortableContext
                items={tracks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {tracksWithIndices.map((track) => {
                  const positionChange = track.currentIndex - track.originalIndex;
                  return (
                    <SortableRow
                      key={track.id}
                      track={track}
                      tracks={tracks}
                      showAppeal={showAppeal}
                      positionChange={positionChange}
                    />
                  );
                })}
              </SortableContext>
            </TableBody>
          </Table>
        </div>
      </DndContext>
    </div>
  );
};

export default DraggableTrackTable;
