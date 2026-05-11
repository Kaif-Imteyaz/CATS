/**
 * Data Sync Service
 * Synchronizes local IndexedDB data with Supabase
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { offlineStorage } from './offlineStorage';
import type { Session, ExerciseRecord, GeneratedVideo, HealthReminder } from '../types/database';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class DataSyncService {
  private syncInProgress = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Add a listener for sync status changes
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach((callback) => callback(status));
  }

  /**
   * Check if sync is available
   */
  canSync(): boolean {
    return offlineStorage.isOnline() && isSupabaseConfigured();
  }

  /**
   * Sync all pending data with Supabase
   */
  async syncAll(userId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    if (!this.canSync()) {
      return { success: false, synced: 0, failed: 0, errors: ['Cannot sync: offline or not configured'] };
    }

    this.syncInProgress = true;
    this.notifyListeners('syncing');

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Sync pending sessions
      const sessionResult = await this.syncSessions(userId);
      result.synced += sessionResult.synced;
      result.failed += sessionResult.failed;
      result.errors.push(...sessionResult.errors);

      // Sync pending actions
      const actionsResult = await this.syncPendingActions();
      result.synced += actionsResult.synced;
      result.failed += actionsResult.failed;
      result.errors.push(...actionsResult.errors);

      // Pull latest data from server
      await this.pullLatestData(userId);

      result.success = result.failed === 0;
      this.notifyListeners(result.success ? 'success' : 'error');
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.notifyListeners('error');
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * Sync pending sessions to Supabase
   */
  private async syncSessions(userId: string): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    const pendingIds = await offlineStorage.getPendingSessions();

    for (const sessionId of pendingIds) {
      try {
        const data = await offlineStorage.getSession(sessionId);
        if (!data) continue;

        // Insert session
        const { error: sessionError } = await supabase.from('sessions').upsert({
          ...data.session,
          user_id: userId,
        });

        if (sessionError) {
          result.failed++;
          result.errors.push(`Session ${sessionId}: ${sessionError.message}`);
          continue;
        }

        // Insert exercise records
        if (data.exerciseRecords.length > 0) {
          const records = data.exerciseRecords.map((r) => ({
            ...r,
            session_id: sessionId,
          }));

          const { error: recordsError } = await supabase
            .from('exercise_records')
            .upsert(records);

          if (recordsError) {
            result.errors.push(`Session ${sessionId} records: ${recordsError.message}`);
          }
        }

        await offlineStorage.markSessionSynced(sessionId);
        result.synced++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return result;
  }

  /**
   * Sync pending actions (generic mutations)
   */
  private async syncPendingActions(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    const actions = await offlineStorage.getPendingActions();

    for (const action of actions) {
      try {
        let error: Error | null = null;

        switch (action.action) {
          case 'create':
            const { error: createError } = await supabase
              .from(action.table)
              .insert(action.data);
            error = createError;
            break;

          case 'update':
            const { error: updateError } = await supabase
              .from(action.table)
              .update(action.data)
              .eq('id', action.data.id);
            error = updateError;
            break;

          case 'delete':
            const { error: deleteError } = await supabase
              .from(action.table)
              .delete()
              .eq('id', action.data.id);
            error = deleteError;
            break;
        }

        if (error) {
          // Increment retry count
          await offlineStorage.incrementRetryCount(action.id!);

          // If too many retries, remove the action
          if (action.retryCount >= 5) {
            await offlineStorage.removePendingAction(action.id!);
            result.errors.push(`Action ${action.id} removed after max retries`);
          }

          result.failed++;
        } else {
          await offlineStorage.removePendingAction(action.id!);
          result.synced++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Action ${action.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return result;
  }

  /**
   * Pull latest data from Supabase to local storage
   */
  private async pullLatestData(userId: string): Promise<void> {
    // Pull recent sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*, exercise_records(*)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (sessions) {
      for (const session of sessions) {
        await offlineStorage.saveSession(
          session,
          session.exercise_records || [],
          'synced'
        );
      }
    }

    // Pull reminders
    const { data: reminders } = await supabase
      .from('health_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (reminders) {
      for (const reminder of reminders) {
        await offlineStorage.saveReminder(reminder);
      }
    }

    // Pull generated videos
    const { data: videos } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (videos) {
      for (const video of videos) {
        await offlineStorage.saveVideo(video);
      }
    }

    // Pull user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      await offlineStorage.saveUserProfile(userId, profile);
    }
  }

  /**
   * Save a session (locally first, then sync if online)
   */
  async saveSession(
    userId: string,
    session: Partial<Session>,
    exerciseRecords: Partial<ExerciseRecord>[]
  ): Promise<string> {
    const sessionId = session.id || crypto.randomUUID();
    const fullSession = { ...session, id: sessionId, user_id: userId };

    // Always save locally first
    await offlineStorage.saveSession(
      fullSession,
      exerciseRecords,
      this.canSync() ? 'synced' : 'pending'
    );

    // If online, sync immediately
    if (this.canSync()) {
      try {
        const { error } = await supabase.from('sessions').upsert(fullSession);

        if (!error && exerciseRecords.length > 0) {
          await supabase.from('exercise_records').upsert(
            exerciseRecords.map((r) => ({ ...r, session_id: sessionId }))
          );
        }

        if (error) {
          // Mark as pending for later sync
          await offlineStorage.saveSession(fullSession, exerciseRecords, 'pending');
        }
      } catch {
        // Mark as pending for later sync
        await offlineStorage.saveSession(fullSession, exerciseRecords, 'pending');
      }
    }

    return sessionId;
  }

  /**
   * Save a generated video
   */
  async saveGeneratedVideo(
    userId: string,
    video: Partial<GeneratedVideo>,
    videoBlob?: Blob,
    thumbnailBlob?: Blob
  ): Promise<string> {
    const videoId = video.id || crypto.randomUUID();
    const fullVideo = { ...video, id: videoId, user_id: userId } as GeneratedVideo;

    // Save locally
    await offlineStorage.saveVideo(fullVideo, videoBlob, thumbnailBlob);

    // Sync if online
    if (this.canSync()) {
      try {
        await supabase.from('generated_videos').upsert(fullVideo);
      } catch {
        // Already saved locally
      }
    }

    return videoId;
  }

  /**
   * Save a health reminder
   */
  async saveReminder(userId: string, reminder: Partial<HealthReminder>): Promise<string> {
    const reminderId = reminder.id || crypto.randomUUID();
    const fullReminder = { ...reminder, id: reminderId, user_id: userId } as HealthReminder;

    // Save locally
    await offlineStorage.saveReminder(fullReminder);

    // Sync if online
    if (this.canSync()) {
      try {
        await supabase.from('health_reminders').upsert(fullReminder);
      } catch {
        await offlineStorage.addPendingAction('create', 'health_reminders', fullReminder);
      }
    } else {
      await offlineStorage.addPendingAction('create', 'health_reminders', fullReminder);
    }

    return reminderId;
  }
}

// Export singleton instance
export const dataSync = new DataSyncService();

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    // Get current user and sync
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('Back online, syncing data...');
      await dataSync.syncAll(user.id);
    }
  });
}
