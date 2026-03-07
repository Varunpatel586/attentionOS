import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: Date;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
}

export interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  type: 'focus' | 'scroll';
  userId: string;
}

export interface UserStats {
  todayFocusTime: number; // seconds
  todayScrollTime: number; // seconds
  weeklyFocusTime: number; // seconds
  weeklyScrollTime: number; // seconds
  currentTimerSeconds: number;
  isTimerRunning: boolean;
  lastUpdated: Date;
  timerState?: any; // Timer state object
  todayContextSwitches?: number; // Number of context switches today
}

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  stats: UserStats;
  tasks: Task[];
  createdAt: Date;
}

class FirebaseService {
  private currentUser: any = null;
  private unsubscribeFunctions: (() => void)[] = [];

  constructor() {
    // Listen for auth changes
    auth().onAuthStateChanged(user => {
      this.currentUser = user;
      if (user) {
        this.initializeUserData(user.uid);
      } else {
        this.cleanup();
      }
    });
  }

  /**
   * Initialize user data if it doesn't exist
   */
  private async initializeUserData(uid: string): Promise<void> {
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();

      if (!userDoc.exists) {
        // Create initial user data
        const initialData: UserData = {
          uid,
          email: this.currentUser?.email || '',
          displayName: this.currentUser?.displayName || '',
          stats: {
            todayFocusTime: 0,
            todayScrollTime: 0,
            weeklyFocusTime: 0,
            weeklyScrollTime: 0,
            currentTimerSeconds: 0,
            isTimerRunning: false,
            lastUpdated: new Date(),
          },
          tasks: this.getSampleTasks(),
          createdAt: new Date(),
        };

        await firestore().collection('users').doc(uid).set(initialData);
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  }

  /**
   * Get sample tasks for initial setup
   */
  private getSampleTasks(): Task[] {
    const now = new Date();
    return [
      {
        id: '1',
        title: 'Complete project documentation',
        done: false,
        createdAt: now,
        dueDate: now,
        priority: 'high',
      },
      {
        id: '2',
        title: 'Review pull requests',
        done: false,
        createdAt: now,
        dueDate: now,
        priority: 'medium',
      },
      {
        id: '3',
        title: 'Update dependencies',
        done: true,
        createdAt: now,
        dueDate: now,
        priority: 'low',
      },
    ];
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): any {
    return this.currentUser;
  }

  /**
   * Sign in anonymously (for demo purposes)
   */
  async signInAnonymously(): Promise<string> {
    try {
      const result = await auth().signInAnonymously();
      return result.user.uid;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  }

  /**
   * Get user data from Firestore
   */
  async getUserData(): Promise<UserData | null> {
    if (!this.currentUser) return null;

    try {
      const userDoc = await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .get();

      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;

        // Ensure stats object exists
        if (!data.stats) {
          data.stats = {
            todayFocusTime: 0,
            todayScrollTime: 0,
            weeklyFocusTime: 0,
            weeklyScrollTime: 0,
            currentTimerSeconds: 0,
            isTimerRunning: false,
            lastUpdated: new Date(),
          };
        }

        // Convert Firestore timestamps to Date objects
        if (data.stats?.lastUpdated) {
          const timestamp = data.stats.lastUpdated as any;
          data.stats.lastUpdated = timestamp.toDate
            ? timestamp.toDate()
            : timestamp instanceof Date
            ? timestamp
            : new Date();
        } else if (!data.stats?.lastUpdated) {
          data.stats.lastUpdated = new Date();
        }
        if (data.createdAt) {
          const timestamp = data.createdAt as any;
          data.createdAt = timestamp.toDate
            ? timestamp.toDate()
            : timestamp instanceof Date
            ? timestamp
            : new Date();
        }
        // Convert task timestamps
        data.tasks = (data.tasks || []).map(task => {
          const createdAtTimestamp = task.createdAt as any;
          const dueDateTimestamp = task.dueDate as any;
          return {
            ...task,
            createdAt: createdAtTimestamp?.toDate
              ? createdAtTimestamp.toDate()
              : createdAtTimestamp instanceof Date
              ? createdAtTimestamp
              : new Date(),
            dueDate: dueDateTimestamp?.toDate
              ? dueDateTimestamp.toDate()
              : dueDateTimestamp instanceof Date
              ? dueDateTimestamp
              : dueDateTimestamp,
          };
        });
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Update user stats
   */
  async updateStats(stats: Partial<UserStats>): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      console.log('📝 Updating Firebase stats:', stats);

      await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .set(
          {
            stats: {
              ...stats,
              lastUpdated: new Date(),
            },
          },
          { merge: true },
        );

      console.log('✅ Firebase stats updated successfully');
    } catch (error) {
      console.error('❌ Error updating stats:', error);
      throw error;
    }
  }

  /**
   * Update focus/scroll times for today
   */
  async updateTodayTimes(
    focusSeconds: number,
    scrollSeconds: number,
  ): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .set(
          {
            stats: {
              todayFocusTime: focusSeconds,
              todayScrollTime: scrollSeconds,
              lastUpdated: new Date(),
            },
          },
          { merge: true },
        );
    } catch (error) {
      console.error('Error updating today times:', error);
      throw error;
    }
  }

