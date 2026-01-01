import { useState } from 'react';
import { Check, AlertCircle, RefreshCw, Loader2, Link as LinkIcon, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { syncCrateToSpotify, enableSync, disableSync, formatTimeAgo } from '@/lib/spotify-sync';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CrateSyncData {
  id: string;
  spotify_playlist_id: string | null;
  sync_enabled: boolean;
  sync_status: string | null;
  last_synced_at: string | null;
  sync_error: string | null;
}

interface CrateSyncToggleProps {
  crate: CrateSyncData;
  onUpdate: () => void;
  onLinkPlaylist?: () => void;
}

export function CrateSyncToggle({ crate, onUpdate, onLinkPlaylist }: CrateSyncToggleProps) {
  const { accessToken } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const getSyncStatusDisplay = () => {
    if (!crate.spotify_playlist_id) {
      return {
        icon: <LinkIcon className="w-3.5 h-3.5" />,
        text: 'Not linked',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
      };
    }

    if (!crate.sync_enabled) {
      return {
        icon: <LinkIcon className="w-3.5 h-3.5" />,
        text: 'Linked (sync off)',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
      };
    }

    switch (crate.sync_status) {
      case 'synced':
        return {
          icon: <Check className="w-3.5 h-3.5" />,
          text: `Synced ${formatTimeAgo(crate.last_synced_at)}`,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-500/10',
        };
      case 'pending':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          text: 'Syncing...',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-500/10',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          text: 'Sync failed',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
        };
      default:
        return {
          icon: <RefreshCw className="w-3.5 h-3.5" />,
          text: 'Out of sync',
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-500/10',
        };
    }
  };

  const handleToggleSync = async () => {
    if (!accessToken || !crate.spotify_playlist_id) return;

    setIsToggling(true);
    try {
      if (crate.sync_enabled) {
        await disableSync(crate.id, accessToken);
        toast.success('Auto-sync disabled');
      } else {
        await enableSync(crate.id, accessToken);
        // Immediately sync after enabling
        await syncCrateToSpotify(crate.id, accessToken);
        toast.success('Auto-sync enabled & synced');
      }
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to toggle sync', { description: error.message });
    } finally {
      setIsToggling(false);
    }
  };

  const handleManualSync = async () => {
    if (!accessToken || !crate.spotify_playlist_id) return;

    setIsSyncing(true);
    try {
      await syncCrateToSpotify(crate.id, accessToken);
      toast.success('Synced to Spotify');
      onUpdate();
    } catch (error: any) {
      toast.error('Sync failed', { description: error.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const status = getSyncStatusDisplay();

  // Not linked - show link button
  if (!crate.spotify_playlist_id) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onLinkPlaylist}
              className="gap-2 text-xs"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Link Spotify
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Link to a Spotify playlist for sync</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sync status badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                status.bgColor,
                status.color
              )}
            >
              {status.icon}
              <span className="hidden sm:inline">{status.text}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {crate.sync_error ? (
              <p className="text-destructive">{crate.sync_error}</p>
            ) : (
              <p>{status.text}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Manual sync button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync now</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Auto-sync toggle */}
      <div className="flex items-center gap-1.5">
        <Switch
          id="auto-sync"
          checked={crate.sync_enabled}
          onCheckedChange={handleToggleSync}
          disabled={isToggling}
          className="scale-90"
        />
        <Label htmlFor="auto-sync" className="text-xs text-muted-foreground cursor-pointer">
          Auto
        </Label>
      </div>
    </div>
  );
}
