import { Link } from 'react-router-dom';
import type { Crate, CrateWithTracks } from '@/lib/crates-api';
import CollectionCover from './CollectionCover';
import { cn } from '@/lib/utils';

export default function LibraryCollections({ crates, fullCrates, view = 'list' }: { crates: Crate[]; fullCrates: CrateWithTracks[]; view?: 'list' | 'grid' }) {
  return <div className={view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5' : 'border-t border-border'}>
    {crates.map(c => {
      const artwork = fullCrates.find(full => full.id === c.id)?.tracks.find(t => t.album_art_url)?.album_art_url;
      const type = c.description?.startsWith('Album mixtape') ? 'Album mix' : c.description?.startsWith('Imported from Spotify') ? 'Playlist import' : 'Crate';
      return <Link key={c.id} to={`/crates/${c.id}`} className={cn('group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        view === 'grid' ? 'space-y-2' : 'flex items-center gap-3 sm:gap-5 py-4 border-b border-border hover:bg-secondary/40')}>
        <CollectionCover name={c.name} artwork={artwork} className={view === 'grid' ? 'w-full' : 'w-14 sm:w-16'} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base sm:text-lg leading-snug break-words group-hover:text-primary">{c.name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{type} · {c.track_count} tracks</p>
          {view === 'list' && c.description && <p className="hidden sm:block text-sm text-muted-foreground italic mt-1 line-clamp-1">“{c.description}”</p>}
        </div>
      </Link>;
    })}
  </div>;
}