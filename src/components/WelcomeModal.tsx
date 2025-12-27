import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_MODAL_KEY = 'hasSeenWelcomeModal';

interface WelcomeModalProps {
  forceShow?: boolean;
}

export const WelcomeModal = ({ forceShow = false }: WelcomeModalProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      return;
    }

    const hasSeenWelcome = localStorage.getItem(WELCOME_MODAL_KEY);
    if (!hasSeenWelcome) {
      // Delay showing modal by 500ms for smoother UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleClose = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, 'true');
    setIsOpen(false);
  };

  const handleGetStarted = () => {
    localStorage.setItem(WELCOME_MODAL_KEY, 'true');
    setIsOpen(false);
    navigate('/crates');
  };

  const features = [
    {
      emoji: '🗂️',
      title: 'Create Crates for every mood',
      description: 'Like "🌙 Lagos Night Drive" or "☀️ Sunday Soft Life"',
    },
    {
      emoji: '📊',
      title: 'Analyze playlists for flow',
      description: 'Get optimization suggestions for better energy curves and BPM transitions',
    },
    {
      emoji: '🔍',
      title: 'Discover tracks instantly',
      description: 'Find the perfect song with smart filters and BPM ranges',
    },
    {
      emoji: '🎧',
      title: 'Export to Spotify',
      description: 'Turn any Crate into a Spotify playlist with one click',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-[500px] w-[90vw] p-0 bg-card/95 backdrop-blur-xl border-border/30 rounded-2xl overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="p-6 sm:p-8"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Welcome to Music DNA! 🎵
                </h2>
                <p className="text-muted-foreground">
                  Organize your music by vibe, not genre.
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/50 mb-6" />

              {/* Features */}
              <div className="space-y-5 mb-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{feature.emoji}</span>
                    <div>
                      <h3 className="font-medium text-foreground text-sm sm:text-base">
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-border/50 mb-6" />

              {/* CTA Button */}
              <Button
                onClick={handleGetStarted}
                className="w-full h-12 text-base font-semibold gap-2 group"
                size="lg"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
