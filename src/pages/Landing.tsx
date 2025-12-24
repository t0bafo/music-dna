import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Music, Brain, BarChart3, Search, Sparkles, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getRedirectUri } from '@/lib/spotify-auth';

const Landing = () => {
  const { login, isLoading } = useAuth();
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await login();
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Understand Your Taste',
      description: 'Analyze 5,000+ tracks from your library. See your top artists, BPM preferences, energy patterns, and how your taste evolves—based on real listening data.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Perfect Your Playlists',
      description: 'Get flow scores (0-100) for any playlist. Identify jarring BPM jumps, energy drops, and get AI-powered suggestions to reorder tracks for smooth listening.',
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: 'Find Tracks That Fit',
      description: 'Search your library with precision: filter by BPM range, energy level, danceability, and underground status. Find the perfect tracks for any mood or event.',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Create Event-Ready Playlists',
      description: 'Generate playlists for specific contexts: Event Openers, Peak Energy, Wind Down, Creative Focus. AI builds the perfect track sequence from your library.',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-spotify mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-spotify rounded-full flex items-center justify-center">
                <Music className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6">
            Your Personal Music <br className="hidden sm:block" />
            <span className="text-spotify">Intelligence Platform</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Analyze your listening patterns, optimize playlist flow, and discover tracks that match your vibe—all powered by your Spotify data.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              size="lg"
              className="bg-spotify hover:bg-spotify-hover text-primary-foreground font-bold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Login with Spotify
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowSetupDialog(true)}
              className="px-6 py-6 text-lg rounded-full"
            >
              Setup Instructions
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-spotify/10 rounded-lg text-spotify">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Privacy Notice */}
        <div className="bg-card rounded-xl p-6 card-shadow max-w-2xl mx-auto text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-spotify" />
            <h3 className="font-bold text-card-foreground">Your Privacy Matters</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            We only request read access to your Spotify data. All analysis happens in your browser session 
            and is securely stored. Your data stays private—we never share it with third parties.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-muted-foreground text-sm">
          <p>Powered by Spotify Web API</p>
        </footer>
      </div>

      {/* Setup Instructions Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Spotify App Setup Instructions</DialogTitle>
            <DialogDescription>
              Before you can login, you need to update your Spotify App settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Go to{' '}
                <a
                  href="https://developer.spotify.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-spotify underline"
                >
                  developer.spotify.com/dashboard
                </a>
              </li>
              <li>Click on your app (or create one if needed)</li>
              <li>Click "Edit Settings"</li>
              <li>
                Add this Redirect URI:
                <code className="block mt-2 p-2 bg-muted rounded text-xs break-all">
                  {getRedirectUri()}
                </code>
              </li>
              <li>Save your changes</li>
              <li>Come back here and click "Login with Spotify"</li>
            </ol>
          </div>

          <Button onClick={() => setShowSetupDialog(false)} className="w-full">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
