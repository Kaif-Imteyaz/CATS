/**
 * Push Notifications Service
 * Handles push notification subscription and management
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Initialize push notifications
   */
  async init(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Wait for service worker to be ready
      this.registration = await navigator.serviceWorker.ready;

      // Check existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<boolean> {
    if (!this.registration) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    // Request permission if not granted
    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }
    }

    try {
      // Check if VAPID key is configured
      if (!VAPID_PUBLIC_KEY) {
        console.warn('VAPID public key not configured');
        return false;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Subscribe to push notifications
      this.subscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Save subscription to Supabase
      if (isSupabaseConfigured()) {
        await this.saveSubscription(userId, this.subscription);
      }

      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();

      // Remove subscription from Supabase
      if (isSupabaseConfigured()) {
        await this.removeSubscription(userId);
      }

      this.subscription = null;
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Check if currently subscribed
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Get subscription data
   */
  getSubscriptionData(): PushSubscriptionData | null {
    if (!this.subscription) return null;

    const json = this.subscription.toJSON();
    if (!json.keys) return null;

    return {
      endpoint: this.subscription.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    };
  }

  /**
   * Show a local notification (for testing or when app is in foreground)
   */
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) return;
    if (Notification.permission !== 'granted') return;

    if (this.registration) {
      await this.registration.showNotification(title, {
        icon: '/Cats logo 1.png',
        badge: '/Cats logo 1.png',
        vibrate: [200, 100, 200],
        tag: 'cats-notification',
        renotify: true,
        ...options,
      });
    } else {
      new Notification(title, {
        icon: '/Cats logo 1.png',
        ...options,
      });
    }
  }

  /**
   * Schedule a health reminder notification
   */
  async scheduleReminder(
    id: string,
    title: string,
    body: string,
    scheduledTime: Date
  ): Promise<void> {
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.warn('Scheduled time is in the past');
      return;
    }

    // For immediate/near-future notifications, use setTimeout
    // For future notifications, we'd need a backend service
    if (delay < 24 * 60 * 60 * 1000) {
      // Less than 24 hours
      setTimeout(() => {
        this.showLocalNotification(title, {
          body,
          tag: `reminder-${id}`,
          data: { type: 'reminder', id },
          actions: [
            { action: 'complete', title: 'Mark Complete' },
            { action: 'snooze', title: 'Snooze 10 min' },
          ],
        });
      }, delay);
    }
  }

  /**
   * Show exercise reminder notification
   */
  async showExerciseReminder(): Promise<void> {
    await this.showLocalNotification('Time for your exercises!', {
      body: "Let's keep your recovery on track. Your daily session is ready.",
      tag: 'exercise-reminder',
      data: { type: 'exercise', action: 'start-session' },
      actions: [
        { action: 'start', title: 'Start Now' },
        { action: 'later', title: 'Remind Later' },
      ],
    });
  }

  /**
   * Show medication reminder notification
   */
  async showMedicationReminder(medicationName: string): Promise<void> {
    await this.showLocalNotification('Medication Reminder', {
      body: `Time to take your ${medicationName}`,
      tag: 'medication-reminder',
      data: { type: 'medication', name: medicationName },
      actions: [
        { action: 'taken', title: 'Mark as Taken' },
        { action: 'snooze', title: 'Snooze' },
      ],
    });
  }

  /**
   * Show water intake reminder
   */
  async showWaterReminder(): Promise<void> {
    await this.showLocalNotification('Stay Hydrated!', {
      body: 'Remember to drink water. Staying hydrated helps with recovery.',
      tag: 'water-reminder',
      data: { type: 'water' },
      actions: [{ action: 'done', title: 'Done' }],
    });
  }

  /**
   * Show session completion notification
   */
  async showSessionComplete(
    exercisesCompleted: number,
    formScore: number
  ): Promise<void> {
    await this.showLocalNotification('Great workout!', {
      body: `You completed ${exercisesCompleted} exercises with ${formScore}% form score. Keep it up!`,
      tag: 'session-complete',
      data: { type: 'session-complete' },
    });
  }

  // ==================
  // PRIVATE METHODS
  // ==================

  private async saveSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    const json = subscription.toJSON();
    if (!json.keys) return;

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      {
        onConflict: 'endpoint',
      }
    );

    if (error) {
      console.error('Failed to save push subscription:', error);
    }
  }

  private async removeSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to remove push subscription:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationService();

// React hook for push notifications
import { useState, useEffect, useCallback } from 'react';

export function usePushNotifications(userId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supported = pushNotifications.isSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(pushNotifications.getPermissionStatus());
      pushNotifications.init().then(() => {
        setIsSubscribed(pushNotifications.isSubscribed());
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!userId) return false;

    setIsLoading(true);
    const success = await pushNotifications.subscribe(userId);
    setIsSubscribed(success);
    setPermission(pushNotifications.getPermissionStatus());
    setIsLoading(false);
    return success;
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    if (!userId) return false;

    setIsLoading(true);
    const success = await pushNotifications.unsubscribe(userId);
    setIsSubscribed(!success);
    setIsLoading(false);
    return success;
  }, [userId]);

  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      await pushNotifications.showLocalNotification(title, options);
    },
    []
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    showNotification,
  };
}
