import FirebaseService from './FirebaseService';
import { DeviceEventEmitter } from 'react-native';
import AttentionOSBridge from '../utils/AttentionOSBridge';
import BackgroundTimer from 'react-native-background-timer';
import firestore from '@react-native-firebase/firestore';

const POMODORO_FOCUS = 25 * 60; // 25 min
const POMODORO_BREAK = 5 * 60; // 5 min

export interface TimerState {
  activeTab: 'Pomodoro' | 'Infinite';
  seconds: number;
  isRunning: boolean;
  isBreak: boolean;
  distractions: number;
  activeTask: any;
}

class TimerService {
  private static instance: TimerService;
  private interval: any = null;
  private accumulatedFocusSeconds: number = 0; // Batch local tracking variable

  private state: TimerState = {
    activeTab: 'Pomodoro',
    seconds: POMODORO_FOCUS,
    isRunning: false,
    isBreak: false,
    distractions: 0,
    activeTask: null,
  };
  private listeners: ((state: TimerState) => void)[] = [];
  private activeTaskListener: (() => void) | null = null;

  private constructor() {}

  static getInstance(): TimerService {
    if (!TimerService.instance) {
      TimerService.instance = new TimerService();
    }
    return TimerService.instance;
  }

  /**
   * Initialize the timer service
   */
  async initialize(): Promise<void> {
    try {
      // Load timer state from Firebase
      await this.loadTimerState();

      // Set up active task listener
      this.setupActiveTaskListener();

      // Start timer engine if running
      if (this.state.isRunning) {
        this.startTimerEngine();
      }

      console.log('TimerService initialized');
    } catch (error) {
      console.error('Failed to initialize TimerService:', error);
    }
  }

