import type { ReactNode } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Archetype } from '@/lib/music-archetypes';

interface IdentitySleeveProps {
  archetype: Archetype | null;
  isLoading: boolean;
  onShare: () => void;
  children: ReactNode;
}

/** Compact record-sleeve identity card: title + description, then the tracks behind it. */
const IdentitySleeve = ({ archetype, isLoading, onShare, children }: IdentitySleeveProps) => (
  <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
    {/* subtle groove texture */}
    <div
      aria-hidden
      className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.07]"
      style={{
        background:
          'repeating-radial-gradient(circle, hsl(var(--foreground)) 0 1px, transparent 1px 6px)',
      }}
    />
    <div className="relative p-5 sm:p-6 border-b border-border">
      <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium">Your Music DNA</p>
      {isLoading || !archetype ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : (
        <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {archetype.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{archetype.description}</p>
          </div>
          <Button
            variant="outline"
            onClick={onShare}
            className="h-11 shrink-0 self-start sm:self-auto"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share my Music DNA
          </Button>
        </div>
      )}
    </div>
    <div className="relative p-3 sm:p-4">{children}</div>
  </section>
);

export default IdentitySleeve;
