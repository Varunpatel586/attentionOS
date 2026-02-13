import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BottomNavbar from '../components/BottomNavbar';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const POMODORO_FOCUS = 25 * 60; // 25 min
const POMODORO_BREAK = 5 * 60; // 5 min

const TimerScreen = () => {
  const [activeTab, setActiveTab] = useState('Pomodoro');
  const [distractions, setDistractions] = useState(0);

  const [seconds, setSeconds] = useState(POMODORO_FOCUS);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const [activeTask, setActiveTask] = useState(null);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  /* ---------------- ACTIVE TASK LISTENER ---------------- */

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('bigThree')
      .where('active', '==', true)
      .onSnapshot(snapshot => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setActiveTask({ id: doc.id, ...doc.data() });
        } else {
          setActiveTask(null);
          setIsRunning(false); // stop timer if no task
        }
      });

    return unsubscribe;
  }, []);

  /* ---------------- UPDATE FOCUS TIME IN FIREBASE ---------------- */

  const updateFocusTime = async () => {
    const user = auth().currentUser;
    if (!user) return;

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      const currentFocusTime = userDoc.data()?.todayFocusTime || 0;

      // Increment by 1 second
      await userRef.update({
        todayFocusTime: currentFocusTime + 1,
      });
    } catch (error) {
      console.error('Error updating focus time:', error);
    }
  };

  /* ---------------- TIMER ENGINE ---------------- */

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (activeTab === 'Pomodoro') {
          // Only increment focus time during focus sessions (not breaks)
          if (!isBreak) {
            updateFocusTime();
          }

          if (prev === 0) {
            const nextIsBreak = !isBreak;
            setIsBreak(nextIsBreak);
            return nextIsBreak ? POMODORO_BREAK : POMODORO_FOCUS;
          }
          return prev - 1;
        } else {
          // Infinite mode - always counting focus time
          updateFocusTime();
          return prev + 1;
        }
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, activeTab, isBreak]);

  /* ---------------- CONTROLS ---------------- */

  const toggleTimer = () => {
    if (activeTab === 'Pomodoro' && !activeTask) return;
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSeconds(activeTab === 'Pomodoro' ? POMODORO_FOCUS : 0);
  };

  const switchTab = tab => {
    setActiveTab(tab);
    setIsRunning(false);
    setIsBreak(false);
    setSeconds(tab === 'Pomodoro' ? POMODORO_FOCUS : 0);
  };

  /* ---------------- DISTRACTION TRACKING ---------------- */

  const handleDistraction = async () => {
    setDistractions(d => d + 1);

    const user = auth().currentUser;
    if (!user) return;

    try {
      const userRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      const currentSwitches = userDoc.data()?.todayContextSwitches || 0;

      await userRef.update({
        todayContextSwitches: currentSwitches + 1,
      });
    } catch (error) {
      console.error('Error updating context switches:', error);
    }
  };

  /* ---------------- TIME FORMAT ---------------- */

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaProvider style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['Pomodoro', 'Infinite'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => switchTab(tab)}
              style={styles.tabItem}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer */}
        <View style={styles.timerDisplay}>
          <View style={styles.timeUnit}>
            <Text style={styles.timerNumber}>{minutes}</Text>
            <Text style={styles.timerLabel}>M</Text>
          </View>
          <View style={styles.timeUnit}>
            <Text style={styles.timerNumber}>{secs}</Text>
            <Text style={styles.timerLabel}>S</Text>
          </View>
        </View>

        {/* Pomodoro Phase */}
        {activeTab === 'Pomodoro' && (
          <Text style={styles.phaseText}>
            {isBreak ? 'Break Time' : 'Focus Time'}
          </Text>
        )}

        {/* Controls */}
        <View style={styles.controlsPill}>
          <TouchableOpacity onPress={toggleTimer}>
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={28}
              color="#FFF"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={resetTimer}>
            <Ionicons name="refresh" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Active Task */}
        <View style={styles.taskContainer}>
          <View style={styles.taskCard}>
            <Text style={styles.taskTitleText}>
              {activeTask ? activeTask.title : 'No active task'}
            </Text>
            <Text style={styles.taskGroupText}>
              {activeTask ? activeTask.category : 'Select a task'}
            </Text>
          </View>
        </View>

        {/* Distraction */}
        <View style={styles.distractionRow}>
          <TouchableOpacity
            style={styles.distractionPill}
            onPress={handleDistraction}
          >
            <Text style={styles.distractionBtnText}>I got distracted!</Text>
          </TouchableOpacity>
          <Text style={styles.distractionCountText}>{distractions} times</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavbar />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EFE9' },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 40,
  },

  tabContainer: { flexDirection: 'row', gap: 30, marginBottom: 60 },
  tabItem: { alignItems: 'center' },
  tabText: { fontSize: 18, color: '#999', fontWeight: '500' },
  activeTabText: { color: '#000', fontWeight: '700' },
  activeTabIndicator: {
    marginTop: 6,
    width: '100%',
    height: 4,
    backgroundColor: '#262626',
    borderRadius: 2,
  },

  timerDisplay: { flexDirection: 'row', marginBottom: 50 },
  timeUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginHorizontal: 5,
  },
  timerNumber: { fontSize: 100, fontWeight: '800', color: '#262626' },
  timerLabel: { fontSize: 24, fontWeight: '700', marginLeft: 4 },

  phaseText: { marginBottom: 20, fontWeight: '600' },

  controlsPill: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 40,
    gap: 25,
    marginBottom: 60,
  },

  taskContainer: { width: '100%', marginBottom: 20 },
  taskCard: {
    backgroundColor: '#262626',
    borderRadius: 20,
    padding: 20,
  },
  taskTitleText: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  taskGroupText: { fontSize: 14, color: '#BFBFBF', marginTop: 4 },

  distractionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#E9E5DC',
    padding: 8,
    borderRadius: 40,
  },
  distractionPill: {
    backgroundColor: '#262626',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 35,
  },
  distractionBtnText: { color: '#FFF', fontWeight: '600' },
  distractionCountText: { fontSize: 24, fontWeight: '800' },
});

export default TimerScreen;
