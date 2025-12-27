import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Check, 
  AlertTriangle, 
  Lightbulb, 
  ArrowUp, 
  ArrowDown,
  Sparkles,
  Save,
  RotateCcw,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { getUserPlaylists, getPlaylistTracks, getAudioFeaturesFromReccoBeats, SpotifyPlaylist, SpotifyTrack } from '@/lib/spotify-api';
import { TrackWithFeatures, calculateFlowScore, FlowScore } from '@/lib/flow-analysis';
import { optimizePlaylist, OptimizationResult } from '@/lib/playlist-optimizer';
import { createCrate, addTracksToCrate, TrackToAdd, CRATE_EMOJIS, CRATE_COLORS } from '@/lib/crates-api';
import FlowCharts from '@/components/FlowCharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FlowIssue {
  type: 'bpm_jump' | 'energy_drop' | 'energy_plateau';
  position: number;
  description: string;
  detail: string;
  suggestion: string;
}

interface PlaylistFlowAnalyzerProps {
  fullWidth?: boolean;
}

const PlaylistFlowAnalyzer = ({ fullWidth }: PlaylistFlowAnalyzerProps) => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Analysis results
  const [tracks, setTracks] = useState<TrackWithFeatures[]>([]);
  const [flowScore, setFlowScore] = useState<FlowScore | null>(null);
  const [issues, setIssues] = useState<FlowIssue[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  // Optimization results
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);
  
  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [crateName, setCrateName] = useState('');
  const [crateDescription, setCrateDescription] = useState('');
  const [crateEmoji, setCrateEmoji] = useState('🎵');
  const [crateColor, setCrateColor] = useState('#00ff87');
  const [isSaving, setIsSaving] = useState(false);

  // Load playlists on mount
  const loadPlaylists = useCallback(async () => {
    if (!accessToken) return;
    
    setIsLoadingPlaylists(true);
    try {
      const data = await getUserPlaylists(accessToken);
      setPlaylists(data.items);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playlists',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, [accessToken]);

  // Load playlists when component mounts
  useState(() => {
    loadPlaylists();
  });

  // Detect flow issues
  const detectIssues = (trackList: TrackWithFeatures[]): FlowIssue[] => {
    const detectedIssues: FlowIssue[] = [];
    const tracksWithData = trackList.filter(t => t.tempo != null && t.energy != null);

    // BPM jumps
    for (let i = 0; i < tracksWithData.length - 1; i++) {
      const curr = tracksWithData[i];
      const next = tracksWithData[i + 1];
      const bpmDiff = Math.abs((next.tempo || 0) - (curr.tempo || 0));
      
      if (bpmDiff > 15) {
        detectedIssues.push({
          type: 'bpm_jump',
          position: i,
          description: `Track ${i + 1} → ${i + 2}: BPM jump too large`,
          detail: `(${Math.round(curr.tempo || 0)} BPM → ${Math.round(next.tempo || 0)} BPM = ${bpmDiff > 0 ? '+' : ''}${Math.round(bpmDiff)})`,
          suggestion: 'Consider reordering or adding bridge track',
        });
      }
    }

    // Energy drops
    for (let i = 0; i < tracksWithData.length - 1; i++) {
      const curr = tracksWithData[i];
      const next = tracksWithData[i + 1];
      const energyDiff = (curr.energy || 0) - (next.energy || 0);
      
      if (energyDiff > 0.4) {
        detectedIssues.push({
          type: 'energy_drop',
          position: i,
          description: `Track ${i + 1} → ${i + 2}: Energy drop too sudden`,
          detail: `(${((curr.energy || 0) * 100).toFixed(0)}% → ${((next.energy || 0) * 100).toFixed(0)}% = -${(energyDiff * 100).toFixed(0)}%)`,
          suggestion: 'Smoother transition needed',
        });
      }
    }

    // Energy plateaus (4+ consecutive tracks with similar energy ±5%)
    let plateauStart = -1;
    let plateauLength = 0;
    
    for (let i = 1; i < tracksWithData.length; i++) {
      const energyChange = Math.abs((tracksWithData[i].energy || 0) - (tracksWithData[i - 1].energy || 0));
      if (energyChange < 0.05) {
        if (plateauStart === -1) plateauStart = i - 1;
        plateauLength++;
      } else {
        if (plateauLength >= 3) {
          const avgEnergy = tracksWithData
            .slice(plateauStart, plateauStart + plateauLength + 1)
            .reduce((sum, t) => sum + (t.energy || 0), 0) / (plateauLength + 1);
          
          detectedIssues.push({
            type: 'energy_plateau',
            position: plateauStart,
            description: `Tracks ${plateauStart + 1}-${plateauStart + plateauLength + 1}: Energy plateau`,
            detail: `(All tracks ${Math.round(avgEnergy * 100 - 5)}-${Math.round(avgEnergy * 100 + 5)}% energy)`,
            suggestion: 'Add variation for interest',
          });
        }
        plateauStart = -1;
        plateauLength = 0;
      }
    }

    return detectedIssues.slice(0, 5); // Limit to top 5 issues
  };

  // Analyze playlist
  const handleAnalyze = async () => {
    if (!accessToken || !selectedPlaylistId) return;

    const playlist = playlists.find(p => p.id === selectedPlaylistId);
    if (!playlist) return;

    setIsAnalyzing(true);
    setSelectedPlaylist(playlist);
    setHasAnalyzed(false);
    setOptimizationResult(null);
    setShowOptimized(false);

    try {
      // Fetch tracks
      const tracksData = await getPlaylistTracks(accessToken, selectedPlaylistId);
      const spotifyTracks = tracksData.items
        .filter(item => item.track)
        .map(item => item.track);

      // Fetch audio features from ReccoBeats
      const trackIds = spotifyTracks.map(t => t.id);
      const features = await getAudioFeaturesFromReccoBeats(trackIds);

      // Merge tracks with features
      const enrichedTracks: TrackWithFeatures[] = spotifyTracks.map(track => {
        const audioFeatures = features.get(track.id);
        return {
          id: track.id,
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          albumImage: track.album.images[0]?.url,
          tempo: audioFeatures?.tempo,
          energy: audioFeatures?.energy,
          danceability: audioFeatures?.danceability,
          valence: audioFeatures?.valence,
          popularity: track.popularity,
        };
      });

      setTracks(enrichedTracks);

      // Calculate flow score
      const score = calculateFlowScore(enrichedTracks);
      setFlowScore(score);

      // Detect issues
      const detectedIssues = detectIssues(enrichedTracks);
      setIssues(detectedIssues);

      setHasAnalyzed(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze playlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Optimize playlist
  const handleOptimize = async () => {
    if (tracks.length < 5) {
      toast({
        title: 'Not Enough Tracks',
        description: 'Playlist needs at least 5 tracks for optimization',
        variant: 'destructive',
      });
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Run optimization
      const result = optimizePlaylist(tracks);
      setOptimizationResult(result);
      setShowOptimized(true);
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Could not optimize playlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Get track position change info
  const getPositionChange = (trackId: string) => {
    if (!optimizationResult) return null;
    
    const originalIndex = tracks.findIndex(t => t.id === trackId);
    const optimizedIndex = optimizationResult.optimizedTracks.findIndex(t => t.id === trackId);
    
    if (originalIndex === optimizedIndex) {
      return { change: 'same', diff: 0 };
    } else if (optimizedIndex < originalIndex) {
      return { change: 'up', diff: originalIndex - optimizedIndex };
    } else {
      return { change: 'down', diff: optimizedIndex - originalIndex };
    }
  };

  // Open save modal
  const handleOpenSaveModal = () => {
    if (selectedPlaylist) {
      setCrateName(`${selectedPlaylist.name} (Optimized)`);
      setCrateDescription('Optimized for smooth flow');
    }
    setShowSaveModal(true);
  };

  // Save as crate
  const handleSaveAsCrate = async () => {
    if (!accessToken || !optimizationResult || !crateName.trim()) return;

    setIsSaving(true);
    
    try {
      // Create crate
      const crate = await createCrate(
        crateName.trim(),
        crateDescription.trim() || null,
        crateEmoji,
        crateColor,
        accessToken
      );

      // Prepare tracks to add
      const tracksToAdd: TrackToAdd[] = optimizationResult.optimizedTracks.map(track => ({
        track_id: track.id,
        name: track.name,
        artist_name: track.artist,
        album_name: '',
        album_art_url: track.albumImage || '',
        bpm: track.tempo,
        energy: track.energy,
        danceability: track.danceability,
        valence: track.valence,
        popularity: track.popularity,
      }));

      // Add tracks to crate
      await addTracksToCrate(crate.id, tracksToAdd, accessToken);

      toast({
        title: '✨ Crate Created!',
        description: `"${crateName}" saved with ${tracksToAdd.length} tracks`,
      });

      setShowSaveModal(false);
      
      // Navigate to crate
      navigate(`/crates/${crate.id}`);
    } catch (error) {
      console.error('Failed to save crate:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save as crate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get star rating from score
  const getStarRating = (score: number) => {
    if (score >= 90) return '⭐⭐⭐⭐⭐';
    if (score >= 75) return '⭐⭐⭐⭐☆';
    if (score >= 60) return '⭐⭐⭐☆☆';
    if (score >= 45) return '⭐⭐☆☆☆';
    return '⭐☆☆☆☆';
  };

  // Get score description
  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Excellent flow with smooth transitions';
    if (score >= 60) return 'Good flow with minor issues';
    if (score >= 40) return 'Needs work on transitions';
    return 'Major flow issues detected';
  };

  return (
    <div className={cn("space-y-6", fullWidth && "w-full")}>
      {/* Playlist Selection */}
      <Card className="bg-card/70 backdrop-blur-xl border-border/40">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">Select Playlist</Label>
              <Select
                value={selectedPlaylistId}
                onValueChange={setSelectedPlaylistId}
                disabled={isLoadingPlaylists}
              >
                <SelectTrigger className="w-full bg-secondary/50">
                  <SelectValue placeholder={isLoadingPlaylists ? "Loading playlists..." : "Choose a playlist"} />
                </SelectTrigger>
                <SelectContent>
                  {playlists.map(playlist => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.tracks.total} tracks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAnalyze}
                disabled={!selectedPlaylistId || isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Flow
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <AnimatePresence>
        {hasAnalyzed && flowScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Flow Score Card */}
            <Card className="bg-card/70 backdrop-blur-xl border-border/40 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  📊 Flow Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Display */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold",
                      flowScore.color === 'green' && "bg-primary/20 text-primary",
                      flowScore.color === 'yellow' && "bg-chart-orange/20 text-chart-orange",
                      flowScore.color === 'red' && "bg-destructive/20 text-destructive"
                    )}>
                      {flowScore.score}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{flowScore.grade}</div>
                      <div className="text-base">{getStarRating(flowScore.score)}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getScoreDescription(flowScore.score)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <FlowCharts tracks={tracks} />

                {/* Issues */}
                {issues.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-chart-orange" />
                      Issues Detected ({issues.length})
                    </h4>
                    <div className="space-y-3">
                      {issues.map((issue, index) => (
                        <div 
                          key={index}
                          className="p-4 bg-secondary/30 rounded-xl border border-border/40"
                        >
                          <p className="font-medium text-foreground">{issue.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">{issue.detail}</p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                            <Lightbulb className="w-4 h-4" />
                            {issue.suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {issues.length === 0 && (
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">No major issues detected!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your playlist has good flow. Optimization may still improve it.
                    </p>
                  </div>
                )}

                {/* Optimize Button */}
                <Button
                  onClick={handleOptimize}
                  disabled={isOptimizing || tracks.length < 5}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Optimize Playlist
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Optimization Results */}
            {showOptimized && optimizationResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-card/70 backdrop-blur-xl border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      🎯 Optimized Playlist
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Score Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-secondary/30 rounded-xl text-center">
                        <div className="text-sm text-muted-foreground mb-1">Original Score</div>
                        <div className="text-2xl font-bold text-foreground">{optimizationResult.originalScore}</div>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-xl text-center border border-primary/20">
                        <div className="text-sm text-muted-foreground mb-1">Optimized Score</div>
                        <div className="text-2xl font-bold text-primary">{optimizationResult.newScore}</div>
                        {optimizationResult.improvement > 0 && (
                          <div className="text-sm text-primary">+{optimizationResult.improvement} points</div>
                        )}
                      </div>
                    </div>

                    {/* BPM Jumps Improvement */}
                    <div className="p-4 bg-secondary/30 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">BPM Jumps (&gt;20)</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{optimizationResult.bpmJumpsReduced.before}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-primary font-bold">{optimizationResult.bpmJumpsReduced.after}</span>
                          {optimizationResult.bpmJumpsReduced.before > optimizationResult.bpmJumpsReduced.after && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                              -{optimizationResult.bpmJumpsReduced.before - optimizationResult.bpmJumpsReduced.after} jumps
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Side by Side Track List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Original Order */}
                      <div>
                        <h4 className="font-semibold text-muted-foreground mb-3 text-sm uppercase tracking-wide">Original</h4>
                        <ScrollArea className="h-80 rounded-xl border border-border/40">
                          <div className="space-y-1 p-2">
                            {tracks.slice(0, 15).map((track, index) => (
                              <div 
                                key={track.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20"
                              >
                                <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                                {track.albumImage && (
                                  <img 
                                    src={track.albumImage} 
                                    alt="" 
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {track.tempo ? `${Math.round(track.tempo)}` : 'N/A'}
                                </span>
                              </div>
                            ))}
                            {tracks.length > 15 && (
                              <div className="text-center text-sm text-muted-foreground py-2">
                                ...and {tracks.length - 15} more tracks
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Optimized Order */}
                      <div>
                        <h4 className="font-semibold text-primary mb-3 text-sm uppercase tracking-wide">Optimized</h4>
                        <ScrollArea className="h-80 rounded-xl border border-primary/20">
                          <div className="space-y-1 p-2">
                            {optimizationResult.optimizedTracks.slice(0, 15).map((track, index) => {
                              const posChange = getPositionChange(track.id);
                              return (
                                <div 
                                  key={track.id}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20"
                                >
                                  <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                                  {track.albumImage && (
                                    <img 
                                      src={track.albumImage} 
                                      alt="" 
                                      className="w-8 h-8 rounded object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">
                                      {track.tempo ? `${Math.round(track.tempo)}` : 'N/A'}
                                    </span>
                                    {posChange?.change === 'up' && (
                                      <span className="flex items-center text-xs text-primary">
                                        <ArrowUp className="w-3 h-3" />
                                      </span>
                                    )}
                                    {posChange?.change === 'down' && (
                                      <span className="flex items-center text-xs text-chart-orange">
                                        <ArrowDown className="w-3 h-3" />
                                      </span>
                                    )}
                                    {posChange?.change === 'same' && (
                                      <Check className="w-3 h-3 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {optimizationResult.optimizedTracks.length > 15 && (
                              <div className="text-center text-sm text-muted-foreground py-2">
                                ...and {optimizationResult.optimizedTracks.length - 15} more tracks
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Save Options */}
                    <div className="space-y-3 pt-4 border-t border-border/40">
                      <h4 className="font-semibold text-foreground">💾 Save Options</h4>
                      
                      <Button
                        onClick={handleOpenSaveModal}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Save className="w-4 h-4" />
                        Save as New Crate
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        Creates a new Crate with the optimized track order. Original playlist unchanged.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save as Crate Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="bg-card border-border/40">
          <DialogHeader>
            <DialogTitle>Save Optimized Playlist as Crate</DialogTitle>
            <DialogDescription>
              Create a new crate with {optimizationResult?.optimizedTracks.length || 0} tracks in optimized order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="crate-name">Crate Name</Label>
              <Input
                id="crate-name"
                value={crateName}
                onChange={(e) => setCrateName(e.target.value)}
                placeholder="Enter crate name"
                className="bg-secondary/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="crate-description">Description (optional)</Label>
              <Input
                id="crate-description"
                value={crateDescription}
                onChange={(e) => setCrateDescription(e.target.value)}
                placeholder="Optimized for smooth flow"
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {CRATE_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setCrateEmoji(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
                      crateEmoji === emoji 
                        ? "bg-primary/20 ring-2 ring-primary" 
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {CRATE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setCrateColor(color)}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all",
                      crateColor === color 
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" 
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAsCrate} 
              disabled={!crateName.trim() || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Create Crate
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistFlowAnalyzer;
