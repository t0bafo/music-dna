import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Wand2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateCrateWithAI, GeneratedCrate } from '@/lib/ai-curation';
import { motion, AnimatePresence } from 'framer-motion';
import { CratePreviewModal } from './CratePreviewModal';

interface AICurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXAMPLE_PROMPTS = [
  "Late night drive through Lagos, smooth Afrobeats and R&B",
  "High energy workout playlist, 140+ BPM, no slow songs",
  "Sunday morning cooking vibes, warm and uplifting",
  "Deep underground Amapiano, focus on new artists",
  "Party progression - start chill, build to bangers",
];

export function AICurationModal({ open, onOpenChange }: AICurationModalProps) {
  const { accessToken } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCrate, setGeneratedCrate] = useState<GeneratedCrate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe what kind of crate you want');
      return;
    }

    if (!accessToken) {
      setError('Not authenticated. Please refresh the page.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateCrateWithAI(prompt.trim(), accessToken);
      setGeneratedCrate(result);
    } catch (err: any) {
      console.error('AI generation failed:', err);
      setError(err.message || 'Failed to generate crate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedCrate(null);
    handleGenerate();
  };

  const handleClose = () => {
    setPrompt('');
    setError(null);
    setGeneratedCrate(null);
    onOpenChange(false);
  };

  const handleSaveComplete = () => {
    handleClose();
  };

  if (generatedCrate) {
    return (
      <CratePreviewModal
        crate={generatedCrate}
        onClose={handleClose}
        onRegenerate={handleRegenerate}
        onSaveComplete={handleSaveComplete}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-lg">Build Crate with AI</div>
              <div className="text-sm text-muted-foreground font-normal">
                Describe the vibe, we'll build the perfect crate
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              What kind of crate do you want?
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError(null);
              }}
              placeholder="e.g., 'Late night drive through Lagos, smooth Afrobeats and R&B, starts mellow and builds energy'"
              className="min-h-[100px] bg-secondary/30 border-border/50 focus:border-purple-500/50 resize-none"
              disabled={isGenerating}
            />
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Or try these examples:
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-xs rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50 text-left"
                >
                  {example.length > 40 ? `${example.slice(0, 40)}...` : example}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                      <div className="absolute inset-0 animate-ping">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20" />
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Building your crate...</div>
                      <div className="text-sm text-muted-foreground">
                        Analyzing vibe and selecting tracks 🎵
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>

            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Crate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AICurationModal;
