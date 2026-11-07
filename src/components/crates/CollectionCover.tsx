import { Disc3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CollectionCover({ name, artwork, className }: { name: string; artwork?: string; className?: string }) {
  return <div className={cn('sleeve-ink relative aspect-square shrink-0 overflow-hidden rounded-md', className)}>
    {artwork ? <img src={artwork} alt="" className="w-full h-full object-cover" loading="lazy" /> : <>
      <div aria-hidden className="sleeve-groove" />
      <Disc3 aria-hidden className="absolute right-2 top-2 w-5 h-5 sleeve-accent" />
      <span className="absolute bottom-2 left-2 right-2 font-display text-xs leading-tight line-clamp-2 break-words">{name}</span>
    </>}
  </div>;
}