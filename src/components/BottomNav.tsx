import { Link, useLocation } from 'react-router-dom';
import { Home, ListMusic, SlidersHorizontal, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/home', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { path: '/intelligence', label: 'Intelligence', icon: <Brain className="w-5 h-5" /> },
  { path: '/playlists', label: 'Playlists', icon: <ListMusic className="w-5 h-5" /> },
  { path: '/curation', label: 'Curation', icon: <SlidersHorizontal className="w-5 h-5" /> },
];

const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Glass background */}
      <div className="absolute inset-0 bg-card/90 backdrop-blur-xl border-t border-border/50" />
      
      {/* Safe area padding for iPhone notch */}
      <div className="relative flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px] min-h-[56px]",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <div className={cn(
                "transition-transform duration-200",
                active && "scale-110"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
