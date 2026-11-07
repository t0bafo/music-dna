import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Download, Loader2, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptics } from '@/hooks/use-haptics';
import { useToast } from '@/hooks/use-toast';
import { Archetype } from '@/lib/music-archetypes';
import { cn } from '@/lib/utils';
import ShareCard, { SHARE_FORMATS, ShareCardTrack, ShareFormat } from './ShareCard';

interface ShareIdentityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archetype: Archetype | null;
  topTracks: ShareCardTrack[];
}

export const buildCaption = (title: string | null | undefined, tracks: ShareCardTrack[]) => {
  const pretty = title?.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const headline = pretty ? `My Music DNA: ${pretty}` : 'My Music DNA';
  const list = tracks.slice(0, 3).map((t, i) => `${i + 1}. ${t.name} by ${t.artist}`).join('\n');
  return [headline, list && `Tracks that define me:\n${list}`, 'Find yours at musicdna.tobiafo.com']
    .filter(Boolean)
    .join('\n\n');
};

const FORMAT_ORDER: ShareFormat[] = ['story', 'square', 'wide'];

const canShareFiles = () => {
  try {
    const probe = new File([new Blob(['x'], { type: 'image/png' })], 'probe.png', { type: 'image/png' });
    return !!navigator.canShare?.({ files: [probe] });
  } catch {
    return false;
  }
};

const ShareBody = ({ archetype, topTracks }: Omit<ShareIdentityModalProps, 'open' | 'onOpenChange'>) => {
  const { toast } = useToast();
  const { lightTap, success } = useHaptics();
  const [format, setFormat] = useState<ShareFormat>('story');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [rendering, setRendering] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(300);
  const [shareSupported] = useState(canShareFiles);
  const exportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const title = archetype?.name ?? null;
  const caption = buildCaption(title, topTracks);
  const { width, height } = SHARE_FORMATS[format];
  const filename = `music-dna-${format}.png`;

  // Fit preview into available width and ~half the viewport height.
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setPreviewWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const maxH = typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.52, 560) : 480;
  const scale = Math.min(previewWidth / width, maxH / height);

  // Pre-render the image so Share keeps the tap's user activation (iOS).
  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    setBlob(null);
    const run = async () => {
      await document.fonts?.ready;
      if (!exportRef.current || cancelled) return;
      try {
        const canvas = await html2canvas(exportRef.current, {
          backgroundColor: null, scale: 1, width, height, logging: false, useCORS: true,
        });
        canvas.toBlob((b) => { if (!cancelled) { setBlob(b); setRendering(false); } }, 'image/png');
      } catch {
        if (!cancelled) {
          setRendering(false);
          toast({ title: "Couldn't create the image", description: 'Try again in a moment.', variant: 'destructive' });
        }
      }
    };
    const t = setTimeout(run, 50);
    return () => { cancelled = true; clearTimeout(t); };
  }, [format, width, height, title, topTracks, toast]);

  const download = useCallback(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    success();
    toast({ title: 'Image saved' });
  }, [blob, filename, success, toast]);

  const handlePrimary = useCallback(async () => {
    if (!blob) return;
    lightTap();
    if (shareSupported) {
      const file = new File([blob], filename, { type: 'image/png' });
      try {
        await navigator.share({ files: [file], text: caption });
        success();
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }
    download();
  }, [blob, caption, download, filename, lightTap, shareSupported, success]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      success();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: 'Long-press the caption to copy it instead.', variant: 'destructive' });
    }
  }, [caption, success, toast]);

  return (
    <div className="flex flex-col gap-4">
      {/* Live preview: same component as the export, scaled */}
      <div ref={frameRef} className="w-full flex justify-center">
        <div
          className="relative overflow-hidden rounded-lg shadow-lg ring-1 ring-border/40"
          style={{ width: width * scale, height: height * scale }}
          aria-label={`${SHARE_FORMATS[format].label} preview`}
          role="img"
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <ShareCard format={format} title={title} tracks={topTracks} />
          </div>
        </div>
      </div>

      {/* Format selector */}
      <div role="radiogroup" aria-label="Image format" className="mx-auto inline-flex rounded-full bg-secondary p-1">
        {FORMAT_ORDER.map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={format === f}
            onClick={() => { lightTap(); setFormat(f); }}
            className={cn(
              'px-4 py-1.5 text-sm rounded-full transition-colors',
              format === f ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {SHARE_FORMATS[f].label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full gap-2" onClick={handlePrimary} disabled={!blob}>
          {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : shareSupported ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {rendering ? 'Preparing image…' : shareSupported ? 'Share image' : 'Download image'}
        </Button>
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy caption'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            aria-expanded={showCaption}
            onClick={() => setShowCaption((s) => !s)}
          >
            {showCaption ? 'Hide' : 'Show'} caption
            <ChevronDown className={cn('w-4 h-4 transition-transform', showCaption && 'rotate-180')} />
          </Button>
        </div>
        {showCaption && (
          <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground font-sans">
            {caption}
          </pre>
        )}
      </div>

      {/* Full-size offscreen copy that gets rasterized */}
      <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
        <ShareCard ref={exportRef} format={format} title={title} tracks={topTracks} />
      </div>
    </div>
  );
};

const ShareIdentityModal = ({ open, onOpenChange, archetype, topTracks }: ShareIdentityModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96dvh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-display text-lg">Share your Music DNA</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            {open && <ShareBody archetype={archetype} topTracks={topTracks} />}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Share your Music DNA</DialogTitle>
        </DialogHeader>
        {open && <ShareBody archetype={archetype} topTracks={topTracks} />}
      </DialogContent>
    </Dialog>
  );
};

export default ShareIdentityModal;
