import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import NetInfo from '@react-native-community/netinfo';
import LZString from 'lz-string';

interface StorageItem {
  id: string;
  data: any;
  lastModified: number;
  syncStatus: 'pending' | 'synced' | 'error';
}

export class StorageService {
  private static cache: Map<string, { item: StorageItem; timestamp: number }> = new Map();
  private static readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private static readonly BATCH_SIZE = 10;

  private static async getAuthToken(): Promise<string> {
    // Implement your token retrieval logic here
    return 'your-auth-token';
  }

  private static compressData(data: any): string {
    const jsonString = JSON.stringify(data);
    return LZString.compress(jsonString);
  }

  private static decompressData(compressed: string): any {
    const jsonString = LZString.decompress(compressed);
    return jsonString ? JSON.parse(jsonString) : null;
  }

  // Save data locally first, then sync with server
  static async save(key: string, data: any): Promise<boolean> {
    try {
      const timestamp = Date.now();
      const compressedData = this.compressData(data);
      
      const item: StorageItem = {
        id: key,
        data: compressedData,
        lastModified: timestamp,
        syncStatus: 'pending'
      };

      // Update cache
      this.cache.set(key, { item, timestamp });

      // Save to AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(item));
      
      // Try to sync with server
      await this.syncWithServer(key);
      
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  // Load data with priority on local storage
  static async load(key: string): Promise<any> {
    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TIMEOUT) {
        return this.decompressData(cached.item.data);
      }

      // Try local storage
      const localData = await AsyncStorage.getItem(key);
      if (localData) {
        const item: StorageItem = JSON.parse(localData);
        
        // Update cache
        this.cache.set(key, { item, timestamp: Date.now() });

        // Check if online
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          const serverData = await this.fetchFromServer(key);
          if (serverData && serverData.lastModified > item.lastModified) {
            // Server has newer data, update local
            await this.save(key, serverData.data);
            return this.decompressData(serverData.data);
          }
        }
        
        return this.decompressData(item.data);
      }
      
      // If no local data, try server
      const serverData = await this.fetchFromServer(key);
      if (serverData) {
        // Save to local storage for future offline access
        await this.save(key, serverData.data);
        return this.decompressData(serverData.data);
      }
      
      return null;
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  }

  // Sync pending changes with server
  static async syncWithServer(key: string): Promise<void> {
    try {
      const localData = await AsyncStorage.getItem(key);
      if (!localData) return;
      
      const item: StorageItem = JSON.parse(localData);
      if (item.syncStatus === 'synced') return;
      
      // Send to server
      const response = await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          key,
          data: item.data,
          lastModified: item.lastModified
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync with server');
      }
      
      // Update sync status
      item.syncStatus = 'synced';
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error syncing with server:', error);
      // Update sync status to error
      const localData = await AsyncStorage.getItem(key);
      if (localData) {
        const item: StorageItem = JSON.parse(localData);
        item.syncStatus = 'error';
        await AsyncStorage.setItem(key, JSON.stringify(item));
      }
    }
  }

  // Fetch data from server
  private static async fetchFromServer(key: string): Promise<StorageItem | null> {
    try {
      const response = await fetch(`${API_URL}/api/data/${key}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        id: key,
        data: data.data,
        lastModified: data.lastModified,
        syncStatus: 'synced'
      };
    } catch (error) {
      console.error('Error fetching from server:', error);
      return null;
    }
  }

  // Delete data from both local and server
  static async delete(key: string): Promise<boolean> {
    try {
      // Delete from local storage
      await AsyncStorage.removeItem(key);
      
      // Delete from server
      const response = await fetch(`${API_URL}/api/data/${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting data:', error);
      return false;
    }
  }

  // Get sync status for a key
  static async getSyncStatus(key: string): Promise<'pending' | 'synced' | 'error' | null> {
    try {
      const localData = await AsyncStorage.getItem(key);
      if (!localData) return null;
      
      const item: StorageItem = JSON.parse(localData);
      return item.syncStatus;
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }

  // Get all pending items that need to be synced
  static async getPendingItems(): Promise<StorageItem[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const allItems = await AsyncStorage.multiGet(keys);
      
      return allItems
        .map(([key, value]) => value && JSON.parse(value))
        .filter((item): item is StorageItem => 
          item !== null && item.syncStatus === 'pending'
        );
    } catch (error) {
      console.error('Error getting pending items:', error);
      return [];
    }
  }

  // Sync pending changes with server in batches
  static async syncPendingChanges(): Promise<void> {
    try {
      const pendingItems = await this.getPendingItems();
      if (pendingItems.length === 0) return;

      // Process in batches
      for (let i = 0; i < pendingItems.length; i += this.BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + this.BATCH_SIZE);
        await Promise.all(batch.map(item => this.syncWithServer(item.id)));
      }
    } catch (error) {
      console.error('Error syncing pending changes:', error);
    }
  }
} 