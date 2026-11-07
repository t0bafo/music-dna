import { useState } from 'react';
import { Music, Play, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import AddToCrateDropdown from '@/components/crates/AddToCrateDropdown';
import CreateCrateWithTracksModal from '@/components/crates/CreateCrateWithTracksModal';
import { TrackWithFeatures, useTopTracks } from '@/hooks/use-music-intelligence';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 'short_term', label: 'Last 4 weeks' },
  { value: 'medium_term', label: 'Last 6 months' },
  { value: 'long_term', label: 'All time' },
];

const COUNTS = [25, 50] as const;

const RANGE_NAMES: Record<TimeRange, string> = {
  short_term: 'Right Now',
  medium_term: 'Signature Sound',
  long_term: 'All-Time Sound',
};

const ChipGroup = <T extends string | number>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-foreground">{label}</p>
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm border transition-colors',
            value === o.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary/40 text-muted-foreground border-border/50 hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

interface TopDefiningTracksProps {
  tracks: TrackWithFeatures[];
  isLoading: boolean;
}

const formatDuration = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const TopDefiningTracks = ({ tracks, isLoading }: TopDefiningTracksProps) => {
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [count, setCount] = useState<number>(50);
  const { accessToken } = useAuth();

  // Home already loads 6-month top 50; fetch other ranges only when picked
  const needsFetch = showBulkCreate && timeRange !== 'medium_term';
  const { data: rangeTracks = [], isLoading: loadingRange } = useTopTracks(
    needsFetch ? accessToken : null,
    timeRange,
    50
  );
  const sourceTracks = timeRange === 'medium_term' ? tracks : rangeTracks;
  const loadingTracks = needsFetch && loadingRange;

  const top3 = tracks.slice(0, 3);
  
  const bulkTracksForModal = sourceTracks.slice(0, count).map(t => ({
    id: t.id,
    name: t.name,
    artist: t.artist,
    albumName: t.album?.name,
    albumImage: t.albumImage,
    duration_ms: t.duration_ms,
    popularity: t.popularity,
    tempo: t.tempo,
    energy: t.energy,
    danceability: t.danceability,
    valence: t.valence,
  }));

  if (isLoading) {
    return (
      <section>
        <Skeleton className="h-7 w-72 mb-2" />
        <Skeleton className="h-5 w-56 mb-5" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/70 border-border/40">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (top3.length === 0) {
    return (
      <section>
        <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-2">
          🎵 Top 3 Tracks That Define You
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Listen to more music to unlock your defining tracks
        </p>
      </section>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-2">
          🎵 Top 3 Tracks That Define You
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          These songs capture your essence
        </p>
        
        <div className="space-y-3 mb-4">
          {top3.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
            >
              <Card className="bg-card/70 backdrop-blur-xl border-border/40 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Album Art */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted relative">
                    {track.albumImage ? (
                      <img
                        src={track.albumImage}
                        alt={track.album?.name || 'Album'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    {/* Preview overlay */}
                    <a
                      href={`https://open.spotify.com/track/${track.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-8 h-8 text-white fill-white" />
                    </a>
                  </div>
                  
                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">
                      {track.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artist}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDuration(track.duration_ms)}
                    </p>
                  </div>
                  
                  {/* Add to Crate */}
                  <div className="flex-shrink-0">
                    <AddToCrateDropdown
                      track={{
                        id: track.id,
                        name: track.name,
                        artist: track.artist,
                        albumName: track.album?.name,
                        albumImage: track.albumImage,
                        duration_ms: track.duration_ms,
                        popularity: track.popularity,
                        tempo: track.tempo,
                        energy: track.energy,
                        danceability: track.danceability,
                        valence: track.valence,
                      }}
                      variant="outline"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Bulk Create Button */}
        <Button
          onClick={() => setShowBulkCreate(true)}
          className="w-full max-w-md mx-auto flex gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
          variant="ghost"
        >
          <Package className="w-4 h-4" />
          Create Crate from My Top Songs
        </Button>
      </motion.section>
      
      <CreateCrateWithTracksModal
        open={showBulkCreate}
        onOpenChange={setShowBulkCreate}
        tracks={bulkTracksForModal}
        defaultName={`My ${RANGE_NAMES[timeRange]}`}
        defaultDescription={`My top ${count} tracks · ${TIME_RANGES.find(r => r.value === timeRange)?.label.toLowerCase()} (ranked by Spotify)`}
        isLoadingTracks={loadingTracks}
        controls={
          <div className="space-y-4">
            <ChipGroup<TimeRange> label="Time period" options={TIME_RANGES} value={timeRange} onChange={setTimeRange} />
            <ChipGroup<number>
              label="How many songs"
              options={COUNTS.map(c => ({ value: c, label: `Top ${c}` }))}
              value={count}
              onChange={setCount}
            />
          </div>
        }
      />
    </>
  );
};

export default TopDefiningTracks;
