import { NativeModules } from 'react-native';
import WidgetDataManager from '../services/WidgetDataManager';

const { WidgetBridge } = NativeModules;

export interface Task {
  id: string;
  title: string;
  done: boolean;
}

export interface WidgetData {
  focus: number;
  scroll: number;
  tasks: Task[];
  timer: number;
  running: boolean;
}

export class WidgetUpdater {
  /**
   * Update focus and scroll time widgets
   */
  static async updateFocusScroll(
    focusSeconds: number,
    scrollSeconds: number,
  ): Promise<void> {
    try {
      if (!WidgetBridge) {
        console.warn('WidgetBridge module not available');
        return;
      }

      console.log('📊 Updating focus/scroll widgets:', {
        focusSeconds,
        scrollSeconds,
      });

      await WidgetBridge.updateFocusScroll(focusSeconds, scrollSeconds);
      console.log('✅ Focus/scroll widgets updated:', {
        focusSeconds,
        scrollSeconds,
      });
    } catch (error) {
      console.error('❌ Failed to update focus/scroll widgets:', error);
    }
  }

  /**
   * Update tasks widget
   */
  static async updateTasks(tasks: Task[]): Promise<void> {
    try {
      if (!WidgetBridge) {
        console.warn('WidgetBridge module not available');
        return;
      }

      console.log('📝 Updating tasks widget with:', tasks);
      console.log('📝 Tasks count:', tasks.length);
      tasks.forEach((task, index) => {
        console.log(`   Task ${index}: ${task.title}`);
      });

      await WidgetBridge.updateTasks(tasks);
      console.log('Updated tasks widget:', tasks);
    } catch (error) {
      console.error('Failed to update tasks widget:', error);
    }
  }

  /**
   * Update timer widget
   */
  static async updateTimer(seconds: number, running: boolean): Promise<void> {
    try {
      if (!WidgetBridge) {
        console.warn('WidgetBridge module not available');
        return;
      }

      await WidgetBridge.updateTimer(seconds, running);
      console.log('Updated timer widget:', { seconds, running });
    } catch (error) {
      console.error('Failed to update timer widget:', error);
    }
  }

  /**
   * Update all widgets with provided data
   */
  static async updateAllWidgets(data: WidgetData): Promise<void> {
    try {
      console.log('🔄 WidgetUpdater.updateAllWidgets called with:', data);

      if (!WidgetBridge) {
        console.warn('❌ WidgetBridge module not available');
        return;
      }

      console.log('📱 Updating all widget types...');

      await Promise.all([
        this.updateFocusScroll(data.focus, data.scroll),
        this.updateTasks(data.tasks),
        this.updateTimer(data.timer, data.running),
      ]);

      console.log('✅ Updated all widgets successfully');
    } catch (error) {
      console.error('❌ Failed to update all widgets:', error);
    }
  }

  /**
   * Refresh all widgets (triggers update without changing data)
   */
  static async refreshAllWidgets(): Promise<void> {
    try {
      if (!WidgetBridge) {
        console.warn('WidgetBridge module not available');
        return;
      }

      await WidgetBridge.refreshWidgets();
      console.log('Refreshed all widgets');
    } catch (error) {
      console.error('Failed to refresh widgets:', error);
    }
  }

  /**
   * Get current widget data
   */
  static async getWidgetData(): Promise<WidgetData | null> {
    try {
      if (!WidgetBridge) {
        console.warn('WidgetBridge module not available');
        return null;
      }

      const data = await WidgetBridge.getWidgetData();
      return data as WidgetData;
    } catch (error) {
      console.error('Failed to get widget data:', error);
      return null;
    }
  }

  /**
   * Initialize widgets with Firebase data
   */
  static async initializeWithFirebase(): Promise<void> {
    try {
      // Initialize the WidgetDataManager which will handle Firebase sync
      if (!WidgetDataManager.isReady()) {
        console.log('Initializing WidgetDataManager with Firebase...');
        // The WidgetDataManager will automatically start syncing data
      }
    } catch (error) {
      console.error('Failed to initialize widgets with Firebase:', error);
    }
  }

  /**
   * Update widgets with real Firebase data
   */
  static async updateWithRealData(): Promise<void> {
    try {
      await WidgetDataManager.refreshAllWidgets();
    } catch (error) {
      console.error('Failed to update widgets with real data:', error);
    }
  }

  /**
   * Control timer through Firebase
   */
  static async controlTimer(
    action: 'pause' | 'resume' | 'reset',
  ): Promise<void> {
    try {
      await WidgetDataManager.controlTimer(action);
    } catch (error) {
      console.error('Failed to control timer:', error);
    }
  }

  /**
   * Sync with native tracking data
   */
  static async syncWithNativeTracking(): Promise<void> {
    try {
      await WidgetDataManager.updateFocusScrollFromNative();
    } catch (error) {
      console.error('Failed to sync with native tracking:', error);
    }
  }

  /**
   * Format seconds to human readable time (e.g., "2h 28m")
   */
  static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Format timer display (e.g., "16m 44s")
   */
  static formatTimer(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

// Export convenience functions for direct usage
export const updateWidgets = (data: WidgetData) => {
  return WidgetUpdater.updateAllWidgets(data);
};

export const updateFocusScroll = (focus: number, scroll: number) => {
  return WidgetUpdater.updateFocusScroll(focus, scroll);
};

export const updateTasks = (tasks: Task[]) => {
  return WidgetUpdater.updateTasks(tasks);
};

export const updateTimer = (seconds: number, running: boolean) => {
  return WidgetUpdater.updateTimer(seconds, running);
};

export const refreshWidgets = () => {
  return WidgetUpdater.refreshAllWidgets();
};

export const getWidgetData = () => {
  return WidgetUpdater.getWidgetData();
};

export const initializeFirebaseWidgets = () => {
  return WidgetUpdater.initializeWithFirebase();
};

export const updateWithRealData = () => {
  return WidgetUpdater.updateWithRealData();
};

export const controlTimer = (action: 'pause' | 'resume' | 'reset') => {
  return WidgetUpdater.controlTimer(action);
};

export const syncWithNativeTracking = () => {
  return WidgetUpdater.syncWithNativeTracking();
};

export default WidgetUpdater;
