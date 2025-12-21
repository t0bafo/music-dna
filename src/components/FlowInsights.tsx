import { FlowInsight } from '@/lib/flow-analysis';
import { AppealInsight } from '@/lib/appeal-analysis';
import { CheckCircle2, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';

interface FlowInsightsProps {
  insights: FlowInsight[];
  appealInsights?: AppealInsight[];
}

const FlowInsights = ({ insights, appealInsights = [] }: FlowInsightsProps) => {
  const successInsights = insights.filter(i => i.type === 'success');
  const warningInsights = insights.filter(i => i.type === 'warning');
  const tipInsights = insights.filter(i => i.type === 'tip');

  const appealSuccess = appealInsights.filter(i => i.type === 'success');
  const appealWarning = appealInsights.filter(i => i.type === 'warning');
  const appealTip = appealInsights.filter(i => i.type === 'tip');

  const renderInsight = (insight: FlowInsight | AppealInsight, index: number) => {
    const getIcon = () => {
      switch (insight.type) {
        case 'success':
          return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
        case 'warning':
          return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
        case 'tip':
          return <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0" />;
      }
    };

    return (
      <div key={index} className="flex items-start gap-3 py-2">
        {getIcon()}
        <p className="text-card-foreground text-sm">{insight.message}</p>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl p-6 card-shadow">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Insights & Recommendations</h3>
      
      <div className="space-y-4">
        {successInsights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-500 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              What's Working
            </h4>
            <div className="pl-2 border-l-2 border-green-500/30">
              {successInsights.map((insight, i) => renderInsight(insight, i))}
            </div>
          </div>
        )}

        {warningInsights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-yellow-500 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Areas to Improve
            </h4>
            <div className="pl-2 border-l-2 border-yellow-500/30">
              {warningInsights.map((insight, i) => renderInsight(insight, i))}
            </div>
          </div>
        )}

        {tipInsights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-blue-500 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Pro Tips
            </h4>
            <div className="pl-2 border-l-2 border-blue-500/30">
              {tipInsights.map((insight, i) => renderInsight(insight, i))}
            </div>
          </div>
        )}

        {/* Appeal & Discovery Insights */}
        {appealInsights.length > 0 && (
          <div className="pt-4 mt-4 border-t border-border">
            <h4 className="text-sm font-medium text-purple-500 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              📊 Appeal & Discovery Insights
            </h4>
            
            {appealSuccess.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">✅ Strengths</p>
                <div className="pl-2 border-l-2 border-green-500/30">
                  {appealSuccess.map((insight, i) => renderInsight(insight, i))}
                </div>
              </div>
            )}

            {appealWarning.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">⚠️ Opportunities</p>
                <div className="pl-2 border-l-2 border-yellow-500/30">
                  {appealWarning.map((insight, i) => renderInsight(insight, i))}
                </div>
              </div>
            )}

            {appealTip.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">💡 Growth Tips</p>
                <div className="pl-2 border-l-2 border-purple-500/30">
                  {appealTip.map((insight, i) => renderInsight(insight, i))}
                </div>
              </div>
            )}
          </div>
        )}

        {insights.length === 0 && appealInsights.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Not enough data to generate insights. Try selecting a playlist with more tracks.
          </p>
        )}
      </div>
    </div>
  );
};

export default FlowInsights;
