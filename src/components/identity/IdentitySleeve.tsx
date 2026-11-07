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
  <section className="overflow-hidden rounded-md border border-border bg-card">
    <div className="sleeve-ink overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="sleeve-groove" />
      <p className="label-meta sleeve-muted">Liner notes · Your listening snapshot</p>
      {isLoading || !archetype ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : (
        <div className="mt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight">
              {archetype.name}
            </h2>
            <p className="mt-1 text-sm sleeve-muted">{archetype.description}</p>
          </div>
          <Button
            onClick={onShare}
            className="h-11 shrink-0 self-start sm:self-auto rounded-full bg-[hsl(var(--sleeve-accent))] text-[hsl(80_8%_8%)] hover:bg-[hsl(var(--sleeve-accent)/0.9)]"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share my Music DNA
          </Button>
        </div>
      )}
    </div>
    <div className="p-3 sm:p-4">{children}</div>
  </section>
);

export default IdentitySleeve;
