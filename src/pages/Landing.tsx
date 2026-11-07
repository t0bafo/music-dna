import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SAMPLE_CRATE } from '@/lib/sample-crate';
import { usePageTitle } from '@/hooks/use-page-title';

const SAMPLE_PATH = `/sample/${SAMPLE_CRATE.slug}`;

const Landing = () => {
  usePageTitle('Music DNA — Find the tracks you don’t want to lose');
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/crates', { replace: true });
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto max-w-5xl px-5 py-3 lg:py-5 flex items-center justify-between">
        <span className="font-display text-lg font-semibold">Music DNA</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" className="h-11" onClick={handleLogin} disabled={isLoggingIn}>
            Sign in
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-5">
        <section className="pt-4 pb-10 lg:pt-12 lg:pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-4 lg:gap-12 items-center">
          <div>
            <h1 className="font-display text-[2.4rem] sm:text-5xl lg:text-6xl font-medium leading-[1.02] tracking-tight">
              Find the tracks you don’t want to lose.
            </h1>
            <p className="mt-4 lg:mt-6 text-base lg:text-lg text-muted-foreground max-w-md">
              Keep the music and the memory together. Save tracks in searchable crates, then turn a crate into a Spotify playlist whenever you want.
            </p>
            <div className="mt-5 lg:mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-4 rounded-full grow sm:grow-0 text-sm">
                <Link to={SAMPLE_PATH}>Explore a sample crate</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-4 rounded-full grow sm:grow-0 text-sm border-2 border-foreground/70 bg-transparent text-foreground hover:bg-foreground/5"
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Connecting" /> : 'Connect Spotify'}
              </Button>
            </div>
          </div>

          <Link
            to={SAMPLE_PATH}
            className="sleeve-ink block overflow-hidden rounded-md p-5 sm:p-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`Open the sample crate ${SAMPLE_CRATE.name}`}
          >
            <div aria-hidden className="sleeve-groove" />
            <div className="label-meta sleeve-muted flex items-center justify-between">
              <span>Liner notes · Sample crate</span>
              <span>{SAMPLE_CRATE.tracks.length} tracks</span>
            </div>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold leading-tight">{SAMPLE_CRATE.name}</h2>
            <p className="mt-2 text-sm sleeve-muted italic leading-relaxed">“{SAMPLE_CRATE.note}”</p>
            <ol className="mt-3 sm:mt-5">
              {SAMPLE_CRATE.tracks.slice(0, 4).map((t, i) => (
                <li key={t.id} className={`sleeve-rule border-t flex items-baseline gap-3 py-2.5 sm:py-3 ${i >= 2 ? 'hidden sm:flex' : ''}`}>
                  <span className="label-meta sleeve-muted">A{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-sm sleeve-muted truncate">{t.artist}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="sleeve-rule border-t pt-3 mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium sleeve-accent">Open and search →</span>
              <span className="label-meta sleeve-muted">Try searching ‘Tems’</span>
            </div>
          </Link>
        </section>

        <section className="border-t border-border py-10 text-sm text-muted-foreground max-w-2xl">
          <p>
            Connecting Spotify lets you search tracks and save them to your crates. Music DNA only creates a
            Spotify playlist when you choose Export, and only keeps one updated if you turn on sync for that crate.
            You can disconnect at any time.
          </p>
        </section>
      </main>

      <footer className="container mx-auto max-w-5xl px-5 py-8 text-xs text-muted-foreground">
        Built by <a href="https://tobiafo.com" className="underline underline-offset-2 hover:text-foreground">Tobi Afolayan</a>
      </footer>
    </div>
  );
};

export default Landing;
