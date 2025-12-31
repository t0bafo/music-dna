import { useState } from 'react';
import { Copy, Image, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Archetype } from '@/lib/music-archetypes';

interface ShareIdentityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archetype: Archetype | null;
  undergroundIndex: number;
  avgBpm: number;
  avgEnergy: number;
  topTracks: { name: string; artist: string }[];
}

const ShareIdentityModal = ({
  open,
  onOpenChange,
  archetype,
  undergroundIndex,
  avgBpm,
  avgEnergy,
  topTracks,
}: ShareIdentityModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!archetype) return null;

  const generateShareText = () => {
    const trackList = topTracks
      .slice(0, 3)
      .map((t, i) => `${i + 1}. ${t.name} - ${t.artist}`)
      .join('\n');

    return `${archetype.emoji} I'm a ${archetype.name}
${archetype.traits.join(' • ')} • ${undergroundIndex}% Underground

My top tracks that define me:
${trackList}

💎 Underground Index: ${undergroundIndex}/100
🎵 Avg BPM: ${avgBpm} | Energy: ${avgEnergy}%

Discover your music identity at musicdna.app`;
  };

  const handleCopy = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "Share your music identity with friends",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const sharePreview = generateShareText();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Share Your Music Identity
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              className="flex-1 gap-2"
              variant={copied ? "default" : "outline"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Text Summary
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 opacity-60 cursor-not-allowed"
              disabled
            >
              <Image className="w-4 h-4" />
              Export Image
              <span className="text-xs ml-1">(Soon)</span>
            </Button>
          </div>
          
          {/* Preview */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {sharePreview}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareIdentityModal;
