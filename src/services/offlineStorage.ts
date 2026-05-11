/**
 * Offline Storage Service using IndexedDB
 * Stores generated videos, sessions, and user data for offline access
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { GeneratedVideo, Session, ExerciseRecord, HealthReminder } from '../types/database';

// Database schema
interface CATSDatabase extends DBSchema {
  videos: {
    key: string;
    value: {
      id: string;
      data: GeneratedVideo;
      videoBlob?: Blob;
      thumbnailBlob?: Blob;
      syncStatus: 'synced' | 'pending' | 'failed';
      lastModified: number;
    };
    indexes: {
      'by-sync-status': string;
      'by-exercise-type': string;
    };
  };
  sessions: {
    key: string;
    value: {
      id: string;
      data: Partial<Session>;
      exerciseRecords: Partial<ExerciseRecord>[];
      syncStatus: 'synced' | 'pending' | 'failed';
      lastModified: number;
    };
    indexes: {
      'by-sync-status': string;
      'by-date': number;
    };
  };
  reminders: {
    key: string;
    value: {
      id: string;
      data: HealthReminder;
      syncStatus: 'synced' | 'pending' | 'failed';
      lastModified: number;
    };
    indexes: {
      'by-sync-status': string;
      'by-active': string;
    };
  };
  userProfile: {
    key: string;
    value: {
      id: string;
      data: Record<string, unknown>;
      lastModified: number;
    };
  };
  pendingActions: {
    key: number;
    value: {
      id?: number;
      action: 'create' | 'update' | 'delete';
      table: string;
      data: Record<string, unknown>;
      createdAt: number;
      retryCount: number;
    };
  };
}

const DB_NAME = 'cats-offline';
const DB_VERSION = 1;

class OfflineStorageService {
  private db: IDBPDatabase<CATSDatabase> | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initDatabase();
    await this.initPromise;
  }

  private async initDatabase(): Promise<void> {
    this.db = await openDB<CATSDatabase>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Videos store
        if (!db.objectStoreNames.contains('videos')) {
          const videosStore = db.createObjectStore('videos', { keyPath: 'id' });
          videosStore.createIndex('by-sync-status', 'syncStatus');
          videosStore.createIndex('by-exercise-type', 'data.exercise_type');
        }

        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('by-sync-status', 'syncStatus');
          sessionsStore.createIndex('by-date', 'lastModified');
        }

        // Reminders store
        if (!db.objectStoreNames.contains('reminders')) {
          const remindersStore = db.createObjectStore('reminders', { keyPath: 'id' });
          remindersStore.createIndex('by-sync-status', 'syncStatus');
          remindersStore.createIndex('by-active', 'data.is_active');
        }

        // User profile store
        if (!db.objectStoreNames.contains('userProfile')) {
          db.createObjectStore('userProfile', { keyPath: 'id' });
        }

        // Pending actions store (for offline mutations)
        if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
  }

  // ==================
  // VIDEO OPERATIONS
  // ==================

  async saveVideo(video: GeneratedVideo, videoBlob?: Blob, thumbnailBlob?: Blob): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('videos', {
      id: video.id,
      data: video,
      videoBlob,
      thumbnailBlob,
      syncStatus: 'synced',
      lastModified: Date.now(),
    });
  }

  async getVideo(id: string): Promise<GeneratedVideo | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const record = await this.db.get('videos', id);
    return record?.data;
  }

  async getVideoWithBlobs(id: string): Promise<{
    video: GeneratedVideo;
    videoBlob?: Blob;
    thumbnailBlob?: Blob;
  } | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const record = await this.db.get('videos', id);
    if (!record) return undefined;

    return {
      video: record.data,
      videoBlob: record.videoBlob,
      thumbnailBlob: record.thumbnailBlob,
    };
  }

  async getAllVideos(): Promise<GeneratedVideo[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const records = await this.db.getAll('videos');
    return records.map((r) => r.data);
  }

  async deleteVideo(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete('videos', id);
  }

  // ==================
  // SESSION OPERATIONS
  // ==================

  async saveSession(
    session: Partial<Session>,
    exerciseRecords: Partial<ExerciseRecord>[] = [],
    syncStatus: 'synced' | 'pending' = 'synced'
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = session.id || crypto.randomUUID();
    await this.db.put('sessions', {
      id,
      data: { ...session, id },
      exerciseRecords,
      syncStatus,
      lastModified: Date.now(),
    });
  }

  async getSession(id: string): Promise<{
    session: Partial<Session>;
    exerciseRecords: Partial<ExerciseRecord>[];
  } | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const record = await this.db.get('sessions', id);
    if (!record) return undefined;

    return {
      session: record.data,
      exerciseRecords: record.exerciseRecords,
    };
  }

  async getRecentSessions(limit = 10): Promise<Partial<Session>[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const records = await this.db.getAllFromIndex('sessions', 'by-date');
    return records
      .sort((a, b) => b.lastModified - a.lastModified)
      .slice(0, limit)
      .map((r) => r.data);
  }

  async getPendingSessions(): Promise<string[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const records = await this.db.getAllFromIndex('sessions', 'by-sync-status', 'pending');
    return records.map((r) => r.id);
  }

  async markSessionSynced(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const record = await this.db.get('sessions', id);
    if (record) {
      record.syncStatus = 'synced';
      await this.db.put('sessions', record);
    }
  }

  // ==================
  // REMINDER OPERATIONS
  // ==================

  async saveReminder(reminder: HealthReminder): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('reminders', {
      id: reminder.id,
      data: reminder,
      syncStatus: 'synced',
      lastModified: Date.now(),
    });
  }

  async getReminders(): Promise<HealthReminder[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const records = await this.db.getAll('reminders');
    return records.map((r) => r.data);
  }

  async getActiveReminders(): Promise<HealthReminder[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const records = await this.db.getAll('reminders');
    return records.filter((r) => r.data.is_active).map((r) => r.data);
  }

  async deleteReminder(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete('reminders', id);
  }

  // ==================
  // USER PROFILE
  // ==================

  async saveUserProfile(userId: string, profile: Record<string, unknown>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('userProfile', {
      id: userId,
      data: profile,
      lastModified: Date.now(),
    });
  }

  async getUserProfile(userId: string): Promise<Record<string, unknown> | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const record = await this.db.get('userProfile', userId);
    return record?.data;
  }

  // ==================
  // PENDING ACTIONS (for offline mutations)
  // ==================

  async addPendingAction(
    action: 'create' | 'update' | 'delete',
    table: string,
    data: Record<string, unknown>
  ): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = await this.db.add('pendingActions', {
      action,
      table,
      data,
      createdAt: Date.now(),
      retryCount: 0,
    });

    return id;
  }

  async getPendingActions(): Promise<Array<{
    id: number;
    action: 'create' | 'update' | 'delete';
    table: string;
    data: Record<string, unknown>;
    createdAt: number;
    retryCount: number;
  }>> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return this.db.getAll('pendingActions');
  }

  async removePendingAction(id: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete('pendingActions', id);
  }

  async incrementRetryCount(id: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const action = await this.db.get('pendingActions', id);
    if (action) {
      action.retryCount += 1;
      await this.db.put('pendingActions', action);
    }
  }

  // ==================
  // UTILITIES
  // ==================

  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(
      ['videos', 'sessions', 'reminders', 'userProfile', 'pendingActions'],
      'readwrite'
    );

    await Promise.all([
      tx.objectStore('videos').clear(),
      tx.objectStore('sessions').clear(),
      tx.objectStore('reminders').clear(),
      tx.objectStore('userProfile').clear(),
      tx.objectStore('pendingActions').clear(),
      tx.done,
    ]);
  }

  async getStorageUsage(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return { used: 0, available: 0 };
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();

// Initialize on import
offlineStorage.init().catch(console.error);
