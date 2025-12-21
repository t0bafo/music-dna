import { AppealProfile, getAppealTier } from '@/lib/appeal-analysis';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface AppealScoreCardProps {
  profile: AppealProfile;
  trackCount: number;
}

const AppealScoreCard = ({ profile, trackCount }: AppealScoreCardProps) => {
  const [showGems, setShowGems] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (score >= 40) return <Minus className="w-5 h-5 text-yellow-500" />;
    return <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  const getRecommendationStyle = () => {
    switch (profile.recommendationType) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    }
  };

  const tiers = [
    { key: 'mainstream', label: 'Mainstream Hits', icon: '🔥', color: 'bg-orange-500', count: profile.distribution.mainstream, pct: profile.percentages.mainstream },
    { key: 'popular', label: 'Popular', icon: '📈', color: 'bg-green-500', count: profile.distribution.popular, pct: profile.percentages.popular },
    { key: 'midTier', label: 'Mid-Tier', icon: '🎵', color: 'bg-blue-500', count: profile.distribution.midTier, pct: profile.percentages.midTier },
    { key: 'underground', label: 'Underground', icon: '💎', color: 'bg-purple-500', count: profile.distribution.underground, pct: profile.percentages.underground },
    { key: 'deepUnderground', label: 'Deep Underground', icon: '🌱', color: 'bg-emerald-500', count: profile.distribution.deepUnderground, pct: profile.percentages.deepUnderground },
  ];

  const totalDistribution = tiers.reduce((sum, t) => sum + t.pct, 0);

  return (
    <div className="bg-card rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">Playlist Appeal Profile</h3>
        {getScoreIcon(profile.overallScore)}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">Overall Appeal</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-5xl font-bold ${getScoreColor(profile.overallScore)}`}>
              {profile.overallScore}
            </span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{trackCount} tracks analyzed</p>
        </div>

        {/* Distribution */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Distribution Breakdown</p>
          
          {/* Stacked Bar */}
          <div className="h-6 rounded-full overflow-hidden flex mb-4 bg-muted">
            {tiers.map((tier) => (
              tier.pct > 0 && (
                <div
                  key={tier.key}
                  className={`${tier.color} transition-all`}
                  style={{ width: `${(tier.pct / totalDistribution) * 100}%` }}
                  title={`${tier.label}: ${tier.pct}%`}
                />
              )
            ))}
          </div>

          {/* Legend */}
          <div className="space-y-1.5">
            {tiers.map((tier) => (
              <div key={tier.key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{tier.icon}</span>
                  <span className="text-muted-foreground">{tier.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-card-foreground font-medium">{tier.count}</span>
                  <span className="text-muted-foreground text-xs">({tier.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Curator Insight */}
      <div className={`mt-6 p-4 rounded-lg border ${getRecommendationStyle()}`}>
        <p className="text-sm font-medium">
          💡 Curator Insight: {profile.recommendation}
        </p>
      </div>

      {/* Underground Gems Expandable */}
      {profile.undergroundGems.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowGems(!showGems)}
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showGems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>💎 View {profile.undergroundGems.length} Underground Gem{profile.undergroundGems.length > 1 ? 's' : ''}</span>
          </button>
          
          {showGems && (
            <div className="mt-3 space-y-2 pl-6">
              {profile.undergroundGems.map((track, i) => {
                const tier = getAppealTier(track.popularity);
                return (
                  <div key={track.id || i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">#{track.position}</span>
                      <span className="text-card-foreground truncate max-w-[200px]">{track.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{tier.icon}</span>
                      <span className={tier.color}>{track.popularity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppealScoreCard;
