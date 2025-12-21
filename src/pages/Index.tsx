import { useState } from "react";
import { Music, Loader2, AlertCircle, Disc3, TrendingUp, Zap, Heart, Mic2, Volume2, Radio, RefreshCw } from "lucide-react";

// Hardcoded credentials - replace with your actual Spotify credentials
const CLIENT_ID = 'a0c70af1576b40bbb8d899ebdf9b8e08';
const CLIENT_SECRET = 'bf06180c93c149c8ab6eabd2ce8a5924';

const PLAYLIST_ID = '46iQn1DHoYNlHwBIOnfAxi';

interface Track {
  position: number;
  id: string;
  name: string;
  artist: string;
  album: string;
  albumImage?: string;
  tempo?: number;
  danceability?: number;
  energy?: number;
  valence?: number;
  acousticness?: number;
  speechiness?: number;
  instrumentalness?: number;
  liveness?: number;
}

interface Stats {
  avg: number;
  min: number;
  max: number;
}

interface AnalysisStats {
  tempo: Stats;
  danceability: Stats;
  energy: Stats;
  valence: Stats;
  acousticness: Stats;
  speechiness: Stats;
  instrumentalness: Stats;
  liveness: Stats;
}

interface Insights {
  fastest: Track | null;
  mostDanceable: Track | null;
  highestEnergy: Track | null;
  mostPositive: Track | null;
}

type LoadingStep = 'idle' | 'auth' | 'playlist' | 'tracks' | 'features' | 'complete' | 'error';

const loadingMessages: Record<LoadingStep, string> = {
  idle: '',
  auth: '🔐 Authenticating with Spotify...',
  playlist: '📊 Fetching Top 100 Nigeria playlist...',
  tracks: '🎵 Loading 100 tracks...',
  features: '🔬 Analyzing audio features for 100 tracks...',
  complete: '✅ Analysis complete!',
  error: '❌ An error occurred',
};

