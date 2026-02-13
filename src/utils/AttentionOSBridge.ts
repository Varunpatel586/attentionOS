import { NativeModules } from 'react-native';

const { AttentionOSModule } = NativeModules;

export interface PermissionStatus {
  usageStats: boolean;
  accessibility: boolean;
  notifications: boolean;
}

/**
 * TypeScript wrapper for the AttentionOS Native Module.
 * Provides type-safe access to tracking functionality.
 */
class AttentionOSBridge {
  /**
   * Start tracking distracted scrolling.
   */
  startTracking(): void {
    AttentionOSModule.startTracking();
  }

  /**
   * Stop tracking distracted scrolling.
   */
  stopTracking(): void {
    AttentionOSModule.stopTracking();
  }

  /**
   * Get total distracted scrolling time for today.
   * @returns Promise resolving to total milliseconds
   */
  async getTodayDistractedTime(): Promise<number> {
    return await AttentionOSModule.getTodayDistractedTime();
  }

  /**
   * Get total distracted scrolling time for this week.
   * @returns Promise resolving to total milliseconds
   */
  async getWeeklyDistractedTime(): Promise<number> {
    return await AttentionOSModule.getWeeklyDistractedTime();
  }

  /**
   * Check all required permissions.
   * @returns Promise resolving to permission status object
   */
  async checkPermissions(): Promise<PermissionStatus> {
    return await AttentionOSModule.checkPermissions();
  }

  /**
   * Request Usage Stats permission (opens Settings).
   */
  requestUsageStatsPermission(): void {
    AttentionOSModule.requestUsageStatsPermission();
  }

  /**
   * Request Accessibility permission (opens Settings).
   */
  requestAccessibilityPermission(): void {
    AttentionOSModule.requestAccessibilityPermission();
  }

  /**
   * Request notification permission (Android 13+).
   */
  requestNotificationPermission(): void {
    AttentionOSModule.requestNotificationPermission();
  }

  /**
   * Check if the tracking service is currently running.
   * @returns Promise resolving to true if service is running, false otherwise
   */
  async isTrackingRunning(): Promise<boolean> {
    return await AttentionOSModule.isTrackingRunning();
  }

  /**
   * Format milliseconds to human-readable time string.
   * @param milliseconds Total milliseconds
   * @returns Formatted string (e.g., "1h 23m" or "45m")
   */
  formatTime(milliseconds: number): string {
    if (milliseconds === 0) {
      return '0m';
    }

    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

export default new AttentionOSBridge();
