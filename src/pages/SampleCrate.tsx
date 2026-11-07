import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import { interpret, searchByMemory } from '@/lib/memory-search';
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
  const [mode, setMode] = useState<'literal' | 'memory'>('literal');
  const [removed, setRemoved] = useState<string[]>([]);
  const results = useMemo(() => searchSampleTracks(SAMPLE_CRATE.tracks, query), [query]);
  const terms = useMemo(() => interpret(query).filter((t) => !removed.includes(t.term)), [query, removed]);
  const memoryResults = useMemo(() => searchByMemory(SAMPLE_CRATE, terms), [terms]);
  const isMemory = mode === 'memory' && query.trim().length > 0;

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
        <p className="mt-3 text-muted-foreground italic">“{SAMPLE_CRATE.note}”</p>

        <div className="relative mt-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setRemoved([]); }}
            placeholder={mode === 'memory' ? 'Describe a moment, e.g. “late night drive”' : 'Search tracks in this crate'}
            aria-label="Search tracks in this crate"
            className="pl-9 h-11"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Search mode">
          {([['literal', 'Title & artist'], ['memory', 'By memory · prototype']] as const).map(([m, l]) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
              className={`min-h-9 rounded-full border px-3 text-sm ${mode === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {l}
            </button>
          ))}
        </div>

        {isMemory ? (
          <div className="mt-4">
            {terms.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-label="How we read your search">
                <span className="label-meta text-muted-foreground">Reading as</span>
                {terms.map((t) => (
                  <button key={t.term} type="button" onClick={() => setRemoved((r) => [...r, t.term])}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-sm"
                    aria-label={`Remove ${t.term}`}>
                    {t.label} <X className="h-3 w-3" aria-hidden />
                  </button>
                ))}
              </div>
            )}
            {memoryResults.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground" role="status">
                Nothing in this crate’s notes mentions that. Try other words, or search by title or artist.
              </p>
            ) : (
              <ol className="mt-4 divide-y divide-border rounded-md border border-border bg-card">
                {memoryResults.map(({ track, evidence }) => (
                  <li key={track.id} className="px-4 py-3">
                    <div className="font-medium">{track.title} <span className="font-normal text-muted-foreground">· {track.artist}</span></div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="label-meta mr-2">Matched {evidence[0].field}</span>
                      <span className="italic">“{evidence[0].snippet}”</span>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : results.length === 0 ? (
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
