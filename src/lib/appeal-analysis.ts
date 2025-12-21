// Appeal Analysis utilities for playlist curation

export interface TrackWithPopularity {
  id: string;
  name: string;
  artist: string;
  popularity: number;
  position?: number;
}

export interface AppealTier {
  icon: string;
  label: string;
  color: string;
}

export interface AppealDistribution {
  mainstream: number;    // 80-100
  popular: number;       // 60-79
  midTier: number;       // 40-59
  underground: number;   // 20-39
  deepUnderground: number; // 0-19
}

export interface AppealProfile {
  overallScore: number;
  distribution: AppealDistribution;
  percentages: AppealDistribution;
  recommendation: string;
  recommendationType: 'success' | 'warning' | 'tip';
  undergroundGems: TrackWithPopularity[];
  mainstreamHits: TrackWithPopularity[];
}

export const getAppealTier = (popularity: number): AppealTier => {
  if (popularity >= 80) {
    return { icon: '🔥', label: 'Mainstream Hit', color: 'text-orange-500' };
  }
  if (popularity >= 60) {
    return { icon: '📈', label: 'Popular', color: 'text-green-500' };
  }
  if (popularity >= 40) {
    return { icon: '🎵', label: 'Mid-Tier', color: 'text-blue-500' };
  }
  if (popularity >= 20) {
    return { icon: '💎', label: 'Underground', color: 'text-purple-500' };
  }
  return { icon: '🌱', label: 'Deep Underground', color: 'text-emerald-500' };
};

export const calculateAppealProfile = (tracks: TrackWithPopularity[]): AppealProfile => {
  const totalTracks = tracks.length;
  
  if (totalTracks === 0) {
    return {
      overallScore: 0,
      distribution: { mainstream: 0, popular: 0, midTier: 0, underground: 0, deepUnderground: 0 },
      percentages: { mainstream: 0, popular: 0, midTier: 0, underground: 0, deepUnderground: 0 },
      recommendation: 'Add tracks to analyze appeal profile',
      recommendationType: 'tip',
      undergroundGems: [],
      mainstreamHits: [],
    };
  }

  // Count tracks in each tier
  const distribution = {
    mainstream: tracks.filter(t => t.popularity >= 80).length,
    popular: tracks.filter(t => t.popularity >= 60 && t.popularity < 80).length,
    midTier: tracks.filter(t => t.popularity >= 40 && t.popularity < 60).length,
    underground: tracks.filter(t => t.popularity >= 20 && t.popularity < 40).length,
    deepUnderground: tracks.filter(t => t.popularity < 20).length,
  };

  // Calculate percentages
  const percentages = {
    mainstream: Number((distribution.mainstream / totalTracks * 100).toFixed(1)),
    popular: Number((distribution.popular / totalTracks * 100).toFixed(1)),
    midTier: Number((distribution.midTier / totalTracks * 100).toFixed(1)),
    underground: Number((distribution.underground / totalTracks * 100).toFixed(1)),
    deepUnderground: Number((distribution.deepUnderground / totalTracks * 100).toFixed(1)),
  };

  // Overall appeal score (average popularity)
  const avgPopularity = tracks.reduce((sum, t) => sum + t.popularity, 0) / totalTracks;
  const overallScore = Math.round(avgPopularity);

  // Get underground gems and mainstream hits
  const undergroundGems = tracks
    .filter(t => t.popularity < 30)
    .sort((a, b) => a.popularity - b.popularity)
    .slice(0, 5);

  const mainstreamHits = tracks
    .filter(t => t.popularity >= 80)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5);

  // Calculate underground total (underground + deepUnderground)
  const undergroundTotal = percentages.underground + percentages.deepUnderground;
  const mainstreamTotal = percentages.mainstream + percentages.popular;

  // Generate recommendation
  let recommendation: string;
  let recommendationType: 'success' | 'warning' | 'tip';

  if (percentages.mainstream > 60) {
    recommendation = 'Too mainstream - add underground tracks for curator credibility';
    recommendationType = 'warning';
  } else if (undergroundTotal > 60) {
    recommendation = 'Too underground - add 3-5 popular tracks for algorithm boost';
    recommendationType = 'warning';
  } else if (mainstreamTotal >= 40 && mainstreamTotal <= 70 && undergroundTotal >= 15) {
    recommendation = 'Perfect balance for growth - great curator mix!';
    recommendationType = 'success';
  } else if (undergroundTotal >= 30) {
    recommendation = 'Great curator playlist - strong underground selection';
    recommendationType = 'success';
  } else {
    recommendation = 'Good mix - consider featuring underground gems earlier';
    recommendationType = 'tip';
  }

  return {
    overallScore,
    distribution,
    percentages,
    recommendation,
    recommendationType,
    undergroundGems,
    mainstreamHits,
  };
};

