import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors"
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-foreground" />
        ) : (
          <Moon className="w-4 h-4 lg:w-5 lg:h-5 text-foreground" />
        )}
      </Button>
    </motion.div>
  );
}
