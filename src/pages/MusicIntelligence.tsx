import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Brain, 
  Loader2, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Music,
  Sparkles,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import UserProfile from '@/components/UserProfile';
import {
  extractMusicLibrary,
  getLibraryStats,
  getTasteProfile,
  getTasteSnapshots,
  generateInsights,
  ExtractionProgress,
  TasteProfile,
  LibraryStats,
  TasteSnapshot,
} from '@/lib/music-intelligence';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

const MusicIntelligence = () => {
  const { isAuthenticated, isLoading: authLoading, accessToken, user } = useAuth();
  const navigate = useNavigate();

  // State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const [libraryStats, setLibraryStats] = useState<LibraryStats | null>(null);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [snapshots, setSnapshots] = useState<TasteSnapshot[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load existing data - now uses accessToken for secure API calls
  const loadData = useCallback(async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const [stats, profile, snapshotData] = await Promise.all([
        getLibraryStats(accessToken),
        getTasteProfile(accessToken),
        getTasteSnapshots(accessToken),
      ]);

      setLibraryStats(stats);
      setTasteProfile(profile);
      setSnapshots(snapshotData);

      if (profile) {
        setInsights(generateInsights(profile));
      }
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
      // Token might be expired
      if (err instanceof Error && err.message.includes('Invalid Spotify token')) {
        setError('Session expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken, loadData]);

  // Handle extraction
  const handleExtract = async () => {
    if (!accessToken || !user?.id) return;

    setIsExtracting(true);
    setError(null);

    try {
      await extractMusicLibrary(accessToken, user.id, setExtractionProgress);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  };

  // Calculate days since last update
  const daysSinceUpdate = libraryStats?.lastUpdated 
    ? Math.floor((Date.now() - libraryStats.lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Radar chart data
  const radarData = tasteProfile ? [
    { feature: 'Energy', value: tasteProfile.avgEnergy * 100, fullMark: 100 },
    { feature: 'Dance', value: tasteProfile.avgDanceability * 100, fullMark: 100 },
    { feature: 'Valence', value: tasteProfile.avgValence * 100, fullMark: 100 },
    { feature: 'Acoustic', value: tasteProfile.avgAcousticness * 100, fullMark: 100 },
    { feature: 'Instrumental', value: tasteProfile.avgInstrumentalness * 100, fullMark: 100 },
    { feature: 'Liveness', value: tasteProfile.avgLiveness * 100, fullMark: 100 },
  ] : [];

  // Energy distribution data
  const energyData = tasteProfile ? [
    { name: 'Chill', value: Math.round(tasteProfile.energyDistribution.low * 100), color: '#6366f1' },
    { name: 'Medium', value: Math.round(tasteProfile.energyDistribution.medium * 100), color: '#8b5cf6' },
    { name: 'High', value: Math.round(tasteProfile.energyDistribution.high * 100), color: '#a855f7' },
  ] : [];

  // Trend data from snapshots
  const trendData = snapshots.slice().reverse().map(s => ({
    date: s.snapshotDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    energy: Math.round(s.avgEnergy * 100),
    danceability: Math.round(s.avgDanceability * 100),
    valence: Math.round(s.avgValence * 100),
  }));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const hasData = libraryStats && tasteProfile;

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">
              Music DNA
            </span>
          </div>
          <UserProfile />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Music Intelligence
            </h1>
          </div>
          <p className="text-muted-foreground">
            Deep insights into your complete music library and listening patterns.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Extraction Status / CTA */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            {isExtracting ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Extracting Your Library</p>
                    <p className="text-sm text-muted-foreground">{extractionProgress?.message}</p>
                  </div>
                </div>
                <Progress 
                  value={extractionProgress?.total ? (extractionProgress.current / extractionProgress.total) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {extractionProgress?.current} / {extractionProgress?.total || '?'}
                </p>
              </div>
            ) : hasData ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-semibold text-foreground">Library Synced</p>
                    <p className="text-sm text-muted-foreground">
                      {libraryStats.totalTracks.toLocaleString()} tracks • {libraryStats.tracksWithFeatures.toLocaleString()} with features
                      {daysSinceUpdate !== null && ` • Updated ${daysSinceUpdate === 0 ? 'today' : `${daysSinceUpdate}d ago`}`}
                    </p>
                  </div>
                </div>
                <Button onClick={handleExtract} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            ) : loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Checking for existing data...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Extract Your Music Library
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Analyze your complete Spotify library including liked songs, playlists, and audio features.
                </p>
                <Button onClick={handleExtract} size="lg" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Start Extraction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        {hasData && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Audio DNA Radar */}
            <Card className="col-span-full md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Your Audio DNA
                </CardTitle>
                <CardDescription>
                  Signature sound profile based on {tasteProfile.totalTracks.toLocaleString()} tracks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="feature" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <Radar
                        name="Your Profile"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg BPM</span>
                    <span className="font-semibold">{Math.round(tasteProfile.avgBpm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BPM Range</span>
                    <span className="font-semibold">
                      {Math.round(tasteProfile.bpmRange.min)}-{Math.round(tasteProfile.bpmRange.max)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discovery Analytics */}
            <Card className="col-span-full md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Discovery Profile
                </CardTitle>
                <CardDescription>
                  How underground vs mainstream is your taste
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Underground Ratio</span>
                    <Badge variant={tasteProfile.undergroundRatio > 0.5 ? 'default' : 'secondary'}>
                      {Math.round(tasteProfile.undergroundRatio * 100)}%
                    </Badge>
                  </div>
                  <Progress value={tasteProfile.undergroundRatio * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {tasteProfile.undergroundRatio > 0.5 
                      ? "You're a tastemaker! Most of your music is underground."
                      : "You balance hits with hidden gems."}
                  </p>
                </div>

                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={energyData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={60} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Tracks']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {energyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Top Insights
                </CardTitle>
                <CardDescription>
                  AI-generated observations about your music taste
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {insights.map((insight, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Chart (if we have historical data) */}
            {trendData.length > 1 && (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Taste Evolution
                  </CardTitle>
                  <CardDescription>
                    How your audio preferences have changed over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="energy" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6' }}
                          name="Energy"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="danceability" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          dot={{ fill: '#6366f1' }}
                          name="Danceability"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="valence" 
                          stroke="#a855f7" 
                          strokeWidth={2}
                          dot={{ fill: '#a855f7' }}
                          name="Valence"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Library Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{libraryStats.totalTracks.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Tracks</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{libraryStats.tracksWithFeatures.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">With Features</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{Math.round(tasteProfile.avgBpm)}</p>
                    <p className="text-sm text-muted-foreground">Avg BPM</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{Math.round(tasteProfile.avgEnergy * 100)}%</p>
                    <p className="text-sm text-muted-foreground">Avg Energy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MusicIntelligence;
