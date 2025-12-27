import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Gem, Music, Zap, Activity, Plus, Loader2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackWithFeatures, useTopArtists, useLibraryStats } from '@/hooks/use-music-intelligence';
import { useCrates, useAddTracksToCrate } from '@/hooks/use-crates';
import { toast } from 'sonner';

interface MusicStatsSectionProps {
  topTracks: TrackWithFeatures[];
  accessToken: string | null;
  isLoading: boolean;
}

const MusicStatsSection = ({ topTracks, accessToken, isLoading }: MusicStatsSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [addToCrateTrack, setAddToCrateTrack] = useState<TrackWithFeatures | null>(null);
  
  const { data: topArtists = [], isLoading: artistsLoading } = useTopArtists(accessToken, 'short_term', 5);
  const { data: libraryStats } = useLibraryStats(accessToken);
  const { data: crates = [] } = useCrates();
  const addTracksMutation = useAddTracksToCrate();

  // Calculate stats from topTracks
  const stats = useMemo(() => {
    if (topTracks.length === 0) return null;
    
    const undergroundCount = topTracks.filter(t => t.popularity < 50).length;
    const undergroundRatio = Math.round((undergroundCount / topTracks.length) * 100);
    
    const tracksWithBpm = topTracks.filter(t => t.tempo);
    const avgBpm = tracksWithBpm.length > 0 
      ? Math.round(tracksWithBpm.reduce((sum, t) => sum + (t.tempo || 0), 0) / tracksWithBpm.length)
      : 0;
    
    const tracksWithEnergy = topTracks.filter(t => t.energy);
    const avgEnergy = tracksWithEnergy.length > 0
      ? Math.round((tracksWithEnergy.reduce((sum, t) => sum + (t.energy || 0), 0) / tracksWithEnergy.length) * 100)
      : 0;
    
    return {
      undergroundRatio,
      totalTracks: libraryStats?.totalTracks || topTracks.length,
      avgBpm,
      avgEnergy,
    };
  }, [topTracks, libraryStats]);

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAddToCrate = async (crateId: string) => {
    if (!addToCrateTrack) return;
    
    try {
      await addTracksMutation.mutateAsync({
        crateId,
        tracks: [{
          track_id: addToCrateTrack.id,
          name: addToCrateTrack.name,
          artist_name: addToCrateTrack.artist,
          album_name: addToCrateTrack.album?.name || '',
          album_art_url: addToCrateTrack.albumImage || '',
          duration_ms: addToCrateTrack.duration_ms,
          bpm: addToCrateTrack.tempo,
          energy: addToCrateTrack.energy,
        }],
      });
      toast.success(`Added "${addToCrateTrack.name}" to crate`);
      setAddToCrateTrack(null);
    } catch (error) {
      toast.error('Failed to add track to crate');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/60 backdrop-blur-xl border-border/50">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading stats...</span>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
        📊 Your Music Stats
      </h2>
      
      <Card className="bg-card/60 backdrop-blur-xl border-border/50 overflow-hidden">
        <CardContent className="p-4 lg:p-6">
          {/* Compact Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <Gem className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.undergroundRatio}%</p>
                <p className="text-xs text-muted-foreground">Underground</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-xl bg-chart-purple/5 border border-chart-purple/10">
              <Music className="w-5 h-5 text-chart-purple flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.totalTracks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Library Tracks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-xl bg-chart-cyan/5 border border-chart-cyan/10">
              <Activity className="w-5 h-5 text-chart-cyan flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.avgBpm}</p>
                <p className="text-xs text-muted-foreground">Avg BPM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-xl bg-chart-orange/5 border border-chart-orange/10">
              <Zap className="w-5 h-5 text-chart-orange flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.avgEnergy}%</p>
                <p className="text-xs text-muted-foreground">Avg Energy</p>
              </div>
            </div>
          </div>
          
          {/* Top Artists This Month */}
          {!artistsLoading && topArtists.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Top Artists This Month</h3>
              <div className="flex flex-wrap gap-2">
                {topArtists.map((artist, i) => (
                  <span 
                    key={artist.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm text-foreground"
                  >
                    <span className="text-xs text-muted-foreground">{i + 1}.</span>
                    {artist.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Top 50 Tracks
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View Top 50 Tracks
              </>
            )}
          </Button>
          
          {/* Expanded Top 50 Tracks */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t border-border/50 pt-4">
                  <div className="max-h-[500px] overflow-y-auto space-y-1 pr-2">
                    {topTracks.map((track, index) => (
                      <div 
                        key={track.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors group"
                      >
                        {/* Rank */}
                        <span className="w-6 text-sm text-muted-foreground font-medium">
                          {index + 1}
                        </span>
                        
                        {/* Album Art */}
                        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                          {track.albumImage ? (
                            <img 
                              src={track.albumImage} 
                              alt={track.album?.name || 'Album'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {track.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {track.artist} • {formatDuration(track.duration_ms)}
                          </p>
                        </div>
                        
                        {/* Add to Crate Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAddToCrateTrack(track)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Add to Crate</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      
      {/* Select Crate Modal */}
      <Dialog open={!!addToCrateTrack} onOpenChange={(open) => !open && setAddToCrateTrack(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Crate</DialogTitle>
          </DialogHeader>
          
          {addToCrateTrack && (
            <div className="space-y-4">
              {/* Track Preview */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {addToCrateTrack.albumImage ? (
                    <img 
                      src={addToCrateTrack.albumImage} 
                      alt="Album" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{addToCrateTrack.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{addToCrateTrack.artist}</p>
                </div>
              </div>
              
              {/* Crate List */}
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {crates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No crates yet. Create one first!
                    </p>
                  ) : (
                    crates.map((crate) => (
                      <Button
                        key={crate.id}
                        variant="ghost"
                        onClick={() => handleAddToCrate(crate.id)}
                        disabled={addTracksMutation.isPending}
                        className="w-full justify-start gap-3 h-auto py-3 px-4"
                      >
                        <span className="text-xl">{crate.emoji || '📦'}</span>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium truncate">{crate.name}</p>
                        </div>
                        {addTracksMutation.isPending && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.section>
  );
};

export default MusicStatsSection;
