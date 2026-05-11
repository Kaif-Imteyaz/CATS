import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export function useHaptics() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const haptic = useCallback((type: HapticType = 'light') => {
    // Check for iOS haptic feedback API
    const w = window as typeof window & {
      webkit?: {
        messageHandlers?: {
          hapticFeedback?: {
            postMessage: (msg: { type: string }) => void;
          };
        };
      };
    };

    if (w.webkit?.messageHandlers?.hapticFeedback) {
      w.webkit.messageHandlers.hapticFeedback.postMessage({ type });
      return;
    }

    // Fallback to vibration API
    switch (type) {
      case 'light':
      case 'selection':
        vibrate(10);
        break;
      case 'medium':
        vibrate(20);
        break;
      case 'heavy':
        vibrate(30);
        break;
      case 'success':
        vibrate([10, 50, 10]);
        break;
      case 'warning':
        vibrate([20, 100, 20]);
        break;
      case 'error':
        vibrate([50, 100, 50, 100, 50]);
        break;
    }
  }, [vibrate]);

  const buttonPress = useCallback(() => haptic('light'), [haptic]);
  const buttonRelease = useCallback(() => haptic('selection'), [haptic]);
  const success = useCallback(() => haptic('success'), [haptic]);
  const error = useCallback(() => haptic('error'), [haptic]);
  const warning = useCallback(() => haptic('warning'), [haptic]);

  return {
    haptic,
    buttonPress,
    buttonRelease,
    success,
    error,
    warning,
    vibrate,
  };
}
