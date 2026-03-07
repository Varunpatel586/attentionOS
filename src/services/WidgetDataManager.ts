import FirebaseService, { UserData, Task } from './FirebaseService';
import { WidgetUpdater } from '../utils/widgetUpdater';
import AttentionOSBridge from '../utils/AttentionOSBridge';

class WidgetDataManager {
  private isInitialized = false;
  private userData: UserData | null = null;
  private unsubscribeUserData: (() => void) | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private lastTimerUpdate = 0;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the widget data manager
   */
  private async initialize(): Promise<void> {
    try {
      // Sign in anonymously if not authenticated
      if (!FirebaseService.getCurrentUser()) {
        await FirebaseService.signInAnonymously();
      }

      // Subscribe to real-time user data changes
      this.subscribeToUserData();

      // Start timer updates
      this.startTimerUpdates();

      this.isInitialized = true;
      console.log('WidgetDataManager initialized');
    } catch (error) {
      console.error('Error initializing WidgetDataManager:', error);
    }
  }

  /**
   * Subscribe to real-time Firebase data changes
   */
  private subscribeToUserData(): void {
    this.unsubscribeUserData = FirebaseService.subscribeToUserData(userData => {
      this.userData = userData;
      if (userData) {
        this.updateWidgetsWithUserData(userData);
      }
    });
  }

  /**
   * Update all widgets with current user data
   */
  private async updateWidgetsWithUserData(userData: UserData): Promise<void> {
    try {
      // Get today's tasks (limit to 3 for widget)
      const todayTasks = await FirebaseService.getTodayTasks();
      const widgetTasks = todayTasks.slice(0, 3).map(task => ({
        id: task.id,
        title: task.title,
        done: task.done,
      }));

      // Update widgets with real data
      await WidgetUpdater.updateAllWidgets({
        focus: userData.stats.todayFocusTime,
        scroll: userData.stats.todayScrollTime,
        tasks: widgetTasks,
        timer: userData.stats.currentTimerSeconds,
        running: userData.stats.isTimerRunning,
      });

      console.log('Widgets updated with Firebase data');
    } catch (error) {
      console.error('Error updating widgets with user data:', error);
    }
  }

  /**
   * Start timer updates for real-time timer display
   */
  private startTimerUpdates(): void {
    // Update timer every second when running
    this.timerInterval = setInterval(() => {
      if (this.userData?.stats.isTimerRunning) {
        const now = Date.now();
        const timeSinceLastUpdate = (now - this.lastTimerUpdate) / 1000;

        if (timeSinceLastUpdate >= 1) {
          // Update every second
          this.lastTimerUpdate = now;
          this.updateTimerWidget();
        }
      }
    }, 1000);
  }

  /**
   * Update timer widget only
   */
  private async updateTimerWidget(): Promise<void> {
    if (!this.userData) return;

    try {
      // Increment timer if running
      let newTimerSeconds = this.userData.stats.currentTimerSeconds;
      if (this.userData.stats.isTimerRunning) {
        newTimerSeconds += 1;

        // Update Firebase
        await FirebaseService.updateTimer(newTimerSeconds, true);

        // Update local data
        this.userData.stats.currentTimerSeconds = newTimerSeconds;
      }

      // Update just the timer widget
      await WidgetUpdater.updateTimer(
        newTimerSeconds,
        this.userData.stats.isTimerRunning,
      );
    } catch (error) {
      console.error('Error updating timer widget:', error);
    }
  }

  /**
   * Update focus and scroll times from native tracking
   */
  async updateFocusScrollFromNative(): Promise<void> {
    try {
      // Get data from native AttentionOS bridge
      const todayDistractedTime =
        await AttentionOSBridge.getTodayDistractedTime();

      // Calculate focus time (total day time - distracted time)
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const totalDaySeconds = Math.floor(
        (now.getTime() - dayStart.getTime()) / 1000,
      );
      const focusSeconds = Math.max(0, totalDaySeconds - todayDistractedTime);

      // Update Firebase
      await FirebaseService.updateTodayTimes(
        focusSeconds,
        Math.floor(todayDistractedTime / 1000),
      );

      console.log('Updated focus/scroll times from native tracking');
    } catch (error) {
      console.error('Error updating focus/scroll from native:', error);
    }
  }

  /**
   * Manual refresh of all widgets
   */
  async refreshAllWidgets(): Promise<void> {
    try {
      if (this.userData) {
        await this.updateWidgetsWithUserData(this.userData);
      } else {
        // Fallback to refresh without data
        await WidgetUpdater.refreshAllWidgets();
      }
    } catch (error) {
      console.error('Error refreshing widgets:', error);
    }
  }

  /**
   * Update tasks from external source
   */
  async updateTasks(tasks: Task[]): Promise<void> {
    try {
      await FirebaseService.updateTasks(tasks);
      // Widget will be updated automatically through the subscription
    } catch (error) {
      console.error('Error updating tasks:', error);
    }
  }

  /**
   * Control timer (pause/resume/reset)
   */
  async controlTimer(action: 'pause' | 'resume' | 'reset'): Promise<void> {
    if (!this.userData) return;

    try {
      let newSeconds = this.userData.stats.currentTimerSeconds;
      let newRunning = this.userData.stats.isTimerRunning;

      switch (action) {
        case 'pause':
          newRunning = false;
          break;
        case 'resume':
          newRunning = true;
          break;
        case 'reset':
          newSeconds = 0;
          newRunning = false;
          break;
      }

      await FirebaseService.updateTimer(newSeconds, newRunning);
      // Widget will be updated automatically through the subscription
    } catch (error) {
      console.error('Error controlling timer:', error);
    }
  }

  /**
   * Get current widget data
   */
  async getCurrentWidgetData(): Promise<any> {
    if (this.userData) {
      const todayTasks = await FirebaseService.getTodayTasks();
      const widgetTasks = todayTasks.slice(0, 3).map(task => ({
        id: task.id,
        title: task.title,
        done: task.done,
      }));

      return {
        focus: this.userData.stats.todayFocusTime,
        scroll: this.userData.stats.todayScrollTime,
        tasks: widgetTasks,
        timer: this.userData.stats.currentTimerSeconds,
        running: this.userData.stats.isTimerRunning,
      };
    }
    return null;
  }

  /**
   * Setup periodic sync with native tracking data
   */
  setupNativeTrackingSync(): void {
    // Sync every 30 seconds
    setInterval(() => {
      this.updateFocusScrollFromNative();
    }, 30000);

    // Initial sync
    this.updateFocusScrollFromNative();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.unsubscribeUserData) {
      this.unsubscribeUserData();
      this.unsubscribeUserData = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    FirebaseService.cleanup();
    console.log('WidgetDataManager cleaned up');
  }

  /**
   * Check if manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.userData !== null;
  }

  /**
   * Get user data for debugging
   */
  getUserData(): UserData | null {
    return this.userData;
  }
}

export default new WidgetDataManager();
