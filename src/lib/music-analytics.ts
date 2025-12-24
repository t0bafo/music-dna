/**
 * Music analytics utilities for processing library data
 */

export interface TrackData {
  track_id: string;
  name: string;
  artist: string;
  tempo?: number | null;
  energy?: number | null;
  danceability?: number | null;
  popularity?: number | null;
  added_at?: string | null;
}

/**
 * Calculate genre/artist breakdown from library
 */
export function calculateArtistBreakdown(tracks: TrackData[]): Array<{ genre: string; count: number; percentage: number }> {
  const artistCounts = tracks.reduce((acc, track) => {
    const artist = track.artist || 'Unknown';
    acc[artist] = (acc[artist] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = tracks.length;
  return Object.entries(artistCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: (count / total) * 100
    }));
}

/**
 * Calculate BPM distribution histogram
 */
export function calculateBpmDistribution(tracks: TrackData[]): {
  distribution: Array<{ range: string; count: number; percentage: number }>;
  sweetSpot: { min: number; max: number } | null;
} {
  const tracksWithBpm = tracks.filter(t => t.tempo != null && t.tempo > 0);
  
  if (tracksWithBpm.length === 0) {
    return { distribution: [], sweetSpot: null };
  }

  const bins: Record<string, number> = {
    '60-80': 0,
    '80-100': 0,
    '100-120': 0,
    '120-140': 0,
    '140-160': 0,
    '160+': 0,
  };

  tracksWithBpm.forEach(track => {
    const bpm = track.tempo!;
    if (bpm < 80) bins['60-80']++;
    else if (bpm < 100) bins['80-100']++;
    else if (bpm < 120) bins['100-120']++;
    else if (bpm < 140) bins['120-140']++;
    else if (bpm < 160) bins['140-160']++;
    else bins['160+']++;
  });

  const total = tracksWithBpm.length;
  const distribution = Object.entries(bins).map(([range, count]) => ({
    range,
    count,
    percentage: (count / total) * 100
  }));

  // Find sweet spot (range with most tracks)
  const maxEntry = distribution.reduce((max, curr) => curr.count > max.count ? curr : max);
  const sweetSpotMatch = maxEntry.range.match(/(\d+)-?(\d+)?/);
  const sweetSpot = sweetSpotMatch 
    ? { 
        min: parseInt(sweetSpotMatch[1]), 
        max: sweetSpotMatch[2] ? parseInt(sweetSpotMatch[2]) : 180 
      }
    : null;

  return { distribution, sweetSpot };
}

/**
 * Calculate energy vs danceability scatter data
 * Groups tracks into buckets for visualization
 */
export function calculateEnergyDanceScatter(tracks: TrackData[]): {
  data: Array<{ x: number; y: number; z: number; isMainstream: boolean }>;
  clusterInfo: { avgDance: number; avgEnergy: number } | null;
} {
  const tracksWithFeatures = tracks.filter(
    t => t.energy != null && t.danceability != null
  );

  if (tracksWithFeatures.length === 0) {
    return { data: [], clusterInfo: null };
  }

  // Create 10x10 grid buckets
  const buckets: Record<string, { count: number; mainstreamCount: number }> = {};
  
  let totalDance = 0;
  let totalEnergy = 0;

  tracksWithFeatures.forEach(track => {
    const dance = Math.round((track.danceability! * 100) / 10) * 10;
    const energy = Math.round((track.energy! * 100) / 10) * 10;
    const key = `${dance}-${energy}`;
    
    if (!buckets[key]) {
      buckets[key] = { count: 0, mainstreamCount: 0 };
    }
    buckets[key].count++;
    
    // Mainstream = popularity > 50
    if ((track.popularity || 0) > 50) {
      buckets[key].mainstreamCount++;
    }
    
    totalDance += track.danceability! * 100;
    totalEnergy += track.energy! * 100;
  });

  const data = Object.entries(buckets).map(([key, value]) => {
    const [x, y] = key.split('-').map(Number);
    return {
      x,
      y,
      z: value.count,
      isMainstream: value.mainstreamCount > value.count / 2
    };
  });

  const clusterInfo = {
    avgDance: Math.round(totalDance / tracksWithFeatures.length),
    avgEnergy: Math.round(totalEnergy / tracksWithFeatures.length)
  };

  return { data, clusterInfo };
}

/**
 * Calculate listening patterns by day of week
 */
export function calculateListeningPatterns(tracks: TrackData[]): {
  data: Array<{ day: string; count: number }>;
  mostActiveDay: string | null;
} {
  const tracksWithDates = tracks.filter(t => t.added_at != null);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = days.map(() => 0);

  tracksWithDates.forEach(track => {
    const date = new Date(track.added_at!);
    if (!isNaN(date.getTime())) {
      counts[date.getDay()]++;
    }
  });

  const data = days.map((day, index) => ({
    day,
    count: counts[index]
  }));

  const maxCount = Math.max(...counts);
  const mostActiveIndex = counts.indexOf(maxCount);
  const mostActiveDay = maxCount > 0 ? days[mostActiveIndex] : null;

  return { data, mostActiveDay };
}

/**
 * Generate enhanced AI insights based on actual data patterns
 */
export function generateEnhancedInsights(
  tracks: TrackData[],
  tasteProfile: {
    avgBpm: number;
    avgEnergy: number;
    avgDanceability: number;
    avgValence: number;
    undergroundRatio: number;
    bpmRange: { min: number; max: number };
  }
): string[] {
  const insights: string[] = [];
  
  // BPM clustering insight
  const { distribution, sweetSpot } = calculateBpmDistribution(tracks);
  const clusters = distribution.filter(d => d.percentage > 15);
  
  if (clusters.length >= 2) {
    const clusterNames = clusters.map(c => {
      const bpm = parseInt(c.range);
      if (bpm < 90) return 'slow grooves';
      if (bpm < 120) return 'mid-tempo dance';
      return 'high-energy peaks';
    }).filter((v, i, a) => a.indexOf(v) === i);
    
    insights.push(
      `You have ${clusterNames.length} distinct BPM clusters: ${clusterNames.join(', ')}. ` +
      `Consider creating separate playlists for each energy zone.`
    );
  } else if (sweetSpot) {
    insights.push(
      `Your BPM sweet spot is ${sweetSpot.min}-${sweetSpot.max} BPM, with ${Math.round(tasteProfile.avgBpm)} average. ` +
      `This is your comfort zone for curating.`
    );
  }

  // Danceability + underground insight
  const highDanceCount = tracks.filter(t => (t.danceability || 0) > 0.7).length;
  const highDancePercent = Math.round((highDanceCount / tracks.length) * 100);
  const undergroundPercent = Math.round(tasteProfile.undergroundRatio * 100);
  
  if (highDancePercent > 60 && undergroundPercent > 30) {
    insights.push(
      `${highDancePercent}% of your tracks are highly danceable but only ${100 - undergroundPercent}% are mainstream. ` +
      `You're positioned as a tastemaker curator with underground dance floor gems.`
    );
  } else if (highDancePercent > 60) {
    insights.push(
      `${highDancePercent}% of your library is dance-floor ready. You're built for DJ sets and party playlists.`
    );
  }

  // Underground discovery insight
  if (undergroundPercent > 40) {
    insights.push(
      `Your underground ratio (${undergroundPercent}%) suggests you discover artists before they chart. ` +
      `You're likely 3-6 months ahead of mainstream trends.`
    );
  } else if (undergroundPercent < 20) {
    insights.push(
      `You lean mainstream (${100 - undergroundPercent}% popular tracks). ` +
      `For discovery, try filtering by tracks with popularity < 40.`
    );
  }

  // Energy patterns insight
  const energyData = calculateEnergyDanceScatter(tracks);
  if (energyData.clusterInfo) {
    const { avgDance, avgEnergy } = energyData.clusterInfo;
    
    if (avgDance > 65 && avgEnergy > 65) {
      insights.push(
        `Your center of gravity is high-energy, high-dance (${avgDance}%/${avgEnergy}%). ` +
        `Perfect for workout and party playlists.`
      );
    } else if (avgDance > 60 && avgEnergy < 50) {
      insights.push(
        `You favor danceable but chill tracks (${avgDance}% dance, ${avgEnergy}% energy). ` +
        `Great for lounge and late-night vibes.`
      );
    }
  }

  // Mood insight
  const valencePercent = Math.round(tasteProfile.avgValence * 100);
  if (valencePercent > 60) {
    insights.push(
      `Your music leans positive (${valencePercent}% valence). ` +
      `You gravitate toward uplifting, feel-good tracks.`
    );
  } else if (valencePercent < 40) {
    insights.push(
      `Your taste skews moody (${valencePercent}% valence). ` +
      `You appreciate emotional depth and melancholic tones.`
    );
  }

  return insights.slice(0, 5);
}
