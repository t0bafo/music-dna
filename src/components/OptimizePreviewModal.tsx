import { OptimizationResult } from '@/lib/playlist-optimizer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OptimizePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  result: OptimizationResult | null;
  isLoading?: boolean;
}

const OptimizePreviewModal = ({
  isOpen,
  onClose,
  onApply,
  result,
  isLoading = false,
}: OptimizePreviewModalProps) => {
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Sparkles className="w-12 h-12 text-spotify animate-pulse" />
              <div className="absolute inset-0 animate-spin">
                <div className="w-full h-full border-2 border-spotify/30 border-t-spotify rounded-full" />
              </div>
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">Optimizing playlist flow...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing BPM transitions and energy arc
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!result) return null;

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-500';
    if (improvement < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="w-4 h-4" />;
    if (improvement < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const jumpsReduced = result.bpmJumpsReduced.before - result.bpmJumpsReduced.after;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-spotify" />
            Optimization Preview
          </DialogTitle>
          <DialogDescription>
            Here's how your playlist flow will improve with the new track order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Flow Score Comparison */}
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">Flow Score</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{result.originalScore}</p>
                <p className="text-xs text-muted-foreground">Before</p>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-3xl font-bold text-spotify">{result.newScore}</p>
                <p className="text-xs text-muted-foreground">After</p>
              </div>
              <div className={`flex items-center gap-1 text-lg font-bold ${getImprovementColor(result.improvement)}`}>
                {getImprovementIcon(result.improvement)}
                {result.improvement > 0 ? '+' : ''}{result.improvement}
              </div>
            </div>
          </div>

          {/* BPM Jumps Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">BPM Jumps (&gt;20)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {result.bpmJumpsReduced.before}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-bold text-green-500">
                  {result.bpmJumpsReduced.after}
                </span>
              </div>
              {jumpsReduced > 0 && (
                <p className="text-xs text-green-500 mt-1">
                  -{jumpsReduced} jump{jumpsReduced !== 1 ? 's' : ''} fixed
                </p>
              )}
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Improvement</p>
              <div className={`text-2xl font-bold ${getImprovementColor(result.improvement)}`}>
                {result.improvement > 0 ? '+' : ''}{result.improvement}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {result.improvement > 0 ? 'Better flow' : result.improvement < 0 ? 'May need manual tweaks' : 'No change'}
              </p>
            </div>
          </div>

          {/* Info */}
          {result.improvement <= 0 && (
            <p className="text-sm text-yellow-500 bg-yellow-500/10 rounded-lg p-3">
              ⚠️ The algorithm couldn't improve the flow significantly. Your playlist may already be well-optimized, or manual adjustments might work better.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onApply} className="bg-spotify hover:bg-spotify/90">
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OptimizePreviewModal;
