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
        <span className="font-display text-lg font-bold tracking-tight">Music DNA</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" className="h-11" onClick={handleLogin} disabled={isLoggingIn}>
            Sign in
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-5">
        <section className="pt-4 pb-10 lg:pt-12 lg:pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Find the tracks you don’t want to lose.
            </h1>
            <p className="mt-4 lg:mt-6 text-base lg:text-lg text-muted-foreground max-w-md">
              Collect tracks in searchable crates. When you’re ready to play or share one, turn it into a Spotify playlist.
            </p>
            <div className="mt-5 lg:mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button asChild size="lg" className="h-12 px-6 bg-none bg-primary shadow-none hover:shadow-none hover:scale-100 hover:bg-primary/90">
                <Link to={SAMPLE_PATH}>Explore a sample crate</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hidden sm:inline-flex h-12 px-6"
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Connecting" /> : 'Connect Spotify'}
              </Button>
              <button
                type="button"
                className="sm:hidden min-h-11 text-sm font-medium text-foreground underline underline-offset-4 disabled:opacity-60"
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Connecting…' : 'or Connect Spotify'}
              </button>
            </div>
          </div>

          <Link
            to={SAMPLE_PATH}
            className="block rounded-2xl border border-border bg-card p-4 sm:p-6 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Open the sample crate ${SAMPLE_CRATE.name}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Sample crate</span>
              <span className="text-xs text-muted-foreground">{SAMPLE_CRATE.tracks.length} tracks</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              <span aria-hidden className="mr-2">{SAMPLE_CRATE.emoji}</span>{SAMPLE_CRATE.name}
            </h2>
            <p className="mt-1 sm:mt-2 text-sm text-muted-foreground">{SAMPLE_CRATE.note}</p>
            <ol className="mt-3 sm:mt-5 divide-y divide-border">
              {SAMPLE_CRATE.tracks.slice(0, 4).map((t, i) => (
                <li key={t.id} className={`flex items-center gap-4 py-2.5 sm:py-3 ${i >= 2 ? 'hidden sm:flex' : ''}`}>
                  <span className="w-5 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{t.artist}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-primary">Open and search this crate →</span>
              <span className="text-muted-foreground">Try searching ‘Tems’.</span>
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
