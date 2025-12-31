import { useState } from 'react';
import { Music, Plus, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import AddToCrateDropdown from '@/components/crates/AddToCrateDropdown';
import CreateCrateWithTracksModal from '@/components/crates/CreateCrateWithTracksModal';

export interface ScrollerTrack {
  id: string;
  name: string;
  artist: string;
  albumImage?: string;
  albumName?: string;
  duration_ms: number;
  popularity: number;
  tempo?: number;
  energy?: number;
  danceability?: number;
  valence?: number;
  added_at?: string;
}

interface HorizontalTrackScrollerProps {
  title: string;
  subtitle: string;
  emoji: string;
  tracks: ScrollerTrack[];
  isLoading: boolean;
  emptyMessage: string;
  bulkCrateName: string;
  bulkCrateDescription: string;
  delay?: number;
}

const HorizontalTrackScroller = ({
  title,
  subtitle,
  emoji,
  tracks,
  isLoading,
  emptyMessage,
  bulkCrateName,
  bulkCrateDescription,
  delay = 1.0,
}: HorizontalTrackScrollerProps) => {
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  
  const displayTracks = tracks.slice(0, 10);
  
  const bulkTracksForModal = displayTracks.map(t => ({
    id: t.id,
    name: t.name,
    artist: t.artist,
    albumName: t.albumName,
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
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-5 w-72 mb-5" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-[140px]">
              <Skeleton className="w-[140px] h-[140px] rounded-lg mb-2" />
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayTracks.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
      >
        <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-2">
          {emoji} {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          {subtitle}
        </p>
        <div className="bg-card/50 rounded-xl p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </motion.section>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
      >
        <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-2">
          {emoji} {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          {subtitle}
        </p>
        
        {/* Horizontal Scrollable Row */}
        <div className="relative -mx-4 px-4 lg:-mx-0 lg:px-0">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {displayTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + index * 0.05, duration: 0.3 }}
                className="flex-shrink-0 w-[140px] snap-start group"
              >
                {/* Album Art */}
                <div className="w-[140px] h-[140px] rounded-lg overflow-hidden bg-muted mb-2 relative">
                  {track.albumImage ? (
                    <img
                      src={track.albumImage}
                      alt={track.albumName || track.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Add overlay */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <AddToCrateDropdown
                      track={track}
                      variant="outline"
                    />
                  </div>
                </div>
                
                {/* Track Info */}
                <p className="text-sm font-semibold text-foreground truncate">
                  {track.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Bulk Create Button */}
        <Button
          onClick={() => setShowBulkCreate(true)}
          className="w-full max-w-md mx-auto flex gap-2 mt-4 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
          variant="ghost"
        >
          <Package className="w-4 h-4" />
          Create Crate from {title}
        </Button>
      </motion.section>
      
      <CreateCrateWithTracksModal
        open={showBulkCreate}
        onOpenChange={setShowBulkCreate}
        tracks={bulkTracksForModal}
        defaultName={bulkCrateName}
        defaultDescription={bulkCrateDescription}
      />
    </>
  );
};

export default HorizontalTrackScroller;
