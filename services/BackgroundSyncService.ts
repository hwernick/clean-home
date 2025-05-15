import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { StorageService } from './StorageService';

interface SyncQueueItem {
  key: string;
  retryCount: number;
  lastAttempt: number;
}

export class BackgroundSyncService {
  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRY_DELAY = 30 * 1000; // 30 seconds

  private static isSyncing = false;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static queue: SyncQueueItem[] = [];
  private static isProcessingQueue = false;

  static start() {
    // Listen for network changes
    NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && !this.isSyncing) {
        this.processQueue();
      }
    });

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      if (!this.isSyncing) {
        this.processQueue();
      }
    }, this.SYNC_INTERVAL);
  }

  static stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  static addToQueue(key: string) {
    // Check if item already exists in queue
    const existingItem = this.queue.find(item => item.key === key);
    if (existingItem) {
      existingItem.retryCount = 0;
      existingItem.lastAttempt = Date.now();
    } else {
      this.queue.push({
        key,
        retryCount: 0,
        lastAttempt: Date.now()
      });
    }

    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private static async processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0) return;

    this.isProcessingQueue = true;
    this.isSyncing = true;

    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return;
      }

      while (this.queue.length > 0) {
        const item = this.queue[0];
        const now = Date.now();
        const timeSinceLastAttempt = now - item.lastAttempt;

        // Check if we should retry this item
        if (item.retryCount > 0) {
          const delay = Math.min(
            this.RETRY_DELAY * Math.pow(2, item.retryCount - 1),
            this.MAX_RETRY_DELAY
          );

          if (timeSinceLastAttempt < delay) {
            // Skip this item for now
            this.queue.push(this.queue.shift()!);
            continue;
          }
        }

        try {
          await StorageService.syncWithServer(item.key);
          this.queue.shift(); // Remove successful item
        } catch (error) {
          console.error(`Error syncing ${item.key}:`, error);
          
          if (item.retryCount < this.MAX_RETRY_ATTEMPTS) {
            item.retryCount++;
            item.lastAttempt = now;
            this.queue.push(this.queue.shift()!); // Move to end of queue
          } else {
            this.queue.shift(); // Remove failed item after max retries
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
      this.isSyncing = false;
    }
  }
} 