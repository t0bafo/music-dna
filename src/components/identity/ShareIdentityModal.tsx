import { useState, useCallback } from 'react';
import { Copy, Check, Download, Loader2, Smartphone, Square, Twitter, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Archetype } from '@/lib/music-archetypes';
import { useHaptics } from '@/hooks/use-haptics';
import { useNativeShare } from '@/hooks/use-native-share';
import { isNativePlatform } from '@/lib/platform';
import html2canvas from 'html2canvas';

interface ShareIdentityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archetype: Archetype | null;
  undergroundIndex: number;
  avgBpm: number;
  avgEnergy: number;
  undergroundGemsCount: number;
  topTracks: { name: string; artist: string }[];
}

type ExportFormat = 'story' | 'feed' | 'twitter';

const formatDimensions: Record<ExportFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: 'Instagram Story' },
  feed: { width: 1080, height: 1080, label: 'Instagram Feed' },
  twitter: { width: 1200, height: 675, label: 'Twitter Post' },
};

// Dynamic gradient backgrounds based on archetype
const archetypeGradients: Record<string, string> = {
  'MIDNIGHT CURATOR': 'linear-gradient(135deg, #581c87, #312e81, #1e3a8a)',
  'ENERGY ARCHITECT': 'linear-gradient(135deg, #ea580c, #dc2626, #db2777)',
  'VIBES ENGINEER': 'linear-gradient(135deg, #ec4899, #a855f7, #6366f1)',
  'UNDERGROUND EXPLORER': 'linear-gradient(135deg, #115e59, #166534, #064e3b)',
  'PEAK COMMANDER': 'linear-gradient(135deg, #ca8a04, #ea580c, #dc2626)',
  'BALANCED CURATOR': 'linear-gradient(135deg, #2563eb, #0891b2, #0d9488)',
};

const getUndergroundGradient = (index: number) => {
  if (index <= 30) return 'linear-gradient(to right, #facc15, #eab308)';
  if (index <= 60) return 'linear-gradient(to right, #fb923c, #f97316)';
  if (index <= 80) return 'linear-gradient(to right, #f87171, #ef4444)';
  return 'linear-gradient(to right, #c084fc, #ec4899)';
};

const getUndergroundLabel = (index: number) => {
  if (index <= 30) return 'Mainstream listener';
  if (index <= 60) return 'Balanced explorer';
  if (index <= 80) return 'Underground digger';
  return 'True tastemaker';
};

