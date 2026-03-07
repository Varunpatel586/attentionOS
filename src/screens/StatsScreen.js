import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import BottomNavbar from '../components/BottomNavbar';
import Icon from 'react-native-vector-icons/Ionicons';
import AttentionOSBridge from '../utils/AttentionOSBridge';

const StatsScreen = () => {
  const user = auth().currentUser;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    plannedTasks: 0,
    completedTasks: 0,
    focusedTime: 0, // in seconds
    scrollingTime: 0, // in seconds
    productiveSlot: '10–12 AM',
    contextSwitches: 0,
    bigThreeProgress: [],
  });

  useEffect(() => {
    if (!user) return;

    loadAllStats();

    // Refresh every minute
    const interval = setInterval(() => {
      loadAllStats();
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const loadAllStats = async () => {
    try {
      await Promise.all([
        loadUserStats(),
        loadTodoStats(),
        loadBigThreeProgress(),
        loadScrollingTime(),
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    const userDoc = await firestore().collection('users').doc(user.uid).get();

    const data = userDoc.data();
    if (data) {
      setStats(prev => ({
        ...prev,
        focusedTime: data.todayFocusTime || 0,
        contextSwitches: data.todayContextSwitches || 0,
        productiveSlot: data.mostProductiveSlot || '10–12 AM',
      }));
    }
  };

  const loadTodoStats = async () => {
    if (!user) return;

    const todosSnapshot = await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('todos')
      .get();

    const todos = todosSnapshot.docs.map(doc => doc.data());
    const completed = todos.filter(todo => todo.completed).length;
    const total = todos.length;

    setStats(prev => ({
      ...prev,
      plannedTasks: total,
      completedTasks: completed,
    }));
  };

  const loadBigThreeProgress = async () => {
    if (!user) return;

    const bigThreeSnapshot = await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('bigThree')
      .get();

    const progress = bigThreeSnapshot.docs.map(doc => {
      const data = doc.data();
      // Assuming each task has a 'progress' field (0-100)
      // If not available, calculate based on completion status
      return data.progress || (data.completed ? 100 : 0);
    });

    setStats(prev => ({
      ...prev,
      bigThreeProgress: progress.slice(0, 3), // Only take first 3
    }));
  };

  const loadScrollingTime = async () => {
    try {
      const scrollTime = await AttentionOSBridge.getTodayDistractedTime();
      setStats(prev => ({
        ...prev,
        scrollingTime: Math.floor(scrollTime / 1000), // Convert ms to seconds
      }));
    } catch (error) {
      console.error('Error loading scrolling time:', error);
    }
  };

  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateTimeLost = () => {
    // Estimate: each context switch costs ~7 minutes
    const minutesLost = Math.floor(stats.contextSwitches * 7);

    if (minutesLost < 60) {
      return `~${minutesLost} mins lost`;
    }
    const hours = Math.floor(minutesLost / 60);
    const mins = minutesLost % 60;
    return `~${hours}h ${mins}m lost`;
  };

  const calculatePotentialTasks = () => {
    const scrollMinutes = Math.floor(stats.scrollingTime / 60);
    const savingMinutes = Math.floor(scrollMinutes * 0.3); // 30% reduction
    const tasksGained = Math.floor(savingMinutes / 30); // Assuming 30 mins per task
    return tasksGained || 1;
  };

  const handleReset = () => {
    // Implement reset logic - could reset daily stats
    if (!user) return;

    firestore().collection('users').doc(user.uid).update({
      todayFocusTime: 0,
      todayContextSwitches: 0,
    });

    // Reset todos completion
    firestore()
      .collection('users')
      .doc(user.uid)
      .collection('todos')
      .get()
      .then(snapshot => {
        const batch = firestore().batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { completed: false });
        });
        return batch.commit();
      });
  };

  if (!user || loading) {
    return (
      <SafeAreaProvider style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#262626" />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Insights</Text>
        </View>

        {/* 1. Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryBar} />

          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              You planned {stats.plannedTasks} task
              {stats.plannedTasks !== 1 ? 's' : ''} and completed{' '}
              {stats.completedTasks}
            </Text>

            <Text style={styles.summaryText}>
              You spent {formatTime(stats.focusedTime)} focused and{' '}
              {formatTime(stats.scrollingTime)} scrolling.
            </Text>

            <Text style={styles.summaryText}>
              Your most productive slot was {stats.productiveSlot}.
            </Text>
          </View>
        </View>

        {/* 2. Context Switches & Big Three Row */}
        <View style={styles.cardsRow}>
          {/* Context Switches Card */}
          <View style={{ width: 110 }}>
            <View style={styles.contextWrapper}>
              {/* Dark Card */}
              <View style={styles.contextCard}>
                <Text style={styles.contextNumber}>
                  {stats.contextSwitches}
                </Text>
                <Text style={styles.contextLabel}>Context</Text>
                <Text style={styles.contextLabel}>switches</Text>
                <Text style={styles.contextToday}>Today</Text>
              </View>

              {/* OUTSIDE pill */}
              <View style={styles.contextPill}>
                <Text style={styles.contextPillText}>
                  {calculateTimeLost()}
                </Text>
              </View>
            </View>
          </View>

          {/* Big Three Card */}
          <View style={styles.bigThreeCard}>
            <View style={styles.bigThreeHeader}>
              <Text style={styles.bigThreeTitle}>Big Three</Text>
              <TouchableOpacity>
                <Icon name="open-outline" size={18} color="#262626" />
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              {stats.bigThreeProgress.length > 0
                ? stats.bigThreeProgress.map((progress, index) => (
                    <View key={index} style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { width: `${progress}%` }]}
                      />
                    </View>
                  ))
                : // Show empty progress bars if no data
                  [0, 1, 2].map(index => (
                    <View key={index} style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  ))}
            </View>
          </View>
        </View>

        {/* 3. Tips Row */}
        <View style={styles.tipsRow}>
          {/* Tip Card */}
          <View style={styles.tipCard}>
            <View style={styles.tipAccentBarContainer}>
              <View style={styles.tipAccentBar} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipText}>
                If you reduced scrolling by 30 minutes, you could complete{' '}
                {calculatePotentialTasks()}
                {calculatePotentialTasks() === 1
                  ? ' extra task'
                  : ' extra tasks'}{' '}
                daily.
              </Text>
            </View>
          </View>

          {/* More Tips Button (Dark Card) */}
          <TouchableOpacity style={styles.moreTipsButton}>
            <Icon
              name="chevron-forward"
              size={50}
              color="#FFF"
              style={styles.arrowIcon}
            />
            <Text style={styles.moreTipsText}>More Tips</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navbar */}
      <BottomNavbar />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 19,
  },
  headerTitle: {
    color: 'black',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '500',
    wordWrap: 'break-word',
  },

  // --- 1. Summary Card ---
  summaryCard: {
    backgroundColor: '#E9E5DC',
    borderRadius: 20,
    paddingVertical: 20,
    paddingRight: 20,
    paddingLeft: 14,
    flexDirection: 'row',
    marginBottom: 16,
  },

  accentBarContainer: {
    width: 10,
    marginRight: 12,
    alignItems: 'center',
  },
  accentBar: {
    width: 7,
    backgroundColor: '#262626',
    flex: 1,
    borderRadius: 3,
  },

  summaryBar: {
    width: 6,
    backgroundColor: '#262626',
    borderRadius: 6,
    marginRight: 14,
  },

  summaryContent: {
    flex: 1,
  },

  summaryText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#262626',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },

  summaryTextLast: {
    marginBottom: 0,
  },

  // --- 2. Context Switches & Big Three Row ---
  cardsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 15,
  },

  contextWrapper: {
    alignItems: 'center',
  },

  contextCard: {
    backgroundColor: '#262626',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contextNumber: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: 35,
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
  },

  contextLabel: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 'normal',
  },

  contextToday: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
    marginTop: 6,
  },

  contextLost: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
    backgroundColor: '#E9E5DC',
  },

  contextPill: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },

  contextPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#262626',
    fontFamily: 'Poppins',
  },

  // Big Three Card
  bigThreeCard: {
    flex: 1,
    backgroundColor: '#E9E5DC',
    borderRadius: 18,
    padding: 16,
  },

  bigThreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  bigThreeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    fontFamily: 'Poppins',
  },

  openIcon: {
    padding: 5,
  },

  // Progress Bars
  progressContainer: {
    gap: 10,
    paddingHorizontal: 6,
  },

  progressTrack: {
    height: 25,
    backgroundColor: '#BFBFBD',
    borderRadius: 20,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#262626',
    borderRadius: 20,
  },

  // --- 3. Tips Row ---
  tipsRow: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 15,
  },
  tipCard: {
    flex: 1,
    backgroundColor: '#E9E5DC',
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 158,
  },
  tipAccentBarContainer: {
    width: 10,
    marginRight: 12,
    alignItems: 'center',
  },

  tipAccentBar: {
    flex: 1,
    width: 6,
    backgroundColor: '#262626',
    borderRadius: 6,
    marginRight: 14,
  },
  tipContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tipText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: 'Poppins',
    wordWrap: 'break-word',
  },
  moreTipsButton: {
    width: 115,
    minHeight: 158,
    backgroundColor: '#262626',
    borderRadius: 17,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 60,
    fontWeight: '100',
    color: '#FFF',
    marginBottom: 0,
  },
  moreTipsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },

  // --- 4. Reset Button ---
  resetButton: {
    backgroundColor: '#262626',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: 'center',
  },
  resetText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
});

export default StatsScreen;
