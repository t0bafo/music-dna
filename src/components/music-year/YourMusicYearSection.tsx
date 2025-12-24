import { useState, useEffect, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTopTracks, getTopArtists, getSavedTracks, getAudioFeaturesFromReccoBeats, SpotifyTrack, SpotifyArtist, AudioFeatures, TimeRange } from '@/lib/spotify-api';
import TopSongsCard from './TopSongsCard';
import TopAlbumsCard from './TopAlbumsCard';
import TopGenresCard from './TopGenresCard';
import AudioEvolutionCard from './AudioEvolutionCard';
import DiscoveryStatsCard from './DiscoveryStatsCard';

interface YourMusicYearSectionProps {
  accessToken: string;
}

type TimePeriod = 'short_term' | 'medium_term' | 'this_year' | 'long_term';

interface CachedData {
  tracks: SpotifyTrack[];
  artists: SpotifyArtist[];
  features: AudioFeatures | null;
  timestamp: number;
}

const TIME_PERIODS: { value: TimePeriod; label: string; apiRange: TimeRange }[] = [
  { value: 'short_term', label: 'Last 4 Weeks', apiRange: 'short_term' },
  { value: 'medium_term', label: 'Last 6 Months', apiRange: 'medium_term' },
  { value: 'this_year', label: 'This Year', apiRange: 'medium_term' },
  { value: 'long_term', label: 'All Time', apiRange: 'long_term' },
];

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const YourMusicYearSection = ({ accessToken }: YourMusicYearSectionProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('medium_term');
  const [isLoading, setIsLoading] = useState(true);
  const [cache, setCache] = useState<Record<TimePeriod, CachedData | null>>({
    short_term: null,
    medium_term: null,
    this_year: null,
    long_term: null,
  });

  // Saved tracks for Top Albums (fetched once, not time-period dependent)
  const [savedTracks, setSavedTracks] = useState<SpotifyTrack[]>([]);
  const [savedTracksLoading, setSavedTracksLoading] = useState(true);

  // Always fetch all-time data for comparison
  const [allTimeArtists, setAllTimeArtists] = useState<SpotifyArtist[]>([]);
  const [baselineFeatures, setBaselineFeatures] = useState<AudioFeatures | null>(null);

  // Fetch saved tracks for Top Albums (one-time fetch)
  useEffect(() => {
    const fetchSavedTracks = async () => {
      setSavedTracksLoading(true);
      try {
        // Fetch up to 200 saved tracks for album analysis
        const allTracks: SpotifyTrack[] = [];
        let offset = 0;
        const batchSize = 50;
        const maxTracks = 200;

        while (offset < maxTracks) {
          const response = await getSavedTracks(accessToken, batchSize, offset);
          const tracks = response.items.map(item => item.track).filter(Boolean);
          allTracks.push(...tracks);
          
          if (!response.next || tracks.length < batchSize) break;
          offset += batchSize;
        }

        setSavedTracks(allTracks);
      } catch (error) {
        console.error('Failed to fetch saved tracks:', error);
      } finally {
        setSavedTracksLoading(false);
      }
    };

    fetchSavedTracks();
  }, [accessToken]);

  const fetchData = useCallback(async (period: TimePeriod) => {
    const cached = cache[period];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }

    const apiRange = TIME_PERIODS.find(p => p.value === period)?.apiRange || 'medium_term';
    
    try {
      const [tracksRes, artistsRes] = await Promise.all([
        getTopTracks(accessToken, apiRange, 50),
        getTopArtists(accessToken, apiRange, 50),
      ]);

      const tracks = tracksRes.items || [];
      const artists = artistsRes.items || [];

      // Get audio features for tracks
      let avgFeatures: AudioFeatures | null = null;
      if (tracks.length > 0) {
        const trackIds = tracks.map(t => t.id);
        const featuresMap = await getAudioFeaturesFromReccoBeats(trackIds);
        
        if (featuresMap.size > 0) {
          const features = Array.from(featuresMap.values());
          avgFeatures = {
            tempo: features.reduce((sum, f) => sum + f.tempo, 0) / features.length,
            danceability: features.reduce((sum, f) => sum + f.danceability, 0) / features.length,
            energy: features.reduce((sum, f) => sum + f.energy, 0) / features.length,
            valence: features.reduce((sum, f) => sum + f.valence, 0) / features.length,
            acousticness: features.reduce((sum, f) => sum + f.acousticness, 0) / features.length,
            speechiness: features.reduce((sum, f) => sum + f.speechiness, 0) / features.length,
            instrumentalness: features.reduce((sum, f) => sum + f.instrumentalness, 0) / features.length,
            liveness: features.reduce((sum, f) => sum + f.liveness, 0) / features.length,
          };
        }
      }

      const data: CachedData = {
        tracks,
        artists,
        features: avgFeatures,
        timestamp: Date.now(),
      };

      setCache(prev => ({ ...prev, [period]: data }));
      return data;
    } catch (error) {
      console.error('Failed to fetch music year data:', error);
      return null;
    }
  }, [accessToken, cache]);

  // Load all-time data for baseline comparison
  useEffect(() => {
    const loadBaseline = async () => {
      const baselineData = await fetchData('long_term');
      if (baselineData) {
        setAllTimeArtists(baselineData.artists);
        setBaselineFeatures(baselineData.features);
      }
    };
    loadBaseline();
  }, [fetchData]);

  // Load data for selected period
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchData(selectedPeriod);
      setIsLoading(false);
    };
    loadData();
  }, [selectedPeriod, fetchData]);

  const currentData = cache[selectedPeriod];

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-base lg:text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            Your Music Year
          </h2>
          <p className="text-xs lg:text-sm text-muted-foreground">
            Your listening wrapped - available anytime
          </p>
        </div>
        
        {/* Time Period Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {TIME_PERIODS.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.value)}
              className={`text-xs px-3 transition-all ${
                selectedPeriod === period.value
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-card/50 border-border/50 hover:bg-muted/50'
              }`}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 lg:gap-6">
        {/* Row 1: Top Songs & Top Albums */}
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
          <TopSongsCard 
            tracks={currentData?.tracks || []} 
            isLoading={isLoading} 
          />
          <TopAlbumsCard 
            savedTracks={savedTracks} 
            isLoading={savedTracksLoading} 
          />
        </div>

        {/* Row 2: Top Genres & Audio Evolution */}
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
          <TopGenresCard 
            artists={currentData?.artists || []} 
            isLoading={isLoading} 
          />
          <AudioEvolutionCard 
            currentFeatures={currentData?.features || null}
            baselineFeatures={baselineFeatures}
            isLoading={isLoading} 
          />
        </div>

        {/* Row 3: Discovery Stats */}
        <DiscoveryStatsCard 
          currentArtists={currentData?.artists || []}
          allTimeArtists={allTimeArtists}
          tracks={currentData?.tracks || []}
          isLoading={isLoading} 
        />
      </div>
    </section>
  );
};

export default YourMusicYearSection;
