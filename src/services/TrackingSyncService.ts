import FirebaseService from './FirebaseService';
import AttentionOSBridge from '../utils/AttentionOSBridge';
import { WidgetUpdater } from '../utils/widgetUpdater';

class TrackingSyncService {
  private static instance: TrackingSyncService;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;
  private lastSyncScrollTime = 0;
  private lastSyncFocusTime = 0;

  private constructor() {}

  static getInstance(): TrackingSyncService {
    if (!TrackingSyncService.instance) {
      TrackingSyncService.instance = new TrackingSyncService();
    }
    return TrackingSyncService.instance;
  }

  /**
   * Initialize the tracking sync service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing TrackingSyncService...');

      // Initialize Firebase if not already done
      if (!FirebaseService.getCurrentUser()) {
        await FirebaseService.signInAnonymously();
      }

      // Start periodic sync
      this.startPeriodicSync();

      // Initial sync
      await this.syncTrackingData();

      this.isInitialized = true;
      console.log('TrackingSyncService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TrackingSyncService:', error);
    }
  }

  /**
   * Start periodic sync with native tracking data
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      await this.syncTrackingData();
    }, 30000);
  }

  /**
   * Sync tracking data from native to Firebase
   */
  private async syncTrackingData(): Promise<void> {
    try {
      console.log('🔄 Starting tracking data sync...');

      // Get native tracking data
      const todayDistractedTime =
        await AttentionOSBridge.getTodayDistractedTime();
      const weeklyDistractedTime =
        await AttentionOSBridge.getWeeklyDistractedTime();

      const scrollSeconds = Math.floor(todayDistractedTime / 1000);
      const weeklyScrollSeconds = Math.floor(weeklyDistractedTime / 1000);

      console.log('📊 Native tracking data:', {
        todayDistractedTime,
        weeklyDistractedTime,
      });

      // Only sync if data has actually changed
      if (
        scrollSeconds === this.lastSyncScrollTime &&
        weeklyScrollSeconds === Math.floor(this.lastSyncFocusTime / 1000)
      ) {
        console.log('⏭️ Skipping sync - no data changes detected');
        return;
      }

      this.lastSyncScrollTime = scrollSeconds;
      this.lastSyncFocusTime = weeklyScrollSeconds * 1000;

      // Get current user data
      const userData = await FirebaseService.getUserData();

      console.log('👤 Firebase user data exists:', !!userData);

      if (userData) {
        // Update Firebase with tracking data (only scroll time and timer)
        // Don't recalculate focus time based on elapsed time
        await FirebaseService.updateStats({
          todayScrollTime: scrollSeconds,
          weeklyScrollTime: weeklyScrollSeconds,
          currentTimerSeconds: userData.stats.currentTimerSeconds,
          isTimerRunning: userData.stats.isTimerRunning,
          lastUpdated: new Date(),
        });

        console.log('✅ Synced tracking data to Firebase:', {
          scrollTime: scrollSeconds,
        });

        // Update widgets immediately after sync
        await WidgetUpdater.updateFocusScroll(
          userData.stats.todayFocusTime,
          scrollSeconds,
        );
      }
    } catch (error) {
      console.error('❌ Error syncing tracking data:', error);
    }
  }

  /**
   * Get current tracking data for widgets
   */
  async getWidgetData(): Promise<any> {
    try {
      console.log('📊 Getting widget data...');

      // Get native scrolling data only
      const todayDistractedTime =
        await AttentionOSBridge.getTodayDistractedTime();
      const scrollSeconds = Math.floor(todayDistractedTime / 1000);

      console.log('⏰ Native distracted time:', todayDistractedTime);

      // Get Firebase data for focus time (stored value), tasks and timer
      const userData = await FirebaseService.getUserData();
      const todayTasks = await FirebaseService.getTodayTasks();

      console.log('🔥 Firebase data:', {
        hasUserData: !!userData,
        storedFocusTime: userData?.stats?.todayFocusTime,
        taskCount: todayTasks.length,
        timerSeconds: userData?.stats?.currentTimerSeconds,
        timerRunning: userData?.stats?.isTimerRunning,
      });

      const widgetTasks = todayTasks.slice(0, 3).map(task => ({
        id: task.id,
        title: task.title,
        done: task.done,
      }));

      const result = {
        focus: userData?.stats?.todayFocusTime || 0,
        scroll: scrollSeconds,
        tasks: widgetTasks,
        timer: userData?.stats?.currentTimerSeconds || 0,
        running: userData?.stats?.isTimerRunning || false,
      };

      console.log('📱 Final widget data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error getting widget data:', error);
      return null;
    }
  }

  /**
   * Update widgets with current tracking data
   */
  async updateWidgets(): Promise<void> {
    try {
      console.log('🔧 Updating widgets...');
      const widgetData = await this.getWidgetData();

      if (widgetData) {
        console.log('📱 Widget data prepared:', widgetData);
        await WidgetUpdater.updateAllWidgets(widgetData);
        console.log('✅ Widgets updated successfully');
      } else {
        console.log('❌ No widget data available');
      }
    } catch (error) {
      console.error('❌ Error updating widgets:', error);
    }
  }

  /**
   * Force immediate sync and widget update
   */
  async forceSync(): Promise<void> {
    console.log('⚡ Force sync initiated...');
    try {
      await this.syncTrackingData();
      await this.updateWidgets();
      console.log('⚡ Force sync completed');
    } catch (error) {
      console.error('❌ Force sync failed:', error);
    }
  }

  /**
   * Stop the sync service
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isInitialized = false;
    console.log('TrackingSyncService stopped');
  }
}

export default TrackingSyncService.getInstance();
