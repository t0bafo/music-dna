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
      icon: <Brain className="w-7 h-7" />,
      title: 'Understand Your Taste',
      description: 'Analyze 5,000+ tracks from your library. See your top artists, BPM preferences, energy patterns, and how your taste evolves—based on real listening data.',
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'Perfect Your Playlists',
      description: 'Get flow scores (0-100) for any playlist. Identify jarring BPM jumps, energy drops, and get AI-powered suggestions to reorder tracks for smooth listening.',
    },
    {
      icon: <Search className="w-7 h-7" />,
      title: 'Find Tracks That Fit',
      description: 'Search your library with precision: filter by BPM range, energy level, danceability, and underground status. Find the perfect tracks for any mood or event.',
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: 'Create Event-Ready Playlists',
      description: 'Generate playlists for specific contexts: Event Openers, Peak Energy, Wind Down, Creative Focus. AI builds the perfect track sequence from your library.',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 lg:w-96 h-64 lg:h-96 bg-chart-purple/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-20 max-w-6xl relative z-10">
        <div className="text-center mb-12 lg:mb-20 animate-fade-in">
          {/* Logo */}
          <div className="inline-flex items-center justify-center gap-3 mb-6 lg:mb-8">
            <div className="relative">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-primary to-sonic-dark rounded-2xl flex items-center justify-center shadow-glow animate-glow-pulse">
                <Music className="w-8 h-8 lg:w-10 lg:h-10 text-primary-foreground" />
              </div>
            </div>
          </div>
          
          <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-4 lg:mb-6 tracking-tight leading-tight">
            Your Personal Music <br className="hidden sm:block" />
            <span className="text-gradient">Intelligence Platform</span>
          </h1>
          
          <p className="text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 lg:mb-12 leading-relaxed px-4">
            Analyze your listening patterns, optimize playlist flow, and discover tracks that match your vibe—all powered by your Spotify data.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center items-center px-4">
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-sonic-dark text-primary-foreground font-bold px-8 lg:px-10 py-6 lg:py-7 text-base lg:text-lg rounded-2xl shadow-glow hover:shadow-glow-intense animate-glow-pulse min-h-[56px]"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Login with Spotify
                </>
              )}
            </Button>
            
            <Button
              variant="glass"
              size="lg"
              onClick={() => setShowSetupDialog(true)}
              className="w-full sm:w-auto px-6 lg:px-8 py-6 lg:py-7 text-base lg:text-lg rounded-2xl min-h-[56px]"
            >
              Setup Instructions
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-4 lg:gap-6 mb-12 lg:mb-20 px-0">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 lg:p-8 transition-all duration-300 hover:border-primary/30 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4 lg:gap-5">
                <div className="p-3 lg:p-4 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-base lg:text-xl font-semibold text-foreground mb-2 lg:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Privacy Notice */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 lg:p-8 max-w-2xl mx-auto text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 lg:gap-3 mb-3 lg:mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            </div>
            <h3 className="font-display text-base lg:text-lg font-semibold text-foreground">Your Privacy Matters</h3>
          </div>
          <p className="text-sm lg:text-base text-muted-foreground">
            We only request read access to your Spotify data. All analysis happens in your browser session 
            and is securely stored. Your data stays private—we never share it with third parties.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 lg:mt-20 text-muted-foreground text-xs lg:text-sm">
          <p>Powered by Spotify Web API</p>
        </footer>
      </div>

      {/* Setup Instructions Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">Spotify App Setup Instructions</DialogTitle>
            <DialogDescription>
              Before you can login, you need to update your Spotify App settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground">
              <li>
                Go to{' '}
                <a
                  href="https://developer.spotify.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  developer.spotify.com/dashboard
                </a>
              </li>
              <li>Click on your app (or create one if needed)</li>
              <li>Click "Edit Settings"</li>
              <li>
                Add this Redirect URI:
                <code className="block mt-2 p-3 bg-secondary rounded-lg text-xs break-all border border-border/50">
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