const ShareIdentityModal = ({
  open,
  onOpenChange,
  archetype,
  undergroundIndex,
  avgBpm,
  avgEnergy,
  undergroundGemsCount,
  topTracks,
}: ShareIdentityModalProps) => {
  const { toast } = useToast();
  const { lightTap, success, mediumTap } = useHaptics();
  const { shareIdentity } = useNativeShare();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const isNative = isNativePlatform();

  const generateShareText = useCallback(() => {
    if (!archetype) return '';
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

Discover your music identity at musicdna.tobiafo.com`;
  }, [archetype, topTracks, undergroundIndex, avgBpm, avgEnergy]);

  const handleCopy = useCallback(async () => {
    const text = generateShareText();
    lightTap();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      success();
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
  }, [generateShareText, toast, lightTap, success]);

  const handleNativeShare = useCallback(async () => {
    const text = generateShareText();
    mediumTap();
    const result = await shareIdentity(text);
    if (result) {
      success();
      toast({
        title: "Shared successfully!",
        description: "Your music identity has been shared",
      });
    }
  }, [generateShareText, shareIdentity, mediumTap, success, toast]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!archetype) return;
    
    lightTap();
    setExporting(format);
    toast({
      title: "Creating your shareable image...",
      description: "This may take a moment",
    });

    try {
      const { width, height } = formatDimensions[format];
      const gradient = archetypeGradients[archetype.name] || archetypeGradients['BALANCED CURATOR'];

      // Create the export element dynamically
      const exportEl = document.createElement('div');
      exportEl.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        background: ${gradient};
        padding: ${format === 'story' ? '80px 60px' : format === 'twitter' ? '40px 60px' : '60px'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
        position: absolute;
        left: -9999px;
        top: 0;
      `;

      // Inner glass card
      const innerCard = document.createElement('div');
      innerCard.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        padding: ${format === 'story' ? '60px 40px' : format === 'twitter' ? '32px 48px' : '48px'};
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
      `;

      // Archetype section
      const archetypeSection = document.createElement('div');
      archetypeSection.style.cssText = 'text-align: center;';
      archetypeSection.innerHTML = `
        <div style="font-size: ${format === 'story' ? '100px' : format === 'twitter' ? '60px' : '80px'}; margin-bottom: 16px;">${archetype.emoji}</div>
        <div style="font-size: ${format === 'story' ? '56px' : format === 'twitter' ? '36px' : '48px'}; font-weight: 800; text-transform: uppercase; letter-spacing: -1px; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.3); margin-bottom: 12px;">${archetype.name}</div>
        <div style="font-size: ${format === 'story' ? '24px' : format === 'twitter' ? '16px' : '20px'}; color: rgba(255,255,255,0.9); line-height: 1.5;">${archetype.traits.join(' • ')}</div>
      `;

      // Underground index section
      const undergroundSection = document.createElement('div');
      undergroundSection.style.cssText = 'text-align: center; width: 100%; max-width: 600px;';
      undergroundSection.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px;">
          <span style="font-size: ${format === 'story' ? '36px' : '24px'};">🔥</span>
          <span style="font-size: ${format === 'story' ? '28px' : format === 'twitter' ? '18px' : '24px'}; color: rgba(255,255,255,0.9); font-weight: 500;">Underground Index:</span>
          <span style="font-size: ${format === 'story' ? '48px' : format === 'twitter' ? '32px' : '40px'}; font-weight: 700; background: ${getUndergroundGradient(undergroundIndex)}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${undergroundIndex}/100</span>
        </div>
        <div style="width: 100%; height: ${format === 'story' ? '16px' : '12px'}; background: rgba(255,255,255,0.1); border-radius: 9999px; overflow: hidden; margin-bottom: 12px;">
          <div style="width: ${undergroundIndex}%; height: 100%; background: ${getUndergroundGradient(undergroundIndex)}; border-radius: 9999px;"></div>
        </div>
        <div style="font-size: ${format === 'story' ? '22px' : format === 'twitter' ? '14px' : '18px'}; color: rgba(255,255,255,0.8);">${getUndergroundLabel(undergroundIndex)}</div>
      `;

      // Stats section
      const statsSection = document.createElement('div');
      statsSection.style.cssText = 'display: flex; gap: 40px; justify-content: center; flex-wrap: wrap;';
      statsSection.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: ${format === 'story' ? '32px' : '24px'};">🎵 <span style="font-size: ${format === 'story' ? '40px' : format === 'twitter' ? '28px' : '36px'}; font-weight: 700; color: white;">${avgBpm}</span></div>
          <div style="font-size: ${format === 'story' ? '18px' : '14px'}; color: rgba(255,255,255,0.8);">Average BPM</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: ${format === 'story' ? '32px' : '24px'};">⚡ <span style="font-size: ${format === 'story' ? '40px' : format === 'twitter' ? '28px' : '36px'}; font-weight: 700; color: white;">${avgEnergy}%</span></div>
          <div style="font-size: ${format === 'story' ? '18px' : '14px'}; color: rgba(255,255,255,0.8);">Energy Level</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: ${format === 'story' ? '32px' : '24px'};">💎 <span style="font-size: ${format === 'story' ? '40px' : format === 'twitter' ? '28px' : '36px'}; font-weight: 700; color: white;">${undergroundGemsCount}</span></div>
          <div style="font-size: ${format === 'story' ? '18px' : '14px'}; color: rgba(255,255,255,0.8);">Underground Gems</div>
        </div>
      `;

      // Top tracks section
      const tracksSection = document.createElement('div');
      tracksSection.style.cssText = 'text-align: center; width: 100%; max-width: 600px;';
      const tracksList = topTracks.slice(0, 3).map((t, i) => 
        `<div style="font-size: ${format === 'story' ? '22px' : format === 'twitter' ? '16px' : '18px'}; color: white; margin-bottom: 8px; text-align: left;"><span style="font-weight: 700;">${i + 1}.</span> ${t.name} <span style="color: rgba(255,255,255,0.8);">- ${t.artist}</span></div>`
      ).join('');
      tracksSection.innerHTML = `
        <div style="font-size: ${format === 'story' ? '24px' : format === 'twitter' ? '18px' : '20px'}; color: rgba(255,255,255,0.9); font-weight: 600; margin-bottom: 16px;">Top Tracks That Define You:</div>
        ${tracksList}
      `;

      // Footer
      const footer = document.createElement('div');
      footer.style.cssText = 'text-align: center;';
      footer.innerHTML = `
        <div style="font-size: ${format === 'story' ? '18px' : '14px'}; color: rgba(255,255,255,0.7); margin-bottom: 4px;">Discover your music identity at</div>
        <div style="font-size: ${format === 'story' ? '24px' : format === 'twitter' ? '18px' : '20px'}; color: white; font-weight: 700;">musicdna.app</div>
      `;

      // Build card content
      innerCard.appendChild(archetypeSection);
      
      // Add dividers
      const createDivider = () => {
        const divider = document.createElement('div');
        divider.style.cssText = 'width: 100%; height: 1px; background: rgba(255,255,255,0.2);';
        return divider;
      };

      innerCard.appendChild(createDivider());
      innerCard.appendChild(undergroundSection);
      innerCard.appendChild(createDivider());
      innerCard.appendChild(statsSection);
      
      if (topTracks.length > 0) {
        innerCard.appendChild(createDivider());
        innerCard.appendChild(tracksSection);
      }
      
      innerCard.appendChild(createDivider());
      innerCard.appendChild(footer);

      exportEl.appendChild(innerCard);
      document.body.appendChild(exportEl);

      // Generate canvas
      const canvas = await html2canvas(exportEl, {
        backgroundColor: null,
        scale: 2,
        width,
        height,
        logging: false,
        useCORS: true,
      });

      // Clean up
      document.body.removeChild(exportEl);

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `music-identity-${format}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);

          success();
          toast({
            title: `Downloaded ${formatDimensions[format].label} image!`,
            description: "Share it on social media",
          });
        }
      }, 'image/png');
    } catch (err) {
      console.error('Export failed:', err);
      toast({
        title: "Couldn't generate image",
        description: "Try again or screenshot instead!",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  }, [archetype, undergroundIndex, avgBpm, avgEnergy, undergroundGemsCount, topTracks, toast, lightTap, success]);

  // Conditional return AFTER all hooks
  if (!archetype) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Share Your Music Identity
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          {/* Native Share Button (shown on mobile apps) */}
          {isNative && (
            <Button 
              onClick={handleNativeShare} 
              className="w-full gap-2"
              size="lg"
            >
              <Share2 className="w-5 h-5" />
              Share via...
            </Button>
          )}

          <p className="text-muted-foreground text-sm">
            {isNative ? 'Or download an image:' : 'Choose format:'}
          </p>

          {/* Format Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Instagram Story */}
            <button
              onClick={() => handleExport('story')}
              disabled={!!exporting}
              className="group p-5 rounded-xl border border-border hover:border-primary transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="w-6 h-6 text-pink-500" />
                <span className="font-semibold">Instagram Story</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">1080 × 1920</p>
              <Button 
                size="sm" 
                className="w-full gap-2"
                disabled={!!exporting}
              >
                {exporting === 'story' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting === 'story' ? 'Generating...' : 'Download'}
              </Button>
            </button>

            {/* Instagram Feed */}
            <button
              onClick={() => handleExport('feed')}
              disabled={!!exporting}
              className="group p-5 rounded-xl border border-border hover:border-primary transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <Square className="w-6 h-6 text-purple-500" />
                <span className="font-semibold">Instagram Feed</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">1080 × 1080</p>
              <Button 
                size="sm" 
                className="w-full gap-2"
                disabled={!!exporting}
              >
                {exporting === 'feed' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting === 'feed' ? 'Generating...' : 'Download'}
              </Button>
            </button>

            {/* Twitter */}
            <button
              onClick={() => handleExport('twitter')}
              disabled={!!exporting}
              className="group p-5 rounded-xl border border-border hover:border-primary transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <Twitter className="w-6 h-6 text-sky-500" />
                <span className="font-semibold">Twitter Post</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">1200 × 675</p>
              <Button 
                size="sm" 
                className="w-full gap-2"
                disabled={!!exporting}
              >
                {exporting === 'twitter' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting === 'twitter' ? 'Generating...' : 'Download'}
              </Button>
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopy}
              className="group p-5 rounded-xl border border-border hover:border-primary transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <Copy className="w-6 h-6 text-green-500" />
                <span className="font-semibold">Copy Text</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Summary</p>
              <Button 
                size="sm" 
                variant={copied ? 'default' : 'outline'}
                className="w-full gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </button>
          </div>

          {/* Preview */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Text Preview:</p>
            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 max-h-40 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {generateShareText()}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareIdentityModal;
