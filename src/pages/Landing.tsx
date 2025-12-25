import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Music, Dna, Palette, Gem, Shield, Loader2, ArrowRight, Zap, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

// Personality archetypes for animation
const personalities = [
  {
    name: 'Midnight Curator',
    emoji: '🌙',
    traits: ['Mid-tempo grooves', 'Introspective vibes', 'Quality over trends'],
    data: [
      { feature: 'Energy', value: 55 },
      { feature: 'Dance', value: 65 },
      { feature: 'Mood', value: 50 },
      { feature: 'Acoustic', value: 40 },
      { feature: 'Underground', value: 75 },
      { feature: 'Tempo', value: 60 },
    ],
  },
  {
    name: 'Energy Architect',
    emoji: '⚡',
    traits: ['High-energy builds', 'Peak moments', 'Crowd control'],
    data: [
      { feature: 'Energy', value: 85 },
      { feature: 'Dance', value: 80 },
      { feature: 'Mood', value: 70 },
      { feature: 'Acoustic', value: 20 },
      { feature: 'Underground', value: 45 },
      { feature: 'Tempo', value: 80 },
    ],
  },
  {
    name: 'Vibes Engineer',
    emoji: '🎧',
    traits: ['Smooth transitions', 'Chill atmospheres', 'Emotional depth'],
    data: [
      { feature: 'Energy', value: 40 },
      { feature: 'Dance', value: 50 },
      { feature: 'Mood', value: 60 },
      { feature: 'Acoustic', value: 65 },
      { feature: 'Underground', value: 60 },
      { feature: 'Tempo', value: 45 },
    ],
  },
  {
    name: 'Peak Commander',
    emoji: '🚀',
    traits: ['Festival energy', 'Crowd anthems', 'Maximum impact'],
    data: [
      { feature: 'Energy', value: 90 },
      { feature: 'Dance', value: 85 },
      { feature: 'Mood', value: 80 },
      { feature: 'Acoustic', value: 15 },
      { feature: 'Underground', value: 30 },
      { feature: 'Tempo', value: 85 },
    ],
  },
];

