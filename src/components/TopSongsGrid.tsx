import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { SpotifyTrack } from '@/lib/spotify-api';
import { Skeleton } from '@/components/ui/skeleton';

interface TopSongsGridProps {
  tracks: SpotifyTrack[];
  isLoading: boolean;
  maxTracks?: number;
}

const TopSongsGrid = ({ tracks, isLoading, maxTracks = 5 }: TopSongsGridProps) => {
  if (isLoading) {
    return (
      <section>
        <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
          🎵 Your Top Songs
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] lg:overflow-visible">
          {Array.from({ length: maxTracks }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[120px] lg:w-auto">
              <Skeleton className="w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] rounded-xl mb-3" />
              <Skeleton className="h-4 w-full mb-1.5" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (tracks.length === 0) {
    return (
      <section>
        <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
          🎵 Your Top Songs
        </h2>
        <p className="text-center text-muted-foreground py-8">
          No top tracks found. Listen to more music on Spotify!
        </p>
      </section>
    );
  }

  const displayTracks = tracks.slice(0, maxTracks);

  return (
    <section>
      <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-4">
        🎵 Your Top Songs
      </h2>
      
      {/* Mobile: Horizontal scroll / Desktop: Grid */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] lg:max-w-[800px] lg:overflow-visible">
        {displayTracks.map((track) => (
          <a
            key={track.id}
            href={`https://open.spotify.com/track/${track.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-shrink-0 w-[120px] lg:w-auto text-center transition-transform duration-200 hover:scale-105"
            aria-label={`${track.name} by ${track.artists.map(a => a.name).join(', ')}`}
          >
            {/* Album Art */}
            <div className="relative w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] mx-auto mb-3 rounded-xl overflow-hidden shadow-lg group-hover:shadow-glow transition-shadow">
              <img
                src={track.album.images[1]?.url || track.album.images[0]?.url}
                alt={`${track.name} album art`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {/* Track Name */}
            <p className="text-sm font-medium text-foreground line-clamp-2 mb-0.5 px-1">
              {track.name}
            </p>
            
            {/* Artist */}
            <p className="text-xs text-muted-foreground line-clamp-1 px-1">
              {track.artists.map(a => a.name).join(', ')}
            </p>
          </a>
        ))}
        
        {/* See All Button - flows inline with cards */}
        <Link
          to="/intelligence#top-songs"
          className="flex-shrink-0 w-[120px] lg:w-auto flex items-center justify-center lg:justify-start"
          aria-label="View all 50 top tracks on Intelligence page"
        >
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap">
            See All 50
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </section>
  );
};

export default TopSongsGrid;