export interface AppealInsight {
  type: 'success' | 'warning' | 'tip';
  message: string;
}

export const generateAppealInsights = (
  tracks: TrackWithPopularity[], 
  profile: AppealProfile
): AppealInsight[] => {
  const insights: AppealInsight[] = [];
  const totalTracks = tracks.length;

  if (totalTracks === 0) return insights;

  // Find highest popularity track
  const mostPopular = [...tracks].sort((a, b) => b.popularity - a.popularity)[0];
  
  // Check if most popular track is in top 5
  if (mostPopular && mostPopular.position && mostPopular.position <= 5) {
    insights.push({
      type: 'success',
      message: `"${mostPopular.name}" (popularity ${mostPopular.popularity}) is well-positioned in top 5 - great for algorithm`,
    });
  } else if (mostPopular && mostPopular.position && mostPopular.position > 10) {
    insights.push({
      type: 'tip',
      message: `Move "${mostPopular.name}" (${mostPopular.popularity} popularity) to top 5 for better discovery`,
    });
  }

  // Strengths
  if (profile.mainstreamHits.length > 0) {
    insights.push({
      type: 'success',
      message: `${profile.mainstreamHits.length} mainstream hit${profile.mainstreamHits.length > 1 ? 's' : ''} anchor${profile.mainstreamHits.length === 1 ? 's' : ''} your playlist for algorithm visibility`,
    });
  }

  if (profile.undergroundGems.length > 0) {
    insights.push({
      type: 'success',
      message: `${profile.undergroundGems.length} underground gem${profile.undergroundGems.length > 1 ? 's' : ''} add${profile.undergroundGems.length === 1 ? 's' : ''} curator credibility`,
    });
  }

  // Opportunities
  if (profile.percentages.mainstream > 50) {
    insights.push({
      type: 'warning',
      message: `${profile.percentages.mainstream}% mainstream tracks may dilute your curator brand`,
    });
  }

  const undergroundTotal = profile.percentages.underground + profile.percentages.deepUnderground;
  if (undergroundTotal < 15 && profile.distribution.mainstream > 0) {
    insights.push({
      type: 'tip',
      message: 'Add 2-3 underground tracks (<40 popularity) for better curator credibility',
    });
  }

  // Check for underground tracks buried at the end
  const last10Tracks = tracks.slice(-10);
  const undergroundInLast10 = last10Tracks.filter(t => t.popularity < 40).length;
  if (undergroundInLast10 >= 3 && tracks.length > 15) {
    insights.push({
      type: 'tip',
      message: 'Consider spreading underground gems throughout the playlist, not just at the end',
    });
  }

  // Growth tips
  if (profile.overallScore >= 60 && profile.overallScore < 70) {
    insights.push({
      type: 'success',
      message: 'Your 60-70 appeal score is ideal for balanced growth and discovery',
    });
  }

  if (profile.undergroundGems.length > 0) {
    const firstGem = profile.undergroundGems[0];
    if (firstGem.position && firstGem.position > 20) {
      insights.push({
        type: 'tip',
        message: `Feature underground gem "${firstGem.name}" earlier (currently #${firstGem.position})`,
      });
    }
  }

  return insights;
};
