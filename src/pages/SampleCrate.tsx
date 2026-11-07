import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { SAMPLE_CRATE, searchSampleTracks } from '@/lib/sample-crate';
import { usePageTitle } from '@/hooks/use-page-title';

/** Read-only demo crate for signed-out visitors. Static data only — no playback, no saving. */
const SampleCrate = () => {
  usePageTitle(`${SAMPLE_CRATE.name} — Sample crate | Music DNA`);
  const { login } = useAuth();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchSampleTracks(SAMPLE_CRATE.tracks, query), [query]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto max-w-3xl px-5 py-4">
        <Button asChild variant="ghost" className="h-11 gap-2 -ml-3">
          <Link to="/"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </Button>
      </header>

      <main className="container mx-auto max-w-3xl px-5 pb-16">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Sample crate · example tracks</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold break-words">
          <span aria-hidden className="mr-2">{SAMPLE_CRATE.emoji}</span>{SAMPLE_CRATE.name}
        </h1>
        <p className="mt-3 text-muted-foreground">{SAMPLE_CRATE.note}</p>

        <div className="relative mt-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks in this crate"
            aria-label="Search tracks in this crate"
            className="pl-9 h-11"
          />
        </div>

        {results.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground" role="status">
            No tracks match “{query}”.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {results.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-5 text-sm text-muted-foreground tabular-nums">
                  {SAMPLE_CRATE.tracks.indexOf(t) + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{t.artist}</div>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-10 rounded-xl border border-border p-5">
          <p className="font-medium">Make your own crate</p>
          <p className="text-sm text-muted-foreground mt-1">Connect Spotify to search tracks and save them to crates of your own.</p>
          <Button className="mt-4 h-11" onClick={() => login()}>Connect Spotify</Button>
        </div>
      </main>
    </div>
  );
};

export default SampleCrate;
