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
          tasks: [],
          createdAt: new Date(),
        };

        await firestore().collection('users').doc(uid).set(initialData);
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tasksSnapshot = await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('tasks')
        .where('dueDate', '>=', today)
        .where('dueDate', '<', tomorrow)
        .orderBy('dueDate')
        .get();

      return tasksSnapshot.docs.map(doc => {
        const task = doc.data() as Task;
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
      const batch = firestore().batch();
      const userRef = firestore().collection('users').doc(this.currentUser.uid);

      // Clear existing tasks in subcollection
      const existingTasks = await userRef.collection('tasks').get();
      existingTasks.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add new tasks
      tasks.forEach(task => {
        const taskRef = userRef.collection('tasks').doc(task.id);
        batch.set(taskRef, task);
      });

      // Update user's tasks array
      batch.update(userRef, {
        tasks: tasks,
      });

      await batch.commit();
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
