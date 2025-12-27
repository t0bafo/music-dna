import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicCrate, CrateWithTracks } from '@/lib/crates-api';
import { Music, Loader2, ExternalLink, Play, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/use-page-title';

const CrateShare = () => {
  const { crateId } = useParams<{ crateId: string }>();

  const { data: crate, isLoading, error } = useQuery({
    queryKey: ['public-crate', crateId],
    queryFn: () => getPublicCrate(crateId!),
    enabled: !!crateId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  usePageTitle(crate ? `${crate.emoji} ${crate.name} | Shared Crate` : 'Shared Crate');

  // Format duration
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${totalMinutes} min`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !crate) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Music className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-bold text-lg">Music DNA</span>
            </Link>
            <Link to="/">
              <Button className="gap-2">
                <Sparkles className="w-4 h-4" />
                Create Yours
              </Button>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-bold mb-2">Crate not found</h1>
            <p className="text-muted-foreground mb-6">
              This crate may have been deleted or the link is incorrect.
            </p>
            <Link to="/">
              <Button>Go to Music DNA</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg">Music DNA</span>
          </Link>
          <Link to="/">
            <Button className="gap-2">
              <Sparkles className="w-4 h-4" />
              Create Your Own
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Crate Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Large Emoji */}
          <div
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-lg"
            style={{
              backgroundColor: `${crate.color}20`,
              borderColor: crate.color,
              borderWidth: 3,
            }}
          >
            <span className="text-6xl">{crate.emoji}</span>
          </div>

          {/* Crate Name */}
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {crate.name}
          </h1>

          {/* Description */}
          {crate.description && (
            <p className="text-muted-foreground text-lg mb-4 max-w-md mx-auto">
              {crate.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Music className="w-4 h-4" />
              {crate.tracks?.length || 0} tracks
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatTotalDuration((crate as any).total_duration_ms || 0)}
            </span>
          </div>
        </motion.div>

        {/* Track List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          {crate.tracks?.map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-card/40 rounded-xl border border-border/30 hover:border-border/60 hover:bg-card/60 transition-all group"
            >
              {/* Position */}
              <span className="text-sm text-muted-foreground/70 w-6 text-center font-mono">
                {index + 1}
              </span>

              {/* Album Art */}
              <div className="w-12 h-12 rounded-md bg-secondary/50 shrink-0 overflow-hidden">
                {track.album_art_url ? (
                  <img
                    src={track.album_art_url}
                    alt={track.album_name || 'Album art'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {track.name || 'Unknown Track'}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">{track.artist_name || 'Unknown Artist'}</span>
                  {track.duration_ms && (
                    <>
                      <span className="text-border">•</span>
                      <span className="shrink-0">{formatDuration(track.duration_ms)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Play in Spotify Button */}
              <a
                href={`https://open.spotify.com/track/${track.track_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-primary"
                >
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Play</span>
                </Button>
              </a>
            </div>
          ))}
        </motion.div>

        {/* Empty state */}
        {(!crate.tracks || crate.tracks.length === 0) && (
          <div className="bg-card/40 rounded-2xl p-12 text-center border border-border/30">
            <div className="text-5xl mb-4">🎵</div>
            <p className="text-muted-foreground">This crate has no tracks yet</p>
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20">
            <h2 className="font-display text-xl font-bold mb-2">
              Create Your Own Music Crates
            </h2>
            <p className="text-muted-foreground mb-4">
              Organize your music by vibe, mood, or memory. Free to use.
            </p>
            <Link to="/">
              <Button size="lg" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Get Started Free
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Made with <span className="text-primary">♪</span> by{' '}
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Music DNA
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CrateShare;
