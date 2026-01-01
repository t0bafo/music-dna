import { Link, useLocation } from 'react-router-dom';
import { Home, Palette, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/use-haptics';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/home', label: 'Home', icon: <Home className="w-6 h-6" /> },
  { path: '/crates', label: 'Crates', icon: <Package className="w-6 h-6" /> },
  { path: '/studio', label: 'Studio', icon: <Palette className="w-6 h-6" /> },
];

const BottomNav = () => {
  const location = useLocation();
  const { lightTap } = useHaptics();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    lightTap();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Glass background */}
      <div className="absolute inset-0 bg-card/90 backdrop-blur-xl border-t border-border/50" />
      
      {/* Safe area padding for iPhone notch */}
      <div className="relative flex items-center justify-around px-2 py-2 pb-[max(env(safe-area-inset-bottom,8px),8px)]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl transition-all duration-200 touch-target-lg",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground active:bg-secondary/50"
              )}
            >
              <div className={cn(
                "transition-transform duration-200",
                active && "scale-110"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-colors",
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
