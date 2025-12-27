import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Easing } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowRight, Check, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

// Example crates for hero visual
const exampleCrates = [
  { emoji: '🌙', name: 'Lagos Night Drive', subtitle: 'Mid-tempo Afrobeats, 24 tracks' },
  { emoji: '⚡', name: '4am Club Energy', subtitle: 'Peak hour fire, 18 tracks' },
  { emoji: '🌍', name: 'Underground Diaspora', subtitle: 'SoundCloud gems, 31 tracks' },
];

const Landing = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await login();
  };

  const smoothEase: Easing = [0.25, 0.46, 0.45, 0.94];

  const trustSignals = [
    "We never post automatically",
    "Playlists only created when you export",
    "Your data stays private",
    "Disconnect anytime"
  ];

  const problems = [
    {
      icon: '🕐',
      title: 'The Moment Problem',
      body: (
        <>
          It's Sunday morning. You're cooking breakfast. You need the <em className="italic not-italic font-medium text-foreground/80">perfect</em> vibe—not "chill," specifically <em className="italic not-italic font-medium text-foreground/80">this</em> energy, right now.
          <br /><br />
          You know you have the tracks. Somewhere. In your library.
          <br /><br />
          By the time you find it, you've burned the eggs.
        </>
      )
    },
    {
      icon: '🧠',
      title: 'The Memory Problem',
      body: (
        <>
          Last week you spent 3 hours discovering underground fire on SoundCloud.
          <br /><br />
          Today? You can't remember where you put it.
          <br /><br />
          Your musical memory is a black hole. You find fire. You lose fire. You rediscover it by accident months later and think, "Oh shit, I forgot about this."
        </>
      )
    },
    {
      icon: '🪞',
      title: 'The Mirror Problem',
      body: (
        <>
          "Afrobeats" feels too broad. "Mid-tempo grooves" sounds generic. "Quality over trends" means nothing.
          <br /><br />
          You have this rich relationship with music—shaped by culture, discovery, and feeling—but you can't articulate it.
          <br /><br />
          You can't even see it yourself.
        </>
      )
    }
  ];

  const steps = [
    { icon: '🎵', title: 'Connect Spotify', body: 'We analyze your library in minutes' },
    { icon: '🗂️', title: 'Create Your First Crate', body: 'Organize by vibe, mood, or meaning' },
    { icon: '🎯', title: 'Never Lose Fire Again', body: 'Find the perfect track instantly' },
  ];

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
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-64 lg:w-96 h-64 lg:h-96 bg-chart-purple/5 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative z-10">
        {/* ============ HERO SECTION ============ */}
        <motion.section 
          className="min-h-screen flex flex-col justify-center items-center text-center px-6 py-16 lg:py-20 max-w-[1200px] mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: smoothEase }}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-sonic-dark rounded-2xl flex items-center justify-center shadow-glow">
              <Music className="w-7 h-7 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            className="font-display text-[32px] sm:text-4xl lg:text-[48px] font-bold text-foreground mb-6 leading-[1.2] max-w-[800px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: smoothEase }}
          >
            You Know What You're Listening To.{' '}
            <span className="text-gradient">But Do You Know Who You Are as a Listener?</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="text-lg lg:text-2xl text-foreground/90 font-medium max-w-[700px] mb-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: smoothEase }}
          >
            Music DNA turns your library into crates, a taste profile, and a way to find the right vibe fast.
          </motion.p>
          
          {/* Description */}
          <motion.p 
            className="text-base lg:text-lg text-muted-foreground max-w-[650px] mb-12 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Your taste isn't a genre. It's culture, memory, and moments. Save what you love, organize by vibe, and actually see your musical identity.
          </motion.p>

          {/* Crate Cards Visual */}
          <motion.div
            className="mb-4 relative w-full max-w-[380px] h-[200px] lg:h-[220px]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25, ease: smoothEase }}
          >
            {exampleCrates.map((crate, index) => (
              <motion.div
                key={crate.name}
                className="absolute left-1/2 glass-card rounded-2xl p-5 w-[280px]"
                style={{ transformOrigin: 'center bottom' }}
                initial={{ 
                  x: '-50%',
                  y: index * 20,
                  rotate: (index - 1) * 6,
                  scale: 1 - index * 0.02,
                }}
                animate={{ 
                  x: '-50%',
                  y: [index * 20, index * 20 - 8, index * 20],
                  rotate: (index - 1) * 6,
                }}
                transition={{
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }
                }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{crate.emoji}</span>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{crate.name}</p>
                    <p className="text-sm text-muted-foreground">{crate.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div 
            className="w-full sm:w-auto mb-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.35, ease: smoothEase }}
          >
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              size="lg"
              className="w-full sm:w-auto bg-primary text-primary-foreground font-bold px-8 h-14 text-base rounded-xl shadow-glow hover:shadow-glow-intense btn-scale gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect Spotify to Start
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </motion.div>

          {/* Trust Signals */}
          <motion.div 
            className="flex flex-col items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {trustSignals.map((signal, i) => (
              <span key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                {signal}
              </span>
            ))}
          </motion.div>
        </motion.section>

        {/* ============ PROBLEMS SECTION ============ */}
        <section className="py-16 lg:py-20 px-6 bg-secondary/30">
          <div className="max-w-[1200px] mx-auto">
            <motion.h2 
              className="font-display text-2xl lg:text-[32px] font-bold text-foreground text-center mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              The Problems Music DNA Solves
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-6">
              {problems.map((problem, index) => (
                <motion.div
                  key={problem.title}
                  className="glass-card rounded-2xl p-8"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <span className="text-[48px] block mb-4">{problem.icon}</span>
                  <h3 className="font-display text-xl font-bold text-foreground mb-4">{problem.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{problem.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ WHAT'S A CRATE SECTION ============ */}
        <section className="py-12 lg:py-16 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <motion.h2 
              className="font-display text-2xl lg:text-[28px] font-bold text-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              What's a Crate?
            </motion.h2>

            <motion.div 
              className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-lg text-muted-foreground">Playlists = one long list you forget about</p>
              <span className="hidden md:block text-muted-foreground">vs</span>
              <p className="text-lg text-primary font-medium">Crates = moodboards with meaning, tags, and memory</p>
            </motion.div>

            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Find the right vibe in seconds. Never lose fire again.
            </motion.p>
          </div>
        </section>

        {/* ============ FEATURES SECTION ============ */}
        <section className="py-16 lg:py-20 px-6 bg-secondary/30">
          <div className="max-w-[1200px] mx-auto">
            <motion.h2 
              className="font-display text-2xl lg:text-4xl font-bold text-foreground text-center mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              What You'll Get
            </motion.h2>

            {/* Feature 1: Crates */}
            <motion.div 
              className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center mb-16 lg:mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="lg:col-span-3 order-2 lg:order-1">
                <span className="text-[64px] block mb-4">🗂️</span>
                <h3 className="font-display text-2xl lg:text-[28px] font-bold text-foreground mb-4">
                  Crates: Your Music Memory
                </h3>
                <div className="text-muted-foreground leading-relaxed space-y-4">
                  <p>Organize by vibe, mood, or meaning—not just genre.</p>
                  <p>Build collections like:</p>
                  <ul className="space-y-2 ml-1">
                    <li>🌙 Lagos Night Drive (Mid-tempo Afrobeats for calm drives)</li>
                    <li>⚡ 4am Peak Energy (The tracks that hit at the club)</li>
                    <li>☀️ Sunday Soft Life (Smooth songs for lazy days)</li>
                    <li>🌍 Underground Diaspora (SoundCloud finds you'll never lose again)</li>
                  </ul>
                  <p>Search any song on Spotify. Add it to a Crate. Find it instantly when you need it.</p>
                  <p className="font-medium text-foreground">Capture moments. Remember vibes. Never burn the eggs.</p>
                </div>
              </div>
              <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { emoji: '🌙', name: 'Lagos Night Drive', count: 24 },
                    { emoji: '⚡', name: '4am Peak Energy', count: 18 },
                    { emoji: '☀️', name: 'Sunday Soft Life', count: 31 },
                    { emoji: '🌍', name: 'Underground Diaspora', count: 42 },
                  ].map((crate) => (
                    <div key={crate.name} className="glass-card rounded-xl p-4 text-center">
                      <span className="text-3xl block mb-2">{crate.emoji}</span>
                      <p className="font-medium text-sm text-foreground truncate">{crate.name}</p>
                      <p className="text-xs text-muted-foreground">{crate.count} tracks</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Feature 2: Musical Identity */}
            <motion.div 
              className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center mb-16 lg:mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="lg:col-span-2">
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="text-center">
                    <span className="text-5xl">🧬</span>
                    <h4 className="font-display text-lg font-bold text-foreground mt-2">The Midnight Curator</h4>
                    <p className="text-sm text-muted-foreground">Your archetype</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Underground Index</span>
                      <span className="text-primary font-medium">34%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Top Scene</span>
                      <span className="text-foreground">Afrobeats</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Crate Style</span>
                      <span className="text-foreground">Moment Organizer</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3">
                <span className="text-[64px] block mb-4">🧬</span>
                <h3 className="font-display text-2xl lg:text-[28px] font-bold text-foreground mb-4">
                  Your Musical Identity: See Your Taste
                </h3>
                <div className="text-muted-foreground leading-relaxed space-y-4">
                  <p>Are you a Midnight Curator? Energy Architect? Vibes Engineer?</p>
                  <p>See your taste mapped:</p>
                  <ul className="space-y-2 ml-1">
                    <li><span className="text-foreground font-medium">Underground Index:</span> How deep you dig vs what's trending</li>
                    <li><span className="text-foreground font-medium">Your Signature Scenes:</span> Afrobeats, UK Swing, Amapiano, Lo-fi</li>
                    <li><span className="text-foreground font-medium">Library Evolution:</span> Track when your taste shifted</li>
                    <li><span className="text-foreground font-medium">Crate Personality:</span> Your organization style reveals your taste</li>
                  </ul>
                  <p className="text-sm italic">Enhanced DNA (when available): Tempo ranges, energy curves, and audio signatures via advanced analysis.</p>
                  <p className="font-medium text-foreground">The map of your musical identity.</p>
                </div>
              </div>
            </motion.div>

            {/* Feature 3: Studio */}
            <motion.div 
              className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="lg:col-span-3 order-2 lg:order-1">
                <span className="text-[64px] block mb-4">🎨</span>
                <h3 className="font-display text-2xl lg:text-[28px] font-bold text-foreground mb-4">
                  Studio: Built for Tastemakers
                </h3>
                <div className="text-muted-foreground leading-relaxed space-y-4">
                  <p>Stop curating in the dark.</p>
                  <ul className="space-y-3">
                    <li>
                      <span className="text-foreground font-medium">🔍 Find tracks by exact vibe</span>
                      <p className="text-sm ml-6">Search by mood, scene, or energy - get instant results</p>
                    </li>
                    <li>
                      <span className="text-foreground font-medium">🗂️ Build sets that flow</span>
                      <p className="text-sm ml-6">Organize tracks with intention, not guesswork</p>
                    </li>
                    <li>
                      <span className="text-foreground font-medium">🎧 Export to Spotify</span>
                      <p className="text-sm ml-6">Turn Crates into playlists people actually follow</p>
                    </li>
                  </ul>
                  <p className="font-medium text-foreground">Build your influence. Share your taste. Curate with confidence.</p>
                </div>
              </div>
              <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🎨</span>
                    <h4 className="font-display font-bold text-foreground">Playlist Analyzer</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Flow Score</span>
                        <span className="text-primary font-medium">87/100</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full w-[87%] bg-primary rounded-full" />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Energy Curve</span>
                      <span className="text-foreground">Rising Arc</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">BPM Range</span>
                      <span className="text-foreground">98-128</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ CULTURAL POSITIONING ============ */}
        <section className="py-12 lg:py-16 px-6 bg-gradient-to-b from-background to-secondary/20">
          <div className="max-w-[800px] mx-auto text-center">
            <motion.h2 
              className="font-display text-2xl lg:text-[32px] font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Built for Taste Beyond Genre Labels
            </motion.h2>

            <motion.div 
              className="text-lg leading-relaxed space-y-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-muted-foreground">Most music tools stop at genres and charts.</p>
              <p className="text-foreground font-medium">Music DNA goes deeper.</p>
              <div className="text-muted-foreground space-y-2">
                <p>Built for:</p>
                <ul className="space-y-1">
                  <li><span className="text-primary">•</span> Global listeners + diaspora scenes (Afrobeats, Amapiano, Alté)</li>
                  <li><span className="text-primary">•</span> Cultural nuance (Not just "World Music")</li>
                  <li><span className="text-primary">•</span> Vibe-based curation (Memory and meaning, not algorithms)</li>
                </ul>
              </div>
              <p className="text-xl italic text-foreground pt-2">Your taste isn't a genre tag. It's a story.</p>
            </motion.div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="py-12 lg:py-16 px-6 bg-secondary/30">
          <div className="max-w-[1200px] mx-auto">
            <motion.h2 
              className="font-display text-2xl lg:text-[32px] font-bold text-foreground text-center mb-10 lg:mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              How It Works
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-[64px] block mb-4">{step.icon}</span>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="py-16 lg:py-20 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <motion.h2 
              className="font-display text-3xl lg:text-[40px] font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Ready to See Your Musical Identity?
            </motion.h2>

            <motion.p 
              className="text-lg text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Free. No credit card. Works with Spotify Free & Premium.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                size="lg"
                className="bg-primary text-primary-foreground font-bold px-8 h-14 text-base rounded-xl shadow-glow hover:shadow-glow-intense btn-scale gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Spotify to Start
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-primary text-primary hover:bg-primary/10 font-bold px-8 h-14 text-base rounded-xl"
                onClick={() => navigate('/home')}
              >
                See a Demo First
              </Button>
            </motion.div>

            <motion.div 
              className="flex flex-col items-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {trustSignals.map((signal, i) => (
                <span key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  {signal}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="py-8 px-6 border-t border-border/40">
          <div className="max-w-[1200px] mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              Powered by the Spotify Web API
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
