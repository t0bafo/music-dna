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
import { Sparkles, ArrowRight, TrendingUp, Music, Zap, CheckCircle } from 'lucide-react';

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

  const jumpsReduced = result.bpmJumpsReduced.before - result.bpmJumpsReduced.after;
  const percentReduction = result.bpmJumpsReduced.before > 0 
    ? Math.round((jumpsReduced / result.bpmJumpsReduced.before) * 100)
    : 0;
  
  const bpmImproved = jumpsReduced > 0;
  const flowScoreAvailable = result.originalScore > 0 || result.newScore > 0;
  const hasEnergyData = result.dataAvailability?.tracksWithEnergy >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-spotify" />
            Optimization Preview
          </DialogTitle>
          <DialogDescription>
            {bpmImproved 
              ? "Your playlist's BPM flow will improve with the new track order."
              : "Here's how the optimization will affect your playlist."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* BPM Transitions - Primary Metric */}
          <div className={`rounded-lg p-4 ${bpmImproved ? 'bg-green-500/10 border border-green-500/30' : 'bg-accent/50'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-5 h-5 text-spotify" />
              <p className="text-sm font-medium text-foreground">BPM Transitions</p>
              {bpmImproved && (
                <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-500 rounded-full">
                  {percentReduction}% smoother
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{result.bpmJumpsReduced.before}</p>
                <p className="text-xs text-muted-foreground">jumps before</p>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
              <div className="text-center">
                <p className={`text-3xl font-bold ${bpmImproved ? 'text-green-500' : 'text-foreground'}`}>
                  {result.bpmJumpsReduced.after}
                </p>
                <p className="text-xs text-muted-foreground">jumps after</p>
              </div>
            </div>
            {bpmImproved && (
              <p className="text-center text-sm text-green-500 mt-3">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                {jumpsReduced} large BPM jump{jumpsReduced !== 1 ? 's' : ''} fixed
              </p>
            )}
          </div>

          {/* Flow Score - Secondary Metric */}
          {flowScoreAvailable ? (
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-spotify" />
                <p className="text-sm font-medium text-foreground">Flow Score</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{result.originalScore}</p>
                  <p className="text-xs text-muted-foreground">Before</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                <div className="text-center">
                  <p className={`text-2xl font-bold ${result.improvement > 0 ? 'text-green-500' : 'text-foreground'}`}>
                    {result.newScore}
                  </p>
                  <p className="text-xs text-muted-foreground">After</p>
                </div>
                {result.improvement !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${result.improvement > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <TrendingUp className="w-4 h-4" />
                    {result.improvement > 0 ? '+' : ''}{result.improvement}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Flow Score</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {hasEnergyData 
                  ? "Could not calculate flow score for this playlist."
                  : "Requires energy data (not available for this playlist)."
                }
              </p>
              {result.dataAvailability && (
                <p className="text-xs text-muted-foreground mt-2">
                  Audio data: {result.dataAvailability.tracksWithTempo} tracks with BPM, {result.dataAvailability.tracksWithEnergy} with energy
                </p>
              )}
            </div>
          )}

          {/* Success message */}
          {bpmImproved && !flowScoreAvailable && (
            <p className="text-sm text-green-500 bg-green-500/10 rounded-lg p-3">
              ✨ Your playlist's BPM transitions improved significantly! Tracks will now flow more smoothly.
            </p>
          )}

          {/* Warning if no improvement */}
          {!bpmImproved && result.improvement <= 0 && (
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
