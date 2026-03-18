import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import UserProfile from '@/components/UserProfile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePageTitle } from '@/hooks/use-page-title';
import { createPlaylist, addTracksToPlaylist } from '@/lib/spotify-api';
import { addTracksToCrate } from '@/lib/crates-api';
import { toast } from 'sonner';
import {
  Loader2, Music, Zap, Clock, ExternalLink, Save,
  ChevronLeft, AlertTriangle, BarChart3, User, ArrowRight, ShieldAlert
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type SlotType = 'foundation_setter' | 'energy_builder' | 'peak_energy' | 'late_peak_curator' | 'deep_dive' | 'global_closer';

const SLOT_OPTIONS: { value: SlotType; label: string; dj: string; time: string; genre: string; emoji: string; role: string }[] = [
  { value: 'foundation_setter', label: 'Foundation Setter', dj: 'SAMINO', time: '10-11PM', genre: 'Afro House', emoji: '🌍', role: 'Foundation Setter' },
  { value: 'energy_builder', label: 'Energy Builder', dj: 'MUDIA', time: '11PM-12AM', genre: 'Afro House', emoji: '🔥', role: 'Energy Builder' },
  { value: 'peak_energy', label: 'Peak Energy', dj: 'NIFFSTER', time: '12-1AM', genre: 'Amapiano', emoji: '⚡', role: 'Peak Ignition' },
  { value: 'late_peak_curator', label: 'Late Peak Curator', dj: 'DESTINEE', time: '1-2AM', genre: 'Amapiano → Afrobeats', emoji: '🎭', role: 'Late Peak Curator' },
  { value: 'deep_dive', label: 'Deep Dive', dj: 'MIKEWEST', time: '2-3AM', genre: 'Afrobeats', emoji: '🎧', role: 'Deep Dive / Curator' },
  { value: 'global_closer', label: 'Global Closer', dj: 'TOBEGO', time: '3-4AM', genre: 'Afro-Tech & Global', emoji: '🌙', role: 'Global Closer' },
];

interface SegmentInfo {
  label: string;
  sound: string;
  energy: { min: number; max: number };
  bpm: { min: number; max: number };
  trackCount: number;
  transition_to: string | null;
  handoff_notes: string | null;
}

interface PlaylistTrack {
  id: string;
  name: string;
  artists: string[];
  duration_ms: number;
  bpm: number | null;
  energy: number | null;
  danceability: number | null;
  valence: number | null;
  spotify_url: string;
  album_art: string | null;
  album_name: string | null;
}

interface PlaylistResult {
  name: string;
  slot: string;
  dj: string;
  role: string;
  genre: string;
  time: string;
  energy_arc: { start: number; end: number };
  segments: SegmentInfo[];
  rules: string[];
  tracks: PlaylistTrack[];
  metadata: {
    totalTracks: number;
    totalDurationMs: number;
    totalDurationMin: number;
    averageBPM: number | null;
    energyProgression: number[];
    criteria: {
      genre: string;
      time: string;
      bpmRange: { min: number; max: number };
      energyRange: { min: number; max: number };
      characteristics: string;
    };
  };
  warnings: string[];
}

const SNITCGenerator = () => {
  usePageTitle('SNITC Generator');
  const navigate = useNavigate();
  const { isAuthenticated, accessToken, user } = useAuth();

  const [selectedSlot, setSelectedSlot] = useState<SlotType | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PlaylistResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!selectedSlot) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('snitc-generator', {
        body: { slot: selectedSlot },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      setResult(data.playlist);
      toast.success(`Generated ${data.playlist.tracks.length} tracks for ${data.playlist.dj}!`);
    } catch (err: any) {
      setError(err.message);
      toast.error('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportToSpotify = async () => {
    if (!result || !accessToken || !user) {
      toast.error('Please log in to export');
      return;
    }

    setIsExporting(true);
    try {
      const playlist = await createPlaylist(
        accessToken, user.id, result.name,
        `Apollo Wrldx SNITC • ${result.dj} • ${result.genre} • ${result.time} • Generated by Music DNA`,
        false
      );

      const uris = result.tracks.map(t => `spotify:track:${t.id}`);
      for (let i = 0; i < uris.length; i += 100) {
        await addTracksToPlaylist(accessToken, playlist.id, uris.slice(i, i + 100));
      }

      toast.success('Exported to Spotify!', {
        action: {
          label: 'Open',
          onClick: () => window.open(playlist.external_urls.spotify, '_blank'),
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAsCrate = async () => {
    if (!result || !accessToken) {
      toast.error('Please log in to save');
      return;
    }

    setIsSaving(true);
    try {
      const slotInfo = SLOT_OPTIONS.find(s => s.value === result.slot);
      await supabase.functions.invoke('music-intelligence', {
        body: { action: 'create_crate', name: result.name, description: result.metadata.criteria.characteristics, emoji: slotInfo?.emoji || '🎵' },
        headers: { 'x-spotify-token': accessToken },
      });
      toast.success('Saved as crate!');
      navigate('/crates');
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const selectedSlotInfo = SLOT_OPTIONS.find(s => s.value === selectedSlot);

  const energyChartData = result?.tracks
    .filter(t => t.energy !== null)
    .map((t, i) => ({
      index: i + 1,
      energy: Math.round((t.energy || 0) * 100),
      name: t.name.length > 20 ? t.name.slice(0, 20) + '…' : t.name,
    })) || [];

  const chartConfig = {
    energy: { label: 'Energy', color: 'hsl(var(--primary))' },
  };

  // Compute segment boundaries for track list section markers
  const getSegmentBoundaries = () => {
    if (!result?.segments) return [];
    let trackIndex = 0;
    return result.segments.map(seg => {
      const start = trackIndex;
      trackIndex += seg.trackCount;
      return { ...seg, startIndex: start, endIndex: trackIndex };
    });
  };

  const segmentBoundaries = getSegmentBoundaries();

  const getSegmentForTrack = (index: number) => {
    return segmentBoundaries.find(sb => index >= sb.startIndex && index < sb.endIndex);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/studio')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold font-display">SNITC Generator</h1>
              <p className="text-xs text-muted-foreground">Apollo Wrldx • SNITC Brooklyn • April 25, 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Slot Selector */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Select DJ Slot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedSlot} onValueChange={(v) => setSelectedSlot(v as SlotType)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Choose a DJ slot..." />
              </SelectTrigger>
              <SelectContent>
                {SLOT_OPTIONS.map(slot => (
                  <SelectItem key={slot.value} value={slot.value}>
                    <span className="flex items-center gap-2">
                      <span>{slot.emoji}</span>
                      <span className="font-medium">{slot.dj}</span>
                      <span className="text-muted-foreground text-xs">— {slot.role} ({slot.time})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSlotInfo && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-muted/50 p-4 text-sm space-y-2"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-bold text-base">{selectedSlotInfo.dj}</span>
                  <Badge variant="outline" className="text-[10px]">{selectedSlotInfo.time}</Badge>
                </div>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedSlotInfo.role}</span> — {selectedSlotInfo.genre}
                </p>
              </motion.div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!selectedSlot || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating {selectedSlotInfo?.dj}'s playlist...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Playlist
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Generation Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* DJ Header & Metadata */}
              <Card className="border-border/50 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{result.dj}</CardTitle>
                      <p className="text-xs text-muted-foreground">{result.role} • {result.time}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">
                      <Music className="w-3 h-3 mr-1" />
                      {result.metadata.totalTracks} tracks
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      {result.metadata.totalDurationMin} min
                    </Badge>
                    {result.metadata.averageBPM && (
                      <Badge variant="secondary">♫ {result.metadata.averageBPM} BPM avg</Badge>
                    )}
                    <Badge variant="outline">{result.genre}</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      ⚡ {Math.round(result.energy_arc.start * 100)} → {Math.round(result.energy_arc.end * 100)}
                    </Badge>
                  </div>

                  {result.warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-yellow-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {w}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Segments Breakdown */}
              {result.segments && result.segments.length > 0 && (
                <Card className="border-border/50 bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sound Progression</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.segments.map((seg, i) => (
                      <div key={i} className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">Tracks {seg.label}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {seg.bpm.min}-{seg.bpm.max} BPM
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              ⚡{Math.round(seg.energy.min * 100)}-{Math.round(seg.energy.max * 100)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{seg.sound}</p>
                        {seg.transition_to && (
                          <div className="flex items-center gap-1.5 text-[10px] text-primary/80 mt-1">
                            <ArrowRight className="w-3 h-3" />
                            <span>Handoff → <strong>{seg.transition_to}</strong></span>
                            {seg.handoff_notes && (
                              <span className="text-muted-foreground ml-1">— {seg.handoff_notes}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Rules */}
              {result.rules && result.rules.length > 0 && (
                <Card className="border-border/50 bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      Set Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {result.rules.map((rule, i) => (
                        <Badge
                          key={i}
                          variant={rule.startsWith('No') || rule.startsWith('NO') ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {rule}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Energy Chart */}
              {energyChartData.length > 2 && (
                <Card className="border-border/50 bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Energy Progression
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[180px] w-full">
                      <LineChart data={energyChartData}>
                        <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="energy"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Track List with Segment Headers */}
              <Card className="border-border/50 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tracklist</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {result.tracks.map((track, i) => {
                      const seg = getSegmentForTrack(i);
                      const showSegHeader = seg && seg.startIndex === i;

                      return (
                        <div key={track.id}>
                          {showSegHeader && (
                            <div className="px-4 py-2 bg-primary/5 border-b border-border/30">
                              <p className="text-[11px] font-bold text-primary">
                                Tracks {seg.label} — {seg.sound.slice(0, 60)}{seg.sound.length > 60 ? '…' : ''}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                            {track.album_art ? (
                              <img src={track.album_art} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                <Music className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{track.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{track.artists.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {track.bpm && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {track.bpm}
                                </Badge>
                              )}
                              {track.energy !== null && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  ⚡{Math.round(track.energy * 100)}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{formatDuration(track.duration_ms)}</span>
                              <a
                                href={track.spotify_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleExportToSpotify}
                  disabled={isExporting || !isAuthenticated}
                  className="flex-1"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Export to Spotify
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveAsCrate}
                  disabled={isSaving || !isAuthenticated}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save as Crate
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
};

export default SNITCGenerator;