const Index = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [analysisTime, setAnalysisTime] = useState<string>('');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const calculateStats = (tracksData: Track[], feature: keyof Track): Stats => {
    const values = tracksData
      .map(t => t[feature] as number | undefined)
      .filter((v): v is number => v != null);
    
    if (values.length === 0) return { avg: 0, min: 0, max: 0 };
    
    return {
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  const findInsights = (tracksData: Track[]): Insights => {
    const validTracks = tracksData.filter(t => t.tempo != null);
    
    return {
      fastest: validTracks.reduce((max, t) => 
        (t.tempo || 0) > (max?.tempo || 0) ? t : max, validTracks[0] || null),
      mostDanceable: validTracks.reduce((max, t) => 
        (t.danceability || 0) > (max?.danceability || 0) ? t : max, validTracks[0] || null),
      highestEnergy: validTracks.reduce((max, t) => 
        (t.energy || 0) > (max?.energy || 0) ? t : max, validTracks[0] || null),
      mostPositive: validTracks.reduce((max, t) => 
        (t.valence || 0) > (max?.valence || 0) ? t : max, validTracks[0] || null),
    };
  };

  const analyzePlaylist = async () => {
    setLoadingStep('auth');
    setError("");
    setTracks([]);
    setStats(null);
    setInsights(null);

    try {
      // Step 1: Authentication
      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to authenticate. Check Spotify credentials.");
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Step 2: Fetch playlist tracks
      setLoadingStep('playlist');
      const playlistResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=100`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!playlistResponse.ok) {
        throw new Error("Could not load Top 100 Nigeria playlist. Try again.");
      }

      setLoadingStep('tracks');
      const playlistData = await playlistResponse.json();
      
      const tracksData: Track[] = playlistData.items
        .filter((item: any) => item.track)
        .map((item: any, index: number) => ({
          position: index + 1,
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown',
          album: item.track.album?.name || '',
          albumImage: item.track.album?.images?.[2]?.url || item.track.album?.images?.[0]?.url,
        }));

      // Step 3: Fetch audio features using ReccoBeats API (max 40 IDs per request)
      setLoadingStep('features');
      console.log('Fetching audio features from ReccoBeats for', tracksData.length, 'tracks');
      
      try {
        // ReccoBeats has a limit of 40 IDs per request, so batch them
        const BATCH_SIZE = 40;
        const allFeatures: any[] = [];
        
        for (let i = 0; i < tracksData.length; i += BATCH_SIZE) {
          const batch = tracksData.slice(i, i + BATCH_SIZE);
          const batchIds = batch.map(t => t.id).join(',');
          console.log(`Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} tracks`);
          
          const featuresResponse = await fetch(
            `https://api.reccobeats.com/v1/audio-features?ids=${batchIds}`
          );

          console.log('ReccoBeats batch response status:', featuresResponse.status);

          if (featuresResponse.ok) {
            const featuresData = await featuresResponse.json();
            console.log('Batch audio features received:', featuresData);

            // ReccoBeats returns: { content: [...] }
            const features = Array.isArray(featuresData)
              ? featuresData
              : (featuresData?.content ?? featuresData?.audio_features ?? []);

            allFeatures.push(...features);
          } else {
            const errorData = await featuresResponse.json().catch(() => ({}));
            console.warn('ReccoBeats API batch error:', featuresResponse.status, errorData);
          }
        }

        console.log('Total features collected:', allFeatures.length);

        // Build lookup by Spotify track ID using the href returned by ReccoBeats
        const featuresBySpotifyId = new Map<string, any>();
        for (const f of allFeatures) {
          const href: string | undefined = f?.href;
          const spotifyId = typeof href === 'string'
            ? href.split('/track/')[1]?.split('?')[0]
            : undefined;
          if (spotifyId) featuresBySpotifyId.set(spotifyId, f);
        }

        console.log('Features mapped to Spotify IDs:', featuresBySpotifyId.size);

        // Merge features onto tracks
        tracksData.forEach((track) => {
          const feature = featuresBySpotifyId.get(track.id);
          if (feature) {
            track.tempo = feature.tempo;
            track.danceability = feature.danceability;
            track.energy = feature.energy;
            track.valence = feature.valence;
            track.acousticness = feature.acousticness;
            track.speechiness = feature.speechiness;
            track.instrumentalness = feature.instrumentalness;
            track.liveness = feature.liveness;
          }
        });

        const tracksWithFeatures = tracksData.filter(t => t.tempo != null);
        console.log(`Enriched ${tracksWithFeatures.length} of ${tracksData.length} tracks with audio features`);
        console.log('Merged/enriched tracks sample:', tracksData.slice(0, 3));
      } catch (reccoError) {
        console.warn('ReccoBeats API error:', reccoError);
        console.log('Continuing without audio features...');
      }

      // Calculate statistics
      const analysisStats: AnalysisStats = {
        tempo: calculateStats(tracksData, 'tempo'),
        danceability: calculateStats(tracksData, 'danceability'),
        energy: calculateStats(tracksData, 'energy'),
        valence: calculateStats(tracksData, 'valence'),
        acousticness: calculateStats(tracksData, 'acousticness'),
        speechiness: calculateStats(tracksData, 'speechiness'),
        instrumentalness: calculateStats(tracksData, 'instrumentalness'),
        liveness: calculateStats(tracksData, 'liveness'),
      };

      console.log('Calculated statistics:', analysisStats);

      const trackInsights = findInsights(tracksData);

      setTracks(tracksData);
      setStats(analysisStats);
      setInsights(trackInsights);
      setAnalysisTime(new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      }));
      setLoadingStep('complete');
      
      setTimeout(() => setLoadingStep('idle'), 2000);
    } catch (err) {
      setLoadingStep('error');
      setError(err instanceof Error ? err.message : "Connection error. Please retry.");
    }
  };

  const isLoading = loadingStep !== 'idle' && loadingStep !== 'complete' && loadingStep !== 'error';
  const displayedTracks = showAll ? tracks : tracks.slice(0, 20);
  const progressPercent = {
    idle: 0,
    auth: 20,
    playlist: 40,
    tracks: 60,
    features: 80,
    complete: 100,
    error: 0,
  }[loadingStep];

  const formatPercent = (value: number | undefined) => 
    value != null ? `${(value * 100).toFixed(1)}%` : 'N/A';

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Disc3 className="w-12 h-12 text-nigeria animate-spin-slow" />
              <Music className="w-5 h-5 text-nigeria absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
              🎵 Nigeria Top 100 - Audio DNA Analyzer
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the sonic signature of Nigeria's hottest tracks
          </p>
        </header>

        {/* Analyze Button */}
        <div className="bg-card rounded-xl card-shadow p-6 md:p-8 mb-8 animate-scale-in text-center">
          <button
            onClick={analyzePlaylist}
            disabled={isLoading}
            className="px-8 py-4 bg-nigeria text-primary-foreground font-semibold rounded-lg hover:bg-nigeria-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mx-auto text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-6 h-6" />
                Analyze Playlist
              </>
            )}
          </button>
          
          {/* Loading Progress */}
          {isLoading && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-nigeria transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-muted-foreground text-sm animate-pulse">
                {loadingMessages[loadingStep]}
              </p>
            </div>
          )}
          
          {loadingStep === 'complete' && (
            <p className="mt-4 text-nigeria font-medium animate-fade-in">
              {loadingMessages.complete}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-8 flex items-center justify-between animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
            <button
              onClick={analyzePlaylist}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Analysis
            </button>
          </div>
        )}

        {/* Audio DNA Profile Card */}
        {stats && (
          <div className="bg-card rounded-xl card-shadow p-6 md:p-8 mb-8 animate-scale-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                  🇳🇬 Nigeria Top 100 - Audio DNA Profile
                </h2>
                <p className="text-muted-foreground mt-1">
                  Based on Apple Music's Top 100 Nigeria Chart
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <span className="px-3 py-1 bg-nigeria/10 text-nigeria rounded-full text-sm font-medium">
                  {tracks.length} tracks analyzed
                </span>
                {analysisTime && (
                  <span className="text-xs text-muted-foreground">
                    Analyzed on {analysisTime}
                  </span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <StatCard
                  icon={<Zap className="w-5 h-5" />}
                  label="Average BPM"
                  value={Math.round(stats.tempo.avg).toString()}
                  range={`Range: ${Math.round(stats.tempo.min)}-${Math.round(stats.tempo.max)}`}
                  color="nigeria"
                />
                <StatCard
                  icon={<Disc3 className="w-5 h-5" />}
                  label="Average Danceability"
                  value={formatPercent(stats.danceability.avg)}
                  range={`Range: ${formatPercent(stats.danceability.min)}-${formatPercent(stats.danceability.max)}`}
                  color="primary"
                />
                <StatCard
                  icon={<Volume2 className="w-5 h-5" />}
                  label="Average Energy"
                  value={formatPercent(stats.energy.avg)}
                  range={`Range: ${formatPercent(stats.energy.min)}-${formatPercent(stats.energy.max)}`}
                  color="accent"
                />
                <StatCard
                  icon={<Heart className="w-5 h-5" />}
                  label="Average Valence"
                  value={formatPercent(stats.valence.avg)}
                  range={`Range: ${formatPercent(stats.valence.min)}-${formatPercent(stats.valence.max)}`}
                  color="spotify"
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <StatCard
                  icon={<Radio className="w-5 h-5" />}
                  label="Average Acousticness"
                  value={formatPercent(stats.acousticness.avg)}
                  color="muted"
                />
                <StatCard
                  icon={<Mic2 className="w-5 h-5" />}
                  label="Average Speechiness"
                  value={formatPercent(stats.speechiness.avg)}
                  color="muted"
                />
                <StatCard
                  icon={<Music className="w-5 h-5" />}
                  label="Average Instrumentalness"
                  value={formatPercent(stats.instrumentalness.avg)}
                  color="muted"
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Average Liveness"
                  value={formatPercent(stats.liveness.avg)}
                  color="muted"
                />
              </div>
            </div>
          </div>
        )}

        {/* Key Insights */}
        {insights && (
          <div className="bg-card rounded-xl card-shadow p-6 md:p-8 mb-8 animate-scale-in">
            <h3 className="text-xl font-bold text-card-foreground mb-6 flex items-center gap-2">
              🔍 Key Findings
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <InsightCard
                label="Fastest Track"
                track={insights.fastest}
                value={insights.fastest?.tempo ? `${Math.round(insights.fastest.tempo)} BPM` : 'N/A'}
                icon={<Zap className="w-4 h-4 text-nigeria" />}
              />
              <InsightCard
                label="Most Danceable"
                track={insights.mostDanceable}
                value={formatPercent(insights.mostDanceable?.danceability)}
                icon={<Disc3 className="w-4 h-4 text-primary" />}
              />
              <InsightCard
                label="Highest Energy"
                track={insights.highestEnergy}
                value={formatPercent(insights.highestEnergy?.energy)}
                icon={<Volume2 className="w-4 h-4 text-accent" />}
              />
              <InsightCard
                label="Most Positive Vibe"
                track={insights.mostPositive}
                value={`${formatPercent(insights.mostPositive?.valence)} valence`}
                icon={<Heart className="w-4 h-4 text-spotify" />}
              />
            </div>
          </div>
        )}

        {/* Results Table */}
        {tracks.length > 0 && (
          <div className="bg-card rounded-xl card-shadow overflow-hidden animate-scale-in mb-8">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-nigeria/10 flex items-center justify-center">
                  <Disc3 className="w-4 h-4 text-nigeria" />
                </span>
                Chart Rankings
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (Showing {displayedTracks.length} of {tracks.length})
                </span>
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Track
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Artist
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      BPM
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Dance
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Energy
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Valence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedTracks.map((track, index) => (
                    <tr 
                      key={track.id} 
                      className={`hover:bg-muted/30 transition-colors ${
                        track.position <= 10 ? 'bg-nigeria-light/50' : index % 2 === 1 ? 'bg-muted/20' : ''
                      }`}
                    >
                      <td className={`px-4 py-3 ${track.position <= 10 ? 'font-bold text-nigeria' : 'text-muted-foreground'}`}>
                        {track.position}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {track.albumImage ? (
                            <img
                              src={track.albumImage}
                              alt={track.album}
                              className="w-10 h-10 rounded-md object-cover shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                              <Music className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-card-foreground truncate">
                              {track.name}
                            </p>
                            <p className="text-sm text-muted-foreground sm:hidden truncate">
                              {track.artist}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-card-foreground hidden sm:table-cell">
                        <p className="truncate max-w-[150px]">{track.artist}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-card-foreground font-medium">
                        {track.tempo ? Math.round(track.tempo) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center text-card-foreground hidden md:table-cell">
                        {formatPercent(track.danceability)}
                      </td>
                      <td className="px-4 py-3 text-center text-card-foreground hidden md:table-cell">
                        {formatPercent(track.energy)}
                      </td>
                      <td className="px-4 py-3 text-center text-card-foreground hidden lg:table-cell">
                        {formatPercent(track.valence)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tracks.length > 20 && (
              <div className="p-4 border-t border-border text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-6 py-2 bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors"
                >
                  {showAll ? 'Show Top 20' : 'Show All 100 Tracks'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Methodology Note */}
        {tracks.length > 0 && (
          <footer className="text-center text-xs text-muted-foreground max-w-3xl mx-auto animate-fade-in">
            <p>
              <strong>Methodology:</strong> This analysis examines Spotify's audio features for all {tracks.length} tracks 
              from a curated Top 100 Nigeria playlist mirroring Apple Music's official chart. Audio features include 
              tempo (BPM), danceability, energy, valence (mood/positivity), acousticness, speechiness, instrumentalness, 
              and liveness. Data collected via Spotify Web API on {analysisTime}.
              Chart positions reflect playlist order.
            </p>
          </footer>
        )}

        {/* Empty State */}
        {loadingStep === 'idle' && tracks.length === 0 && !error && (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <Disc3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Click "Analyze Playlist" to discover the audio DNA of Nigeria's Top 100</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, range, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  range?: string;
  color: string;
}) => {
  const colorClasses: Record<string, string> = {
    nigeria: 'bg-nigeria/10 text-nigeria',
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent-foreground',
    spotify: 'bg-spotify/10 text-spotify',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background/50">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-card-foreground">{value}</p>
        {range && <p className="text-xs text-muted-foreground">{range}</p>}
      </div>
    </div>
  );
};

const InsightCard = ({ label, track, value, icon }: {
  label: string;
  track: Track | null;
  value: string;
  icon: React.ReactNode;
}) => {
  if (!track) return null;
  
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background/50">
      {track.albumImage ? (
        <img
          src={track.albumImage}
          alt={track.album}
          className="w-12 h-12 rounded-md object-cover shadow-sm"
        />
      ) : (
        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
          <Music className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
        </div>
        <p className="font-semibold text-card-foreground truncate">{track.name}</p>
        <p className="text-sm text-muted-foreground">
          {value} <span className="text-xs">(#{track.position})</span>
        </p>
      </div>
    </div>
  );
};

export default Index;
