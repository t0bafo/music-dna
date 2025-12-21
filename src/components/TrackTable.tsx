import { Music } from 'lucide-react';

interface TrackWithFeatures {
  id: string;
  name: string;
  artist: string;
  album?: string | { id: string; name: string; images: { url: string }[] };
  albumImage?: string;
  tempo?: number;
  danceability?: number;
  energy?: number;
  valence?: number;
  acousticness?: number;
  speechiness?: number;
  instrumentalness?: number;
  liveness?: number;
}

interface TrackTableProps {
  tracks: TrackWithFeatures[];
  showPosition?: boolean;
}

const formatPercent = (value: number | undefined) =>
  value != null ? `${(value * 100).toFixed(0)}%` : '-';

const TrackTable = ({ tracks, showPosition = true }: TrackTableProps) => {
  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {showPosition && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
                  #
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Track
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                BPM
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                Dance
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                Energy
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                Mood
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tracks.map((track, index) => (
              <tr key={track.id} className="hover:bg-muted/30 transition-colors">
                {showPosition && (
                  <td className="px-4 py-3 text-muted-foreground text-sm font-medium">
                    {index + 1}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      {track.albumImage ? (
                        <img
                          src={track.albumImage}
                          alt={track.album}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-card-foreground truncate max-w-[200px]">
                        {track.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {track.artist}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-medium ${track.tempo ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                    {track.tempo ? Math.round(track.tempo) : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-medium ${track.danceability ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                    {formatPercent(track.danceability)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-medium ${track.energy ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                    {formatPercent(track.energy)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-medium ${track.valence ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                    {formatPercent(track.valence)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrackTable;
