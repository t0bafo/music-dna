import { useState, useCallback } from 'react';
import { ArrowLeft, Filter, Gem, Loader2, Music2, Plus, Check, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useAddTracksToCrate } from '@/hooks/use-crates';
import { searchTracksSecure } from '@/lib/secure-database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DiscoveryFilters {
  minBpm: number;
  maxBpm: number;
  minEnergy: number;
  maxEnergy: number;
  minDance: number;
  maxDance: number;
  undergroundOnly: boolean;
  limit: number;
}

interface TrackResult {
  track_id: string;
  name: string;
  artist: string;
  album: string | null;
  tempo: number | null;
  energy: number | null;
  danceability: number | null;
  popularity: number | null;
}

interface DiscoverByVibeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crateId: string;
  crateName: string;
  existingTrackIds: string[];
}

export function DiscoverByVibeModal({
  open,
  onOpenChange,
  crateId,
  crateName,
  existingTrackIds,
}: DiscoverByVibeModalProps) {
  const isMobile = useIsMobile();
  const { accessToken } = useAuth();
  const addTracksMutation = useAddTracksToCrate();

  const [view, setView] = useState<'filters' | 'results'>('filters');
  const [filters, setFilters] = useState<DiscoveryFilters>({
    minBpm: 90,
    maxBpm: 130,
    minEnergy: 50,
    maxEnergy: 85,
    minDance: 60,
    maxDance: 100,
    undergroundOnly: false,
    limit: 50,
  });
  const [results, setResults] = useState<TrackResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedTrackIds, setAddedTrackIds] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async () => {
    if (!accessToken) return;
    
    setIsSearching(true);
    try {
      const tracks = await searchTracksSecure(filters, accessToken);
      // Filter out tracks already in crate
      const filteredTracks = tracks.filter(
        (t: TrackResult) => !existingTrackIds.includes(t.track_id) && !addedTrackIds.has(t.track_id)
      );
      setResults(filteredTracks);
      setView('results');
      
      if (filteredTracks.length === 0) {
        toast.info('No new tracks match your criteria. Try adjusting filters.');
      } else {
        toast.success(`Found ${filteredTracks.length} matching tracks!`);
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search tracks');
    } finally {
      setIsSearching(false);
    }
  }, [accessToken, filters, existingTrackIds, addedTrackIds]);

  const handleAddTrack = async (track: TrackResult) => {
    try {
      await addTracksMutation.mutateAsync({
        crateId,
        tracks: [{
          track_id: track.track_id,
          name: track.name,
          artist_name: track.artist,
          album_name: track.album || undefined,
          album_art_url: undefined,
          bpm: track.tempo || undefined,
          energy: track.energy || undefined,
          danceability: track.danceability || undefined,
        }],
      });
      setAddedTrackIds(prev => new Set([...prev, track.track_id]));
      toast.success(`Added "${track.name}" to crate`);
    } catch (err) {
      console.error('Failed to add track:', err);
      toast.error('Failed to add track');
    }
  };

  const handleAddAll = async () => {
    const tracksToAdd = results.filter(t => !addedTrackIds.has(t.track_id));
    if (tracksToAdd.length === 0) return;

    try {
      await addTracksMutation.mutateAsync({
        crateId,
        tracks: tracksToAdd.map(track => ({
          track_id: track.track_id,
          name: track.name,
          artist_name: track.artist,
          album_name: track.album || undefined,
          album_art_url: undefined,
          bpm: track.tempo || undefined,
          energy: track.energy || undefined,
          danceability: track.danceability || undefined,
        })),
      });
      toast.success(`Added ${tracksToAdd.length} tracks to "${crateName}"!`);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to add tracks:', err);
      toast.error('Failed to add tracks');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      minBpm: 60,
      maxBpm: 180,
      minEnergy: 0,
      maxEnergy: 100,
      minDance: 0,
      maxDance: 100,
      undergroundOnly: false,
      limit: 50,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setView('filters');
      setResults([]);
      setAddedTrackIds(new Set());
    }, 300);
  };

  const remainingTracks = results.filter(t => !addedTrackIds.has(t.track_id));

  const content = (
    <div className="space-y-6">
      {view === 'filters' ? (
        <>
          {/* Filter Controls */}
          <div className="space-y-5">
            {/* BPM Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">🎵</span>
                BPM Range: <span className="text-primary">{filters.minBpm} - {filters.maxBpm}</span>
              </Label>
              <Slider
                value={[filters.minBpm, filters.maxBpm]}
                onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minBpm: min, maxBpm: max }))}
                min={60}
                max={180}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>60</span>
                <span>180</span>
              </div>
            </div>

            {/* Energy Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚡</span>
                Energy: <span className="text-primary">{filters.minEnergy}% - {filters.maxEnergy}%</span>
              </Label>
              <Slider
                value={[filters.minEnergy, filters.maxEnergy]}
                onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minEnergy: min, maxEnergy: max }))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Danceability Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">💃</span>
                Danceability: <span className="text-primary">{filters.minDance}% - {filters.maxDance}%</span>
              </Label>
              <Slider
                value={[filters.minDance, filters.maxDance]}
                onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minDance: min, maxDance: max }))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Underground Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-3">
                <Gem className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="underground" className="text-sm font-medium cursor-pointer">
                    Underground Only
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Popularity &lt; 50
                  </p>
                </div>
              </div>
              <Switch
                id="underground"
                checked={filters.undergroundOnly}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, undergroundOnly: checked }))}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClearFilters} className="flex-shrink-0">
              Clear
            </Button>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="flex-1"
              variant="sonic"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4 mr-2" />
                  Find Tracks
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Results View */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setView('filters')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Filters
            </Button>
            <span className="text-sm text-muted-foreground">
              {remainingTracks.length} tracks available
            </span>
          </div>

          {remainingTracks.length > 0 ? (
            <>
              <ScrollArea className="h-[350px] rounded-xl border border-border/50 bg-secondary/20">
                <div className="p-3 space-y-2">
                  {results.map((track) => {
                    const isAdded = addedTrackIds.has(track.track_id);
                    return (
                      <div
                        key={track.track_id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          isAdded ? "bg-primary/10 opacity-60" : "hover:bg-secondary/50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{track.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {track.tempo && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {Math.round(track.tempo)} BPM
                              </Badge>
                            )}
                            {track.energy && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">
                                {Math.round(track.energy * 100)}% Energy
                              </Badge>
                            )}
                            {track.popularity !== null && track.popularity < 50 && (
                              <Gem className="w-3 h-3 text-primary" />
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? "secondary" : "outline"}
                          className={cn(
                            "shrink-0 h-8 px-3",
                            !isAdded && "border-primary/30 text-primary hover:bg-primary/10"
                          )}
                          onClick={() => !isAdded && handleAddTrack(track)}
                          disabled={isAdded || addTracksMutation.isPending}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Add All Button */}
              {remainingTracks.length > 0 && (
                <Button
                  onClick={handleAddAll}
                  disabled={addTracksMutation.isPending}
                  className="w-full"
                  variant="sonic"
                >
                  {addTracksMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Add All ({remainingTracks.length})
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-muted-foreground">All matching tracks have been added!</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setView('filters')}
              >
                Adjust Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border/30 pb-4">
            <DrawerTitle className="font-display">
              {view === 'filters' ? 'Discover Tracks by Vibe' : `Found ${results.length} tracks`}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-card/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {view === 'filters' ? 'Discover Tracks by Vibe' : `Found ${results.length} tracks`}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export default DiscoverByVibeModal;
