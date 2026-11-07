import { createRoot } from 'react-dom/client';
import ShareIdentityModal from '@/components/identity/ShareIdentityModal';
import { Toaster } from '@/components/ui/toaster';
export function mount(tracks: {name:string;artist:string}[], name: string|null) {
  const el = document.createElement('div'); document.body.innerHTML=''; document.body.appendChild(el);
  const arche = name ? { name, description:'', traits:[], emoji:'🌙' } : null;
  createRoot(el).render(<><ShareIdentityModal open onOpenChange={()=>{}} archetype={arche as any} topTracks={tracks} /><Toaster/></>);
}
