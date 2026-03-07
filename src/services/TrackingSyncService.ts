import FirebaseService from './FirebaseService';
import AttentionOSBridge from '../utils/AttentionOSBridge';
import { WidgetUpdater } from '../utils/widgetUpdater';
import { DeviceEventEmitter } from 'react-native';
import TimerService from './TimerService';

class TrackingSyncService {
  private static instance: TrackingSyncService;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;
  private lastSyncScrollTime = 0;
  private lastSyncFocusTime = 0;
  private timerEventSubscriptions: any[] = [];

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

      // Initialize TimerService
      await TimerService.getInstance().initialize();

      // Set up timer event listeners
      this.setupTimerEventListeners();

      // Start periodic sync
      this.startPeriodicSync();

      // Initial sync
      await this.syncTrackingData();

      // Set up real-time Firebase updates for widgets
      this.setupRealtimeWidgetUpdates();

      this.isInitialized = true;
      console.log('TrackingSyncService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TrackingSyncService:', error);
    }
  }

  /**
   * Set up real-time Firebase updates for widgets
   */
  private setupRealtimeWidgetUpdates(): void {
    try {
      const unsubscribe = FirebaseService.subscribeToUserData(
        async userData => {
          if (userData) {
            console.log('🔔 Real-time Firebase update detected!');
            console.log('   Tasks in userData:', userData.tasks?.length || 0);
            if (userData.tasks && userData.tasks.length > 0) {
              console.log(
                '   Tasks:',
                userData.tasks.map(t => t.title).join(', '),
              );
            }
            await this.updateWidgets();
          }
        },
      );
      console.log('✅ Real-time widget updates enabled');

      // Store unsubscribe function in case we need to clean up later
      this.realtimeUnsubscribe = unsubscribe;
    } catch (error) {
      console.error('Failed to setup real-time widget updates:', error);
    }
  }

  private realtimeUnsubscribe: (() => void) | null = null;

  /**
   * Set up timer event listeners from widget
   */
  private setupTimerEventListeners(): void {
    // Listen for timer control events from widget
    const timerPauseSubscription = DeviceEventEmitter.addListener(
      'timerPause',
      () => {
        this.handleTimerControl('pause');
      },
    );

    const timerResumeSubscription = DeviceEventEmitter.addListener(
      'timerResume',
      () => {
        this.handleTimerControl('resume');
      },
    );

    const timerResetSubscription = DeviceEventEmitter.addListener(
      'timerReset',
      () => {
        this.handleTimerControl('reset');
      },
    );

    this.timerEventSubscriptions = [
      timerPauseSubscription,
      timerResumeSubscription,
      timerResetSubscription,
    ];

    console.log('Timer event listeners set up');
  }

  /**
   * Handle timer control events from widget
   */
  private async handleTimerControl(
    action: 'pause' | 'resume' | 'reset',
  ): Promise<void> {
    try {
      console.log('📱 Timer control event received:', action);

      // Use TimerService to handle the control
      await TimerService.getInstance().handleWidgetControl(action);

      console.log('✅ Timer control handled:', action);
    } catch (error) {
      console.error('❌ Error handling timer control:', error);
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

        // Update all widgets (including tasks) immediately after sync
        await this.updateWidgets();
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
      
      // Get timer state from TimerService
      const timerState = TimerService.getInstance().getState();

      console.log('🔥 Firebase data:', {
        hasUserData: !!userData,
        storedFocusTime: userData?.stats?.todayFocusTime,
        todayTasksLength: todayTasks.length,
        userDataTasksLength: userData?.tasks?.length,
        timerState: timerState,
        todayTasksArray: todayTasks,
        userDataTasks: userData?.tasks,
      });

      // Use todayTasks (from todos sub-collection) as primary source
      const tasksToUse = todayTasks;

      console.log('📝 Tasks to use for widget:', tasksToUse);

      const widgetTasks = tasksToUse.slice(0, 3).map(task => ({
        id: task.id,
        title: task.title,
        done: task.done,
      }));

      const result = {
        focus: userData?.stats?.todayFocusTime || 0,
        scroll: scrollSeconds,
        tasks: widgetTasks,
        timer: timerState.seconds,
        running: timerState.isRunning,
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
        console.log('📝 Tasks to send to widget:', widgetData.tasks);
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
   * Update tasks and refresh widgets
   */
  async updateTasks(tasks: any[]): Promise<void> {
    try {
      console.log('📝 Updating tasks:', tasks.length);

      await FirebaseService.updateTasks(tasks);

      // Update widgets with new tasks
      await this.updateWidgets();

      console.log('✅ Tasks updated and widgets refreshed');
    } catch (error) {
      console.error('❌ Error updating tasks:', error);
    }
  }

  /**
   * Force immediate task update and widget refresh
   */
  async forceUpdateTasks(): Promise<void> {
    console.log('🔄 Force updating tasks...');
    try {
      await this.updateWidgets();
      console.log('✅ Tasks force updated');
    } catch (error) {
      console.error('❌ Error force updating tasks:', error);
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
   * Send test widget data (for debugging)
   */
  async sendTestWidgetData(): Promise<void> {
    try {
      console.log('🧪 Sending test widget data...');
      const testData = {
        focus: 2 * 3600 + 28 * 60,
        scroll: 1 * 3600 + 40 * 60,
        tasks: [
          { id: '1', title: 'Complete project', done: false },
          { id: '2', title: 'Review code', done: false },
          { id: '3', title: 'Update documentation', done: false },
        ],
        timer: 16 * 60 + 44,
        running: false,
      };
      await WidgetUpdater.updateAllWidgets(testData);
      console.log('✅ Test data sent successfully');
    } catch (error) {
      console.error('❌ Failed to send test data:', error);
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

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Clean up timer event subscriptions
    this.timerEventSubscriptions.forEach(subscription => {
      subscription.remove();
    });
    this.timerEventSubscriptions = [];

    this.isInitialized = false;
    console.log('TrackingSyncService stopped');
  }
}

export default TrackingSyncService.getInstance();
