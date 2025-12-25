import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Music } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrackForAlbum {
  id: string;
  album: {
    id: string;
    name: string;
    images?: { url: string }[];
  };
  artists: { name: string }[];
}

interface TopAlbumsGridProps {
  tracks: TrackForAlbum[];
  isLoading: boolean;
}

interface AlbumData {
  id: string;
  name: string;
  artist: string;
  imageUrl: string | null;
  trackCount: number;
  spotifyUrl: string;
}

const TopAlbumsGrid = ({ tracks, isLoading }: TopAlbumsGridProps) => {
  const topAlbums = useMemo<AlbumData[]>(() => {
    if (!tracks.length) return [];

    // Group tracks by album
    const albumMap = new Map<string, AlbumData>();
    
    tracks.forEach(track => {
      const albumId = track.album.id;
      if (!albumMap.has(albumId)) {
        albumMap.set(albumId, {
          id: albumId,
          name: track.album.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          imageUrl: track.album.images?.[0]?.url || track.album.images?.[1]?.url || null,
          trackCount: 1,
          spotifyUrl: `https://open.spotify.com/album/${albumId}`,
        });
      } else {
        const album = albumMap.get(albumId)!;
        album.trackCount++;
      }
    });

    // Sort by track count and take top 5
    return Array.from(albumMap.values())
      .sort((a, b) => b.trackCount - a.trackCount)
      .slice(0, 5);
  }, [tracks]);

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-shrink-0">
                <Skeleton className="w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] rounded-xl" />
                <Skeleton className="h-4 w-20 mt-2" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topAlbums.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            🎧 Your Current Favorites
          </CardTitle>
          <CardDescription>
            Albums with most tracks in your top 50
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {topAlbums.map((album, index) => (
              <motion.a
                key={album.id}
                href={album.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex-shrink-0 group cursor-pointer"
              >
                <div className="relative w-[100px] h-[100px] lg:w-[120px] lg:h-[120px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/20">
                  {album.imageUrl ? (
                    <img
                      src={album.imageUrl}
                      alt={`${album.name} by ${album.artist}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Open in Spotify</span>
                  </div>
                </div>
                <div className="mt-2 w-[100px] lg:w-[120px]">
                  <p className="text-sm font-medium text-foreground truncate" title={album.name}>
                    {album.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={album.artist}>
                    {album.artist}
                  </p>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TopAlbumsGrid;