  /**
   * Update timer state
   */
  async updateTimer(seconds: number, running: boolean): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .set(
          {
            stats: {
              currentTimerSeconds: seconds,
              isTimerRunning: running,
              lastUpdated: new Date(),
            },
          },
          { merge: true },
        );
    } catch (error) {
      console.error('Error updating timer:', error);
      throw error;
    }
  }

  /**
   * Get today's tasks
   */
  async getTodayTasks(): Promise<Task[]> {
    if (!this.currentUser) return [];

    try {
      // Get tasks from the todos sub-collection
      const todosSnapshot = await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('todos')
        .get();

      const tasks: Task[] = [];
      todosSnapshot.forEach(doc => {
        const taskData = doc.data();
        tasks.push({
          id: doc.id,
          title: taskData.title || 'Untitled Task',
          done: taskData.done || false,
          createdAt: taskData.createdAt?.toDate?.() || new Date(),
          dueDate: taskData.dueDate?.toDate?.(),
          priority: taskData.priority,
        });
      });

      console.log('📝 Fetched tasks from todos sub-collection:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('Error getting today tasks:', error);
      return [];
    }
  }

  /**
   * Update tasks
   */
  async updateTasks(tasks: Task[]): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      // Update user's tasks array directly
      await firestore().collection('users').doc(this.currentUser.uid).update({
        tasks: tasks,
      });

      console.log('✅ Tasks updated successfully:', tasks.length);
    } catch (error) {
      console.error('Error updating tasks:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time user data changes
   */
  subscribeToUserData(
    callback: (userData: UserData | null) => void,
  ): () => void {
    if (!this.currentUser) {
      callback(null);
      return () => {};
    }

    const unsubscribe = firestore()
      .collection('users')
      .doc(this.currentUser.uid)
      .onSnapshot(doc => {
        if (doc.exists()) {
          const data = doc.data() as UserData;

          // Ensure stats object exists
          if (!data.stats) {
            data.stats = {
              todayFocusTime: 0,
              todayScrollTime: 0,
              weeklyFocusTime: 0,
              weeklyScrollTime: 0,
              currentTimerSeconds: 0,
              isTimerRunning: false,
              lastUpdated: new Date(),
            };
          }

          // Convert Firestore timestamps to Date objects
          if (data.stats?.lastUpdated) {
            const timestamp = data.stats.lastUpdated as any;
            data.stats.lastUpdated = timestamp.toDate
              ? timestamp.toDate()
              : timestamp instanceof Date
              ? timestamp
              : new Date();
          } else if (!data.stats?.lastUpdated) {
            data.stats.lastUpdated = new Date();
          }
          if (data.createdAt) {
            const timestamp = data.createdAt as any;
            data.createdAt = timestamp.toDate
              ? timestamp.toDate()
              : timestamp instanceof Date
              ? timestamp
              : new Date();
          }
          // Convert task timestamps
          data.tasks = (data.tasks || []).map(task => {
            const createdAtTimestamp = task.createdAt as any;
            const dueDateTimestamp = task.dueDate as any;
            return {
              ...task,
              createdAt: createdAtTimestamp?.toDate
                ? createdAtTimestamp.toDate()
                : createdAtTimestamp instanceof Date
                ? createdAtTimestamp
                : new Date(),
              dueDate: dueDateTimestamp?.toDate
                ? dueDateTimestamp.toDate()
                : dueDateTimestamp instanceof Date
                ? dueDateTimestamp
                : dueDateTimestamp,
            };
          });
          callback(data);
        } else {
          callback(null);
        }
      });

    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Update a specific field in user stats
   */
  async updateField(fieldPath: string, value: any): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      const updateData: any = {};
      const fieldParts = fieldPath.split('.');

      if (fieldParts.length === 2) {
        updateData[fieldParts[0]] = {
          [fieldParts[1]]: value,
          lastUpdated: new Date(),
        };
      } else {
        updateData[fieldPath] = value;
      }

      await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .set(updateData, { merge: true });

      console.log(`✅ Field ${fieldPath} updated successfully:`, value);
    } catch (error) {
      console.error(`❌ Error updating field ${fieldPath}:`, error);
      throw error;
    }
  }

  /**
   * Update timer state with full state object
   */
  async updateTimerState(timerState: any): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .set(
          {
            stats: {
              currentTimerSeconds: timerState.seconds,
              isTimerRunning: timerState.isRunning,
              timerState: timerState,
              lastUpdated: new Date(),
            },
          },
          { merge: true },
        );

      console.log('✅ Timer state updated successfully:', timerState);
    } catch (error) {
      console.error('❌ Error updating timer state:', error);
      throw error;
    }
  }

  /**
   * Subscribe to active tasks (bigThree with active=true)
   */
  subscribeToActiveTasks(callback: (tasks: any[]) => void): () => void {
    if (!this.currentUser) {
      callback([]);
      return () => {};
    }

    const unsubscribe = firestore()
      .collection('users')
      .doc(this.currentUser.uid)
      .collection('bigThree')
      .where('active', '==', true)
      .onSnapshot(snapshot => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(tasks);
      });

    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Clean up subscriptions
   */
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }

  /**
   * Calculate weekly stats from sessions
   */
  async calculateWeeklyStats(): Promise<{
    focusTime: number;
    scrollTime: number;
  }> {
    if (!this.currentUser) return { focusTime: 0, scrollTime: 0 };

    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const sessionsSnapshot = await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('sessions')
        .where('startTime', '>=', weekStart)
        .get();

      let focusTime = 0;
      let scrollTime = 0;

      sessionsSnapshot.docs.forEach(doc => {
        const session = doc.data() as FocusSession;
        if (session.type === 'focus' && session.duration) {
          focusTime += session.duration;
        } else if (session.type === 'scroll' && session.duration) {
          scrollTime += session.duration;
        }
      });

      return { focusTime, scrollTime };
    } catch (error) {
      console.error('Error calculating weekly stats:', error);
      return { focusTime: 0, scrollTime: 0 };
    }
  }

  /**
   * Add a focus/scroll session
   */
  async addSession(
    type: 'focus' | 'scroll',
    startTime: Date,
    endTime?: Date,
  ): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      const session: FocusSession = {
        id: firestore().collection('sessions').doc().id,
        startTime,
        endTime,
        duration: endTime
          ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
          : undefined,
        type,
        userId: this.currentUser.uid,
      };

      await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('sessions')
        .add(session);
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  }
}

export default new FirebaseService();
