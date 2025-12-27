import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Easing } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Music, Shield, Loader2, ArrowRight, Zap, Users, MapPin, Package, Palette, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

// Example crates for the hero visual
const exampleCrates = [
  { emoji: '🌙', name: 'Lagos Night Drive', color: '#6366f1' },
  { emoji: '⚡', name: 'Pre-Game Energy', color: '#f59e0b' },
  { emoji: '🎧', name: 'Deep Focus', color: '#06b6d4' },
  { emoji: '☀️', name: 'Sunday Soft Life', color: '#10b981' },
];

const Landing = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  // Smooth easing curve
  const smoothEase: Easing = [0.25, 0.46, 0.45, 0.94];

  const features = [
    {
      icon: <Package className="w-8 h-8" />,
      emoji: '🗂️',
      title: 'Crates - Your Music Memory',
      description: 'Organize by vibe, mood, or meaning—not just genre. Create collections like "Late Night Drive" or "Brunch Vibes".',
      bullets: [
        'Name with meaning (culture)',
        'AI suggests vibe tags (organization)',
        'You approve/edit (truth)',
      ],
    },
    {
      icon: <Palette className="w-8 h-8" />,
      emoji: '🎨',
      title: 'Studio - Create & Discover',
      description: 'Analyze playlists for flow, discover tracks with smart filters, build sets for events. Everything saves to Crates.',
      bullets: [
        'Playlist flow analyzer',
        'Smart track discovery',
        'Event-based set builder',
      ],
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      emoji: '🌙',
      title: 'Your Music Identity',
      description: 'Understand who you are musically. See your personality, taste evolution, and underground ratio—visualized.',
      bullets: [
        'Music personality archetype',
        'Audio DNA radar chart',
        'Your underground ratio %',
      ],
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Connect Spotify',
      description: 'We analyze your library (5 min)',
    },
    {
      number: '2',
      title: 'Create Crates',
      description: 'Organize by vibe: "Lagos Night Drive"',
    },
    {
      number: '3',
      title: 'Never Lose Fire Again',
      description: 'Find the perfect track instantly',
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
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

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
          className="min-h-[70vh] flex flex-col justify-center items-center text-center mb-16 lg:mb-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo */}
          <motion.div 
            className="inline-flex items-center justify-center mb-8 lg:mb-10"
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
            className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-5 lg:mb-6 tracking-tight leading-tight px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: smoothEase }}
          >
            Organize Your Music by <span className="text-gradient">Vibe, Not Genre</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="text-lg lg:text-2xl text-foreground/90 font-medium max-w-2xl mx-auto mb-4 px-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: smoothEase }}
          >
            Create Crates for every mood and moment. Never lose the perfect track again.
          </motion.p>
          
          {/* Description */}
          <motion.p 
            className="text-base lg:text-lg text-muted-foreground max-w-xl mx-auto mb-8 lg:mb-10 leading-relaxed px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Music DNA helps you organize your 5,000+ song library by meaning, not playlists. Build collections like "🌙 Lagos Night Drive" or "☀️ Sunday Soft Life" and actually remember what you love.
          </motion.p>

          {/* Crate Cards Visual */}
          <motion.div
            className="mb-10 lg:mb-12 relative w-full max-w-md mx-auto h-[180px] lg:h-[200px]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25, ease: smoothEase }}
          >
            {exampleCrates.map((crate, index) => (
              <motion.div
                key={crate.name}
                className="absolute left-1/2 bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-xl"
                style={{
                  width: '160px',
                  transformOrigin: 'center bottom',
                }}
                initial={{ 
                  x: '-50%',
                  y: 0,
                  rotate: (index - 1.5) * 8,
                  scale: 1 - index * 0.03,
                }}
                animate={{ 
                  x: '-50%',
                  y: [0, -8, 0],
                  rotate: (index - 1.5) * 8,
                }}
                transition={{
                  y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.3,
                  }
                }}
              >
                <div 
                  className="w-full aspect-square rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${crate.color}20` }}
                >
                  <span className="text-4xl">{crate.emoji}</span>
                </div>
                <p className="font-semibold text-sm text-foreground truncate">{crate.name}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div 
            className="flex justify-center px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.35, ease: smoothEase }}
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-sonic-dark text-primary-foreground font-bold px-8 lg:px-10 py-6 lg:py-7 text-base lg:text-lg rounded-2xl shadow-glow hover:shadow-glow-intense animate-glow-pulse min-h-[56px] gap-2 btn-scale"
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
                    Login with Spotify to Start
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ============ TRANSITION SUBHEADING ============ */}
        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: smoothEase }}
        >
          <div className="w-16 h-px bg-primary/60 mx-auto mb-4" />
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
            What You'll Get
          </h2>
        </motion.div>

        {/* ============ FEATURES SECTION ============ */}
        <motion.section
          className="mb-16 lg:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
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
                className="group rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl p-6 lg:p-8 transition-all duration-200 hover:border-primary/30 hover:shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{feature.emoji}</span>
                </div>
                <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-5">
                  {feature.description}
                </p>
                <ul className="space-y-2.5">
                  {feature.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ============ HOW IT WORKS SECTION ============ */}
        <motion.section
          className="mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: smoothEase }}
        >
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Three Simple Steps
            </h2>
          </div>
          
          <div className="max-w-md mx-auto space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
              >
                <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-px h-6 bg-primary/30" />
                  </div>
                )}
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
          <div className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl p-6 lg:p-10 max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground">
                Built by Event Curators for Music Lovers
              </h3>
            </div>
            <p className="text-muted-foreground text-base lg:text-lg mb-5">
              Created by the team behind <span className="text-primary font-medium">Apollo Wrldx</span>—bringing data-driven curation to Afrobeats & diaspora music.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm lg:text-base text-primary font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                30+ events
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                7,000+ attendees
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
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
          <div className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl p-6 lg:p-8 max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 lg:gap-3 mb-3 lg:mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg lg:text-xl font-bold text-foreground">Your Privacy Matters</h3>
            </div>
            <p className="text-base text-muted-foreground mb-4">
              We only request read access to your Spotify data. All analysis happens in your browser session 
              and is securely stored. Your data stays private—we never share it with third parties.
            </p>
            <p className="text-sm text-muted-foreground/80">
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
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              Ready to Organize Your Music?
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground mb-8">
              Stop losing tracks you love. Create your first Crate in 5 minutes.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-sonic-dark text-primary-foreground font-bold px-8 lg:px-10 py-6 lg:py-7 text-base lg:text-lg rounded-2xl shadow-glow hover:shadow-glow-intense animate-glow-pulse min-h-[56px] gap-2 btn-scale"
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
            
            <p className="text-sm text-muted-foreground mt-5">
              No credit card • Works with existing Spotify account
            </p>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer 
          className="text-center mt-12 lg:mt-16 text-muted-foreground text-sm"
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
