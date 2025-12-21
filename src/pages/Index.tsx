import { useState } from "react";
import { Music, Loader2, AlertCircle, Disc3 } from "lucide-react";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
}

const Index = () => {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTracks = async () => {
    if (!clientId || !clientSecret) {
      setError("Please enter both Client ID and Client Secret");
      return;
    }

    setLoading(true);
    setError("");
    setTracks([]);

    try {
      // Get access token
      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!tokenResponse.ok) {
        throw new Error("Invalid credentials. Please check your Client ID and Secret.");
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Search for Afrobeats tracks
      const searchResponse = await fetch(
        "https://api.spotify.com/v1/search?q=genre:afrobeats&type=track&limit=20",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error("Failed to fetch tracks. Please try again.");
      }

      const searchData = await searchResponse.json();
      setTracks(searchData.tracks.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Disc3 className="w-12 h-12 text-primary animate-spin-slow" />
              <Music className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Afrobeats Audio DNA Analyzer
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the rhythm and soul of Afrobeats. Connect your Spotify credentials to explore trending tracks.
          </p>
        </header>

        {/* Credentials Form */}
        <div className="bg-card rounded-xl card-shadow p-6 md:p-8 mb-8 animate-scale-in">
          <h2 className="text-xl font-semibold text-card-foreground mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary" />
            </span>
            Connect to Spotify
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label 
                htmlFor="clientId" 
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Spotify Client ID
              </label>
              <input
                id="clientId"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your Client ID"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label 
                htmlFor="clientSecret" 
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Spotify Client Secret
              </label>
              <input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter your Client Secret"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            onClick={fetchTracks}
            disabled={loading || !clientId || !clientSecret}
            className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-spotify-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching Tracks...
              </>
            ) : (
              <>
                <Music className="w-5 h-5" />
                Fetch Tracks
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-8 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-card rounded-xl card-shadow p-12 text-center animate-fade-in">
            <div className="relative inline-block">
              <Disc3 className="w-16 h-16 text-primary animate-spin-slow" />
              <Music className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground mt-4 text-lg">
              Discovering Afrobeats tracks...
            </p>
          </div>
        )}

        {/* Results Table */}
        {tracks.length > 0 && !loading && (
          <div className="bg-card rounded-xl card-shadow overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Disc3 className="w-4 h-4 text-primary" />
                </span>
                Afrobeats Tracks
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({tracks.length} results)
                </span>
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Track
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Artist
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Album
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tracks.map((track, index) => (
                    <tr 
                      key={track.id} 
                      className="hover:bg-muted/30 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 text-muted-foreground font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {track.album.images[2] ? (
                            <img
                              src={track.album.images[2].url}
                              alt={track.album.name}
                              className="w-10 h-10 rounded-md object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                              <Music className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-card-foreground line-clamp-1">
                              {track.name}
                            </p>
                            <p className="text-sm text-muted-foreground md:hidden line-clamp-1">
                              {track.artists.map((a) => a.name).join(", ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-card-foreground hidden md:table-cell">
                        <p className="line-clamp-1">
                          {track.artists.map((a) => a.name).join(", ")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">
                        <p className="line-clamp-1">{track.album.name}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && tracks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <Disc3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Enter your Spotify credentials to discover Afrobeats tracks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
