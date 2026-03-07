import FirebaseService from './FirebaseService';
import { WidgetUpdater } from '../utils/widgetUpdater';
import AttentionOSBridge from '../utils/AttentionOSBridge';

class WidgetSyncService {
  private static instance: WidgetSyncService;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): WidgetSyncService {
    if (!WidgetSyncService.instance) {
      WidgetSyncService.instance = new WidgetSyncService();
    }
    return WidgetSyncService.instance;
  }

  /**
   * Initialize the widget sync service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing WidgetSyncService...');

      // Initialize Firebase if not already done
      if (!FirebaseService.getCurrentUser()) {
        await FirebaseService.signInAnonymously();
      }

      // Start real-time sync
      this.startRealtimeSync();

      // Start periodic sync with native tracking
      this.startNativeTrackingSync();

      this.isInitialized = true;
      console.log('WidgetSyncService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WidgetSyncService:', error);
    }
  }

  /**
   * Start real-time Firebase sync
   */
  private startRealtimeSync(): void {
    FirebaseService.subscribeToUserData(async userData => {
      if (userData) {
        await this.updateWidgets(userData);
      }
    });
  }

  /**
   * Update widgets with user data
   */
  private async updateWidgets(userData: any): Promise<void> {
    try {
      // Get today's tasks (limit to 3 for widget)
      const todayTasks = await FirebaseService.getTodayTasks();
      const widgetTasks = todayTasks.slice(0, 3).map(task => ({
        id: task.id,
        title: task.title,
        done: task.done,
      }));

      // Calculate focus time (total day - distracted scrolling)
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const totalDaySeconds = Math.floor(
        (now.getTime() - dayStart.getTime()) / 1000,
      );
      const nativeScrollTime = await AttentionOSBridge.getTodayDistractedTime();
      const focusSeconds = Math.max(
        0,
        totalDaySeconds - Math.floor(nativeScrollTime / 1000),
      );

      // Get timer data with fallbacks
      const timerSeconds = userData?.stats?.currentTimerSeconds || 0;
      const timerRunning = userData?.stats?.isTimerRunning || false;

      // Update widgets
      await WidgetUpdater.updateAllWidgets({
        focus: focusSeconds,
        scroll: Math.floor(nativeScrollTime / 1000),
        tasks: widgetTasks,
        timer: timerSeconds,
        running: timerRunning,
      });

      console.log('Widgets updated with Firebase data');
    } catch (error) {
      console.error('Error updating widgets:', error);
    }
  }

  /**
   * Start periodic sync with native tracking data
   */
  private startNativeTrackingSync(): void {
    // Sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      try {
        const userData = await FirebaseService.getUserData();
        if (userData) {
          await this.updateWidgets(userData);
        } else {
          console.log('No user data available for sync');
        }
      } catch (error) {
        console.error('Error in periodic sync:', error);
      }
    }, 30000);

    // Initial sync after 2 seconds
    setTimeout(async () => {
      try {
        const userData = await FirebaseService.getUserData();
        if (userData) {
          await this.updateWidgets(userData);
        } else {
          console.log('No user data available for initial sync');
        }
      } catch (error) {
        console.error('Error in initial sync:', error);
      }
    }, 2000);
  }

  /**
   * Stop the sync service
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    FirebaseService.cleanup();
    this.isInitialized = false;
    console.log('WidgetSyncService stopped');
  }

  /**
   * Manual refresh
   */
  async refresh(): Promise<void> {
    try {
      const userData = await FirebaseService.getUserData();
      if (userData) {
        await this.updateWidgets(userData);
      } else {
        console.log('No user data available for refresh');
      }
    } catch (error) {
      console.error('Error refreshing widgets:', error);
    }
  }
}

export default WidgetSyncService.getInstance();
