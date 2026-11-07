import { NavLink } from 'react-router-dom';
import { Library, Fingerprint, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export const libraryNavItems = [
  { path: '/crates', label: 'Library', icon: Library },
  { path: '/home', label: 'My DNA', icon: Fingerprint },
  { path: '/studio', label: 'Studio', icon: Palette },
];

export default function LibraryNav() {
  return <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
    {libraryNavItems.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path}
      className={({ isActive }) => cn('flex items-center gap-2 px-4 py-2.5 rounded-md text-sm transition-colors',
        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary')}>
      <Icon className="w-4 h-4" />{label}
    </NavLink>)}
  </nav>;
}