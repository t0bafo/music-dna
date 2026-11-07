import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToLanding } from '@/lib/return-to';
import { useCrates } from '@/hooks/use-crates';
import { useAllCratesWithTracks } from '@/hooks/use-crates-search';
import { readLibraryState, recentCrates, searchLibrary } from '@/lib/library';
import { Library, Plus, Search, List, LayoutGrid, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserProfile from '@/components/UserProfile';
import BottomNav from '@/components/BottomNav';
import LibraryNav from '@/components/LibraryNav';
import LibraryCollections from '@/components/crates/LibraryCollections';
import CreateCrateModal from '@/components/crates/CreateCrateModal';
import AICurationModal from '@/components/crates/AICurationModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePageTitle } from '@/hooks/use-page-title';

export default function Crates() {
  usePageTitle('Library — Music DNA');
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const key = `music-dna-library:${user?.id ?? 'guest'}`;
  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [recent, setRecent] = useState<string[]>([]);
  const [hydratedKey, setHydratedKey] = useState('');
  const restored = useRef(false);
  const restoreScroll = useRef(0);
  const { data: crates = [], isLoading, isError, refetch } = useCrates();
  const { data: fullCrates = [], isLoading: searchLoading, isError: searchError, refetch: retrySearch } = useAllCratesWithTracks();
  const matches = useMemo(() => searchLibrary(query, fullCrates), [query, fullCrates]);
  const opened = recentCrates(recent, crates);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) redirectToLanding(navigate);
  }, [authLoading, isAuthenticated, navigate]);
  useEffect(() => {
    if (!user) return;
    const state = readLibraryState(key);
    restoreScroll.current = state.scroll;
    setQuery(state.query); setView(state.view); setRecent(state.recent);
    setHydratedKey(key);
    restored.current = false;
  }, [key, user]);
  useEffect(() => {
    if (!user || isLoading || restored.current) return;
    const frame = requestAnimationFrame(() => window.scrollTo(0, restoreScroll.current));
    restored.current = true;
    return () => cancelAnimationFrame(frame);
  }, [isLoading, key, user]);
  useEffect(() => {
    if (!user || hydratedKey !== key) return;
    const save = () => {
      try { sessionStorage.setItem(key, JSON.stringify({ ...readLibraryState(key), query, view, scroll: window.scrollY })); } catch { /* Optional history. */ }
    };
    window.addEventListener('scroll', save, { passive: true });
    save();
    return () => { window.removeEventListener('scroll', save); };
  }, [query, view, key, user, hydratedKey]);
  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 aria-label="Loading Library" className="w-6 h-6 animate-spin text-primary" /></div>;
  return <div className="min-h-screen bg-background pb-28 lg:pb-8">
    <header className="bg-background border-b border-border sticky top-0 z-40 safe-top">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-3">
        <div className="flex items-center gap-6"><Link to="/crates" className="font-display text-lg">Music DNA</Link><LibraryNav /></div>
        <div className="flex gap-2"><ThemeToggle /><UserProfile /></div>
      </div>
    </header>
    <main className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-display text-3xl sm:text-4xl mb-5">Library</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1"><Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <Input aria-label="Search your music" placeholder="Search your music" className="pl-10 pr-11 h-11" value={query} onChange={e => setQuery(e.target.value)} />
          {query && <Button size="icon" variant="ghost" aria-label="Clear search" className="absolute right-0 top-0 h-11 w-11" onClick={() => setQuery('')}><X className="w-4 h-4" /></Button>}
        </div>
        <Button className="h-11 gap-2" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />New crate</Button>
      </div>
      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary" aria-label="Loading crates" /> : isError ? <div role="alert"><p>Couldn't load your Library.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div> : query.trim() ? <div className="space-y-7">
        {searchLoading ? <Loader2 className="animate-spin w-5 h-5" aria-label="Searching saved music" /> : searchError ? <div role="alert"><p>Couldn't search saved music.</p><Button variant="outline" onClick={() => retrySearch()}>Try again</Button></div> : <>
          {matches.crates.length > 0 && <section><h2 className="label-meta text-muted-foreground mb-3">Crates</h2><LibraryCollections crates={matches.crates} fullCrates={fullCrates} /></section>}
          {matches.tracks.length > 0 && <section><h2 className="label-meta text-muted-foreground mb-3">Saved tracks</h2><div className="border-t border-border">
            {matches.tracks.map(({ track, crate }) => <Link key={`${crate.id}:${track.track_id}`} to={`/crates/${crate.id}?track=${encodeURIComponent(track.track_id)}`} className="block py-4 border-b border-border hover:text-primary break-words">
              <span className="font-medium">{track.name || 'Untitled track'} · {track.artist_name || 'Unknown artist'}</span><span className="text-muted-foreground"> — in {crate.name}</span>
            </Link>)}
          </div></section>}
          {!matches.crates.length && !matches.tracks.length && <div className="py-10 text-center"><Search className="w-7 h-7 text-muted-foreground mx-auto mb-3" /><h2 className="font-display text-xl">No matches in your Library</h2><p className="text-sm text-muted-foreground mt-2">Try another song, artist, or crate name.</p><Button variant="ghost" onClick={() => setQuery('')} className="mt-3">Clear search</Button></div>}
        </>}
      </div> : crates.length === 0 ? <div className="py-12 border-y border-border text-center"><Library className="w-8 h-8 text-primary mx-auto mb-4" /><h2 className="font-display text-2xl">Your collection starts here</h2><p className="text-muted-foreground mt-2">Start with a song you’d want to find again.</p><Button variant="outline" className="mt-5" onClick={() => setShowCreate(true)}>Start your first crate</Button></div> : <>
        {opened.length > 0 && <section className="mb-9"><h2 className="font-display text-xl mb-3">Recently opened</h2><LibraryCollections crates={opened} fullCrates={fullCrates} /></section>}
        <section><div className="flex justify-between items-center mb-3"><h2 className="font-display text-xl">Your crates <span className="font-sans text-sm text-muted-foreground">{crates.length}</span></h2>
          <div className="flex gap-1"><Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" aria-label="List view" title="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List className="w-4 h-4" /></Button><Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" aria-label="Sleeve grid" title="Sleeve grid" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid className="w-4 h-4" /></Button></div>
        </div><LibraryCollections crates={crates} fullCrates={fullCrates} view={view} /></section>
      </>}
      <div className="mt-8 border-t border-border pt-4 flex flex-wrap gap-3"><Button variant="ghost" size="sm" onClick={() => setShowAI(true)} className="gap-2"><Sparkles className="w-4 h-4" />Build with AI</Button><Button asChild variant="ghost" size="sm"><Link to="/studio">Studio</Link></Button></div>
    </main>
    <BottomNav /><CreateCrateModal open={showCreate} onOpenChange={setShowCreate} /><AICurationModal open={showAI} onOpenChange={setShowAI} />
  </div>;
}
