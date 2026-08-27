import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { submitReport } from './api';

const QUEUE_KEY = 'pending_reports';

export interface QueuedReport {
  id: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

class OfflineQueue {
  private isSyncing = false;
  private listeners: ((count: number) => void)[] = [];

  constructor() {
    // Listen for network changes and auto-sync
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isSyncing) {
        this.syncAll();
      }
    });
  }

  /**
   * Add a report to the offline queue
   */
  async enqueue(report: any): Promise<string> {
    const id = `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const queued: QueuedReport = {
      id,
      data: report,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    const existing = await this.getQueue();
    existing.push(queued);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
    this.notifyListeners(existing.filter((r) => r.status === 'pending').length);
    return id;
  }

  /**
   * Get all queued reports
   */
  async getQueue(): Promise<QueuedReport[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  /**
   * Get count of pending reports
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter((r) => r.status === 'pending').length;
  }

  /**
   * Sync all pending reports to the server
   */
  async syncAll(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };

    const state = await NetInfo.fetch();
    if (!state.isConnected) return { synced: 0, failed: 0 };

    this.isSyncing = true;
    const queue = await this.getQueue();
    const pending = queue.filter((r) => r.status === 'pending');

    let synced = 0;
    let failed = 0;

    for (const report of pending) {
      try {
        report.status = 'syncing';
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        await submitReport(report.data);
        report.status = 'synced';
        synced++;
      } catch (error) {
        report.retryCount++;
        report.status = report.retryCount >= 3 ? 'failed' : 'pending';
        failed++;
      }
    }

    // Clean up synced items
    const remaining = queue.filter((r) => r.status !== 'synced');
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

    this.isSyncing = false;
    this.notifyListeners(remaining.filter((r) => r.status === 'pending').length);

    return { synced, failed };
  }

  /**
   * Retry a specific failed report
   */
  async retryReport(id: string): Promise<boolean> {
    const queue = await this.getQueue();
    const report = queue.find((r) => r.id === id);
    if (!report) return false;

    try {
      report.status = 'syncing';
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      await submitReport(report.data);
      report.status = 'synced';
      const remaining = queue.filter((r) => r.status !== 'synced');
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      this.notifyListeners(remaining.filter((r) => r.status === 'pending').length);
      return true;
    } catch (error) {
      report.retryCount++;
      report.status = 'pending';
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return false;
    }
  }

  /**
   * Remove a report from the queue
   */
  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const remaining = queue.filter((r) => r.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    this.notifyListeners(remaining.filter((r) => r.status === 'pending').length);
  }

  /**
   * Clear entire queue
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
    this.notifyListeners(0);
  }

  /**
   * Subscribe to pending count changes
   */
  onPendingCountChange(callback: (count: number) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(count: number) {
    this.listeners.forEach((l) => l(count));
  }
}

export default new OfflineQueue();