  /**
   * Load timer state from Firebase
   */
  private async loadTimerState(): Promise<void> {
    try {
      const userData = await FirebaseService.getUserData();
      if (userData?.stats?.timerState) {
        this.state = {
          ...this.state,
          ...userData.stats.timerState,
        };
        console.log('Timer state loaded from Firebase:', this.state);
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
  }

  /**
   * Save timer state to Firebase
   */
  private async saveTimerState(): Promise<void> {
    try {
      await FirebaseService.updateTimerState(this.state);
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  }

  /**
   * Set up active task listener
   */
  private setupActiveTaskListener(): void {
    if (this.activeTaskListener) {
      this.activeTaskListener();
    }

    this.activeTaskListener = FirebaseService.subscribeToActiveTasks(tasks => {
      const activeTask = tasks.length > 0 ? tasks[0] : null;
      this.state.activeTask = activeTask;

      // Stop timer if no active task in Pomodoro mode
      if (
        this.state.activeTab === 'Pomodoro' &&
        !activeTask &&
        this.state.isRunning
      ) {
        this.toggleTimer();
      }

      this.notifyListeners();
    });
  }

  /**
   * Start the timer engine using BackgroundTimer
   */
  private startTimerEngine(): void {
    if (this.interval) {
      BackgroundTimer.clearInterval(this.interval);
    }

    this.interval = BackgroundTimer.setInterval(async () => {
      if (!this.state.isRunning) return;

      if (this.state.activeTab === 'Pomodoro') {
        // Accumulate focus time locally instead of writing to Firebase
        if (!this.state.isBreak) {
          this.accumulatedFocusSeconds++;
        }

        if (this.state.seconds === 0) {
          const nextIsBreak = !this.state.isBreak;
          this.state.isBreak = nextIsBreak;
          this.state.seconds = nextIsBreak ? POMODORO_BREAK : POMODORO_FOCUS;

          // Emit phase change event
          DeviceEventEmitter.emit('timerPhaseChanged', {
            isBreak: nextIsBreak,
            phase: nextIsBreak ? 'Break Time' : 'Focus Time',
          });
        } else {
          this.state.seconds--;
        }
      } else {
        // Infinite mode - always counting focus time
        this.accumulatedFocusSeconds++;
        this.state.seconds++;
      }

      // Save state and notify listeners
      await this.saveTimerState();
      this.notifyListeners();

      // Update widgets
      this.updateWidgets();
    }, 1000);
  }

  /**
   * Save accumulated focus time to Firebase (Batch Save)
   */
  private async saveAccumulatedFocusTime(): Promise<void> {
    if (this.accumulatedFocusSeconds <= 0) return;

    const secondsToSave = this.accumulatedFocusSeconds;
    this.accumulatedFocusSeconds = 0; // Reset immediately to prevent double counting

    try {
      // Safely increment both daily and weekly stats using FieldValue
      await Promise.all([
        FirebaseService.updateField(
          'stats.todayFocusTime',
          firestore.FieldValue.increment(secondsToSave),
        ),
        FirebaseService.updateField(
          'stats.weeklyFocusTime',
          firestore.FieldValue.increment(secondsToSave),
        ),
      ]);
      console.log(`✅ Saved ${secondsToSave}s of focus time to Firebase.`);
    } catch (error) {
      console.error('Error saving accumulated focus time:', error);
    }
  }

  /**
   * Update widgets with current timer state
   */
  private updateWidgets(): void {
    import('../utils/widgetUpdater')
      .then(({ WidgetUpdater }) => {
        WidgetUpdater.updateTimer(this.state.seconds, this.state.isRunning);
      })
      .catch(error => {
        console.error('Failed to update widgets:', error);
      });
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  /**
   * Toggle timer play/pause
   */
  async toggleTimer(): Promise<void> {
    if (this.state.activeTab === 'Pomodoro' && !this.state.activeTask) {
      console.log('Cannot start Pomodoro timer without active task');
      return;
    }

    this.state.isRunning = !this.state.isRunning;

    if (this.state.isRunning) {
      try {
        AttentionOSBridge.startTracking();
      } catch (error) {
        console.error('Failed to start native tracking from timer:', error);
      }
      this.startTimerEngine();
    } else {
      if (this.interval) {
        BackgroundTimer.clearInterval(this.interval);
        this.interval = null;
      }
      // Save any pending focus time when paused
      await this.saveAccumulatedFocusTime();
    }

    await this.saveTimerState();
    this.notifyListeners();
    this.updateWidgets();

    console.log('Timer toggled:', this.state.isRunning ? 'started' : 'paused');
  }

  /**
   * Reset timer
   */
  async resetTimer(): Promise<void> {
    this.state.isRunning = false;
    this.state.isBreak = false;
    this.state.seconds =
      this.state.activeTab === 'Pomodoro' ? POMODORO_FOCUS : 0;

    if (this.interval) {
      BackgroundTimer.clearInterval(this.interval);
      this.interval = null;
    }

    // Save pending focus time upon reset
    await this.saveAccumulatedFocusTime();

    await this.saveTimerState();
    this.notifyListeners();
    this.updateWidgets();

    console.log('Timer reset');
  }

  /**
   * Switch timer mode
   */
  async switchTab(tab: 'Pomodoro' | 'Infinite'): Promise<void> {
    this.state.activeTab = tab;
    this.state.isRunning = false;
    this.state.isBreak = false;
    this.state.seconds = tab === 'Pomodoro' ? POMODORO_FOCUS : 0;

    if (this.interval) {
      BackgroundTimer.clearInterval(this.interval);
      this.interval = null;
    }

    // Save pending focus time when switching tabs
    await this.saveAccumulatedFocusTime();

    await this.saveTimerState();
    this.notifyListeners();
    this.updateWidgets();

    console.log('Timer mode switched to:', tab);
  }

  /**
   * Handle distraction
   */
  async handleDistraction(): Promise<void> {
    this.state.distractions++;

    try {
      const userData = await FirebaseService.getUserData();
      const currentTodaySwitches = userData?.stats?.todayContextSwitches || 0;
      const currentWeeklySwitches = userData?.stats?.weeklyContextSwitches || 0;

      await Promise.all([
        FirebaseService.updateField(
          'stats.todayContextSwitches',
          currentTodaySwitches + 1,
        ),
        FirebaseService.updateField(
          'stats.weeklyContextSwitches',
          currentWeeklySwitches + 1,
        ),
      ]);

      await this.saveTimerState();
      this.notifyListeners();

      console.log('Distraction tracked:', this.state.distractions);
    } catch (error) {
      console.error('Error updating context switches:', error);
    }
  }

  /**
   * Get current timer state
   */
  getState(): TimerState {
    return { ...this.state };
  }

  /**
   * Subscribe to timer state changes
   */
  subscribe(listener: (state: TimerState) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.state });

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Control timer from widget
   */
  async handleWidgetControl(
    action: 'pause' | 'resume' | 'reset',
  ): Promise<void> {
    console.log('Widget control received:', action);

    switch (action) {
      case 'pause':
        if (this.state.isRunning) {
          await this.toggleTimer();
        }
        break;
      case 'resume':
        if (!this.state.isRunning) {
          await this.toggleTimer();
        }
        break;
      case 'reset':
        await this.resetTimer();
        break;
    }
  }

  /**
   * Format time display
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.interval) {
      BackgroundTimer.clearInterval(this.interval);
      this.interval = null;
    }

    // Save any pending focus time before cleanup
    this.saveAccumulatedFocusTime();

    if (this.activeTaskListener) {
      this.activeTaskListener();
      this.activeTaskListener = null;
    }

    this.listeners = [];
  }
}

export default TimerService;