const Landing = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentPersonalityIndex, setCurrentPersonalityIndex] = useState(0);

  // Rotate personalities every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPersonalityIndex((prev) => (prev + 1) % personalities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Redirect authenticated users to home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await login();
  };

  const currentPersonality = personalities[currentPersonalityIndex];

  // Smooth easing curve
  const smoothEase: Easing = [0.25, 0.46, 0.45, 0.94];

  const features = [
    {
      icon: <Dna className="w-8 h-8" />,
      title: 'Your Music DNA',
      description: 'Analyze your entire Spotify library and discover your unique music personality. See your top artists, BPM patterns, energy distribution, and underground ratio—all visualized with beautiful charts.',
      bullets: [
        'Your music personality archetype',
        'Audio DNA radar chart',
        'Top 50 most-played tracks',
        'BPM and energy patterns',
        'Discovery stats (underground ratio)',
      ],
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: 'AI-Powered Curation',
      description: 'Use intelligent tools to discover tracks and build playlists for any mood or event. Match songs by BPM, energy, vibe, and context.',
      bullets: [
        'Track Suggestions for playlists',
        'Smart Discovery (BPM, energy filters)',
        'Context Generator for events',
        'Automatic compatibility scoring',
        'One-click playlist creation',
      ],
    },
    {
      icon: <Gem className="w-8 h-8" />,
      title: 'Discover Hidden Gems',
      description: 'Rediscover forgotten favorites and underground tracks buried in your library. See how many hidden gems you have compared to mainstream hits.',
      bullets: [
        'Underground vs mainstream ratio',
        'Tracks with popularity < 50',
        'Buried favorites you forgot about',
        'Your tastemaker score',
      ],
    },
  ];

  // Show loading while checking auth or redirecting
  if (isLoading || isAuthenticated) {
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
      {/* Animated Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-64 lg:w-96 h-64 lg:h-96 bg-chart-purple/5 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-16 max-w-6xl relative z-10">
        
        {/* ============ HERO SECTION ============ */}
        <motion.section 
          className="text-center mb-16 lg:mb-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo */}
          <motion.div 
            className="inline-flex items-center justify-center mb-6 lg:mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: smoothEase }}
          >
            <motion.div 
              className="relative"
              animate={{ y: [-4, 4, -4] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-sonic-dark rounded-2xl flex items-center justify-center shadow-glow animate-glow-pulse">
                <Music className="w-7 h-7 lg:w-8 lg:h-8 text-primary-foreground" />
              </div>
            </motion.div>
          </motion.div>
          
          {/* Main Title */}
          <motion.h1 
            className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 lg:mb-8 tracking-tight leading-tight px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: smoothEase }}
          >
            What's Your <span className="text-gradient">Music Personality?</span>
          </motion.h1>

          {/* Animated Radar Chart Preview */}
          <motion.div
            className="mb-6 lg:mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: smoothEase }}
          >
            <div className="relative mx-auto w-[180px] h-[180px] lg:w-[220px] lg:h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPersonalityIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={currentPersonality.data}>
                      <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <PolarAngleAxis 
                        dataKey="feature" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Profile"
                        dataKey="value"
                        stroke="hsl(262, 83%, 58%)"
                        fill="url(#radarGradientLanding)"
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="radarGradientLanding" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                          <stop offset="100%" stopColor="hsl(192, 91%, 43%)" />
                        </linearGradient>
                      </defs>
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Personality Name Badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPersonalityIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-3 lg:mt-4"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm lg:text-base font-medium text-primary">
                  <span>{currentPersonality.emoji}</span>
                  <span>{currentPersonality.name}</span>
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
          
          {/* Subtitle */}
          <motion.p 
            className="text-base lg:text-xl text-muted-foreground max-w-xl mx-auto mb-8 lg:mb-10 leading-relaxed px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            Are you a <span className="text-primary/80">Midnight Curator</span>, <span className="text-primary/80">Energy Architect</span>, <span className="text-primary/80">Vibes Engineer</span>, or <span className="text-primary/80">Peak Commander</span>?
          </motion.p>

          {/* CTA Button */}
          <motion.div 
            className="flex justify-center px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4, ease: smoothEase }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-sonic-dark text-primary-foreground font-bold px-8 lg:px-10 py-6 lg:py-7 text-base lg:text-lg rounded-2xl shadow-glow hover:shadow-glow-intense animate-glow-pulse min-h-[56px] gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Login with Spotify to Find Out
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ============ PREVIEW SECTION ============ */}
        <motion.section
          className="mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: smoothEase }}
        >
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground text-center mb-6 lg:mb-8">
            See What You'll Discover
          </h2>
          
          {/* Example Personality Card */}
          <div className="max-w-lg mx-auto">
            <motion.div 
              className="rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-xl p-6 lg:p-8 text-center shadow-xl shadow-primary/5"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-muted-foreground text-sm mb-2">Your personality is...</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl lg:text-4xl">🌙</span>
                <h3 className="font-display text-2xl lg:text-3xl font-bold text-primary">
                  MIDNIGHT CURATOR
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Mid-tempo Afrobeats • Introspective vibes • Quality over trends
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  108 BPM sweet spot
                </span>
                <span className="px-3 py-1 rounded-full bg-chart-purple/10 text-chart-purple font-medium">
                  34% underground gems
                </span>
              </div>
            </motion.div>
          </div>
          
          {/* Supporting text */}
          <p className="text-center text-muted-foreground text-sm lg:text-base mt-6 lg:mt-8 max-w-2xl mx-auto px-4">
            Plus: Audio DNA charts, top artists, listening patterns, BPM distribution, and AI-powered playlist curation tools.
          </p>
        </motion.section>

        {/* ============ FEATURES SECTION ============ */}
        <motion.section
          className="mb-16 lg:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: smoothEase 
                }}
                className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 lg:p-6 transition-colors duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-colors w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-1.5">
                  {feature.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                      <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ============ SOCIAL PROOF SECTION ============ */}
        <motion.section
          className="mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: smoothEase }}
        >
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 lg:p-10 max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg lg:text-xl font-semibold text-foreground">
                Trusted by Music Curators & Event Producers
              </h3>
            </div>
            <p className="text-muted-foreground text-sm lg:text-base mb-4">
              Built by the team behind <span className="text-primary font-medium">Apollo Wrldx</span>—bringing data-driven curation to Afrobeats & diaspora music.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs lg:text-sm text-primary font-medium flex-wrap">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                30+ events
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                7,000+ attendees
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                NYC, Dallas, Atlanta
              </span>
            </div>
          </div>
        </motion.section>

        {/* ============ PRIVACY SECTION ============ */}
        <motion.section 
          className="mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-5 lg:p-8 max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 lg:gap-3 mb-3 lg:mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
              </div>
              <h3 className="font-display text-base lg:text-lg font-semibold text-foreground">Your Privacy Matters</h3>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground mb-4">
              We only request read access to your Spotify data. All analysis happens in your browser session 
              and is securely stored. Your data stays private—we never share it with third parties.
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground/80">
              No credit card required • Free to use • Works with your existing Spotify account
            </p>
          </div>
        </motion.section>

        {/* ============ BOTTOM CTA SECTION ============ */}
        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: smoothEase }}
        >
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card/80 to-chart-purple/10 border border-primary/20 p-8 lg:p-12 max-w-2xl mx-auto">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-6">
              Ready to Discover Your Music Personality?
            </h2>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-sonic-dark text-primary-foreground font-bold px-8 lg:px-10 py-6 lg:py-7 text-base lg:text-lg rounded-2xl shadow-glow hover:shadow-glow-intense animate-glow-pulse min-h-[56px] gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Login with Spotify - It's Free
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </>
                )}
              </Button>
            </motion.div>
            
            <p className="text-xs lg:text-sm text-muted-foreground mt-4">
              No credit card • Works with existing Spotify account
            </p>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer 
          className="text-center mt-12 lg:mt-16 text-muted-foreground text-xs lg:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p>Powered by Spotify Web API</p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Landing;
