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
      <header className="container mx-auto max-w-5xl px-5 py-5 flex items-center justify-between">
        <span className="font-display text-lg font-bold tracking-tight">Music DNA</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" className="h-11" onClick={handleLogin} disabled={isLoggingIn}>
            Sign in
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-5">
        <section className="pt-12 pb-16 lg:pt-24 lg:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Find the tracks you don’t want to lose.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md">
              Save tracks in crates for the moments, moods, and scenes you come back to.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="h-12 px-6">
                <Link to={SAMPLE_PATH}>Explore a sample crate</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6" onClick={handleLogin} disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Connecting" /> : 'Connect Spotify'}
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground max-w-md">
              A crate is a named collection of tracks you want to find again.
            </p>
          </div>

          <Link
            to={SAMPLE_PATH}
            className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Open the sample crate ${SAMPLE_CRATE.name}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Sample crate</span>
              <span className="text-xs text-muted-foreground">{SAMPLE_CRATE.tracks.length} tracks</span>
            </div>
            <h2 className="font-display text-2xl font-bold">
              <span aria-hidden className="mr-2">{SAMPLE_CRATE.emoji}</span>{SAMPLE_CRATE.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{SAMPLE_CRATE.note}</p>
            <ol className="mt-5 divide-y divide-border">
              {SAMPLE_CRATE.tracks.slice(0, 4).map((t, i) => (
                <li key={t.id} className="flex items-center gap-4 py-3">
                  <span className="w-5 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{t.artist}</div>
                  </div>
                </li>
              ))}
            </ol>
            <span className="mt-4 inline-block text-sm font-medium text-primary">Open and search this crate →</span>
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
