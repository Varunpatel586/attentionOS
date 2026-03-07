import React, { useState, useEffect } from 'react';
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
import TimerService from '../services/TimerService';

const POMODORO_FOCUS = 25 * 60; // 25 min
const POMODORO_BREAK = 5 * 60; // 5 min

const TimerScreen = () => {
  const [timerState, setTimerState] = useState({
    activeTab: 'Pomodoro',
    seconds: POMODORO_FOCUS,
    isRunning: false,
    isBreak: false,
    distractions: 0,
    activeTask: null,
  });

  const timerService = TimerService.getInstance();

  /* ---------------- TIMER SERVICE SUBSCRIPTION ---------------- */

  useEffect(() => {
    // Initialize timer service
    timerService.initialize();

    // Subscribe to timer state changes
    const unsubscribe = timerService.subscribe(state => {
      setTimerState(state);
    });

    return unsubscribe;
  }, []);

  /* ---------------- CONTROLS ---------------- */

  const toggleTimer = () => {
    timerService.toggleTimer();
  };

  const resetTimer = () => {
    timerService.resetTimer();
  };

  const switchTab = tab => {
    timerService.switchTab(tab);
  };

  /* ---------------- DISTRACTION TRACKING ---------------- */

  const handleDistraction = () => {
    timerService.handleDistraction();
  };

  /* ---------------- TIME FORMAT ---------------- */

  const minutes = String(Math.floor(timerState.seconds / 60)).padStart(2, '0');
  const secs = String(timerState.seconds % 60).padStart(2, '0');

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
                  timerState.activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              {timerState.activeTab === tab && (
                <View style={styles.activeTabIndicator} />
              )}
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
        {timerState.activeTab === 'Pomodoro' && (
          <Text style={styles.phaseText}>
            {timerState.isBreak ? 'Break Time' : 'Focus Time'}
          </Text>
        )}

        {/* Controls */}
        <View style={styles.controlsPill}>
          <TouchableOpacity onPress={toggleTimer}>
            <Ionicons
              name={timerState.isRunning ? 'pause' : 'play'}
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
              {timerState.activeTask
                ? timerState.activeTask.title
                : 'No active task'}
            </Text>
            <Text style={styles.taskGroupText}>
              {timerState.activeTask
                ? timerState.activeTask.category
                : 'Select a task'}
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
          <Text style={styles.distractionCountText}>
            {timerState.distractions} times
          </Text>
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

  phaseText: { marginTop: -40, marginBottom: 20, fontWeight: '600' },

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
    alignItems: 'center',
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
  distractionBtnText: { color: '#FFF', fontWeight: '600', fontSize: 18 },
  distractionCountText: { fontSize: 24, fontWeight: '800', marginRight: 15 },
});

export default TimerScreen;
