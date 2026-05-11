/**
 * Offline Indicator Component
 * Shows connection status and pending sync count
 */

import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from '../hooks/useAuth';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useHaptics } from '../hooks/useHaptics';

interface OfflineIndicatorProps {
  className?: string;
  showSyncButton?: boolean;
  variant?: 'minimal' | 'full';
}

export function OfflineIndicator({
  className,
  showSyncButton = true,
  variant = 'minimal',
}: OfflineIndicatorProps) {
  const { user } = useAuth();
  const { isOnline, pendingActions, syncStatus, sync } = useOnlineStatus(user?.id);
  const { haptic } = useHaptics();

  const handleSync = async () => {
    haptic('medium');
    await sync();
    haptic(syncStatus === 'success' ? 'success' : 'error');
  };

  // Minimal variant - just a dot indicator
  if (variant === 'minimal') {
    if (isOnline && pendingActions === 0) {
      return null; // Don't show when fully synced
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
            <WifiOff size={12} />
            <span>Offline</span>
          </div>
        )}

        {pendingActions > 0 && (
          <button
            onClick={handleSync}
            disabled={!isOnline || syncStatus === 'syncing'}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
              'bg-primary/10 text-primary hover:bg-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            <span>{pendingActions} pending</span>
          </button>
        )}
      </div>
    );
  }

  // Full variant - detailed status card
  return (
    <div
      className={cn(
        'p-3 rounded-xl border flex items-center gap-3',
        isOnline ? 'bg-card' : 'bg-yellow-500/5 border-yellow-500/30',
        className
      )}
    >
      {/* Status Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          isOnline
            ? 'bg-emerald-500/10 text-emerald-500'
            : 'bg-yellow-500/10 text-yellow-500'
        )}
      >
        {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
      </div>

      {/* Status Text */}
      <div className="flex-1">
        <p className="font-medium text-sm">
          {isOnline ? 'Connected' : 'Offline Mode'}
        </p>
        <p className="text-xs text-muted-foreground">
          {!isOnline
            ? 'Changes will sync when online'
            : pendingActions > 0
              ? `${pendingActions} changes pending sync`
              : 'All data synced'}
        </p>
      </div>

      {/* Sync Status / Button */}
      {showSyncButton && pendingActions > 0 && isOnline && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          className="h-8"
        >
          {syncStatus === 'syncing' ? (
            <>
              <RefreshCw size={14} className="mr-1.5 animate-spin" />
              Syncing...
            </>
          ) : syncStatus === 'success' ? (
            <>
              <Check size={14} className="mr-1.5" />
              Synced
            </>
          ) : syncStatus === 'error' ? (
            <>
              <AlertCircle size={14} className="mr-1.5" />
              Retry
            </>
          ) : (
            <>
              <RefreshCw size={14} className="mr-1.5" />
              Sync Now
            </>
          )}
        </Button>
      )}

      {/* Offline Badge */}
      {!isOnline && (
        <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
          Offline
        </span>
      )}
    </div>
  );
}

// Toast-style notification for connection changes
export function ConnectionToast() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 animate-slide-up">
      <div className="p-3 rounded-xl bg-yellow-500/90 text-white flex items-center gap-3 shadow-lg">
        <WifiOff size={20} />
        <div className="flex-1">
          <p className="font-medium text-sm">You're offline</p>
          <p className="text-xs text-white/80">Your changes will sync when you're back online</p>
        </div>
      </div>
    </div>
  );
}
