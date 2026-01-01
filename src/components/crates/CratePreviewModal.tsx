import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw, Sparkles, Loader2, Music } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GeneratedCrate, saveGeneratedCrate } from '@/lib/ai-curation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CratePreviewModalProps {
  crate: GeneratedCrate;
  onClose: () => void;
  onRegenerate: () => void;
  onSaveComplete: () => void;
}

export function CratePreviewModal({ 
  crate, 
  onClose, 
  onRegenerate, 
  onSaveComplete 
}: CratePreviewModalProps) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!accessToken) {
      toast.error('Not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      const savedCrate = await saveGeneratedCrate(crate, accessToken);
      
      // Invalidate crates query to refresh list
      queryClient.invalidateQueries({ queryKey: ['crates'] });
      
      toast.success(`"${crate.name}" created with ${crate.totalTracks} tracks!`, {
        icon: '✨',
      });
      
      onSaveComplete();
      
      // Navigate to the new crate
      navigate(`/crates/${savedCrate.id}`);
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.message || 'Failed to save crate');
    } finally {
      setIsSaving(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 9) return '🔥 Exceptional';
    if (score >= 8) return 'Great';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Decent';
    return 'Needs work';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ 
                  backgroundColor: 'hsla(var(--primary) / 0.1)',
                  border: '1px solid hsla(var(--primary) / 0.2)'
                }}
              >
                {crate.emoji || '🎵'}
              </div>
              <div>
                <div className="font-display text-lg">{crate.name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>AI Generated</span>
                  <span>•</span>
                  <span>{crate.totalTracks} tracks</span>
                  <span>•</span>
                  <span>{crate.estimatedDuration}</span>
                </div>
              </div>
            </div>

            {/* Quality Score */}
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Quality</div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${getQualityColor(crate.quality.total)}`}>
                  {crate.quality.total.toFixed(1)}
                </span>
                <span className="text-muted-foreground">/10</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {getQualityLabel(crate.quality.total)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Sections */}
        <ScrollArea className="max-h-[50vh] px-6">
          <div className="space-y-4 py-4">
            {crate.sections.map((section, sectionIdx) => (
              <motion.div
                key={sectionIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIdx * 0.1 }}
                className="rounded-lg border border-border/50 bg-secondary/20 overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-4 py-3 border-b border-border/30 bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{section.emoji}</span>
                    <span className="font-medium">{section.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({section.tracks.length} tracks)
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {section.description}
                  </div>
                </div>

                {/* Track List */}
                <div className="divide-y divide-border/30">
                  {section.tracks.map((track, trackIdx) => (
                    <div 
                      key={track.track_id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="w-6 h-6 rounded bg-secondary/50 flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        {trackIdx + 1}
                      </div>
                      <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center shrink-0">
                        <Music className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {track.track_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {track.artist_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                        {track.source && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            track.source === 'library' ? 'bg-green-500/20 text-green-600' :
                            track.source === 'liked' ? 'bg-blue-500/20 text-blue-600' :
                            track.source === 'recommendation' ? 'bg-purple-500/20 text-purple-600' :
                            'bg-orange-500/20 text-orange-600'
                          }`}>
                            {track.source === 'library' ? '📚' : 
                             track.source === 'liked' ? '❤️' : 
                             track.source === 'recommendation' ? '✨' : '🔍'}
                          </span>
                        )}
                        {track.bpm && (
                          <span>{Math.round(track.bpm)} BPM</span>
                        )}
                        {track.energy != null && (
                          <span>{Math.round(track.energy * 100)}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Quality Breakdown */}
        <div className="px-6 py-4 bg-secondary/20 border-t border-border/50">
          <div className="text-sm font-medium mb-3">Quality Analysis</div>
          <div className="grid grid-cols-4 gap-3">
            <QualityItem 
              label="Flow" 
              score={crate.quality.flow} 
              maxScore={3} 
            />
            <QualityItem 
              label="Balance" 
              score={crate.quality.balance} 
              maxScore={3} 
            />
            <QualityItem 
              label="Underground" 
              score={crate.quality.underground} 
              maxScore={2} 
            />
            <QualityItem 
              label="Length" 
              score={crate.quality.length} 
              maxScore={2} 
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 pt-4 border-t border-border/50">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onRegenerate}
              disabled={isSaving}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>

            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Crate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QualityItem({ 
  label, 
  score, 
  maxScore 
}: { 
  label: string; 
  score: number; 
  maxScore: number;
}) {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score.toFixed(1)}/{maxScore}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
