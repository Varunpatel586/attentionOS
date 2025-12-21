import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomNavbar from '../components/BottomNavbar';

const POMODORO_FOCUS = 25 * 60; // 25 min
const POMODORO_BREAK = 5 * 60; // 5 min

const TimerScreen = () => {
  const [activeTab, setActiveTab] = useState('Pomodoro');
  const [distractions, setDistractions] = useState(3);

  const [seconds, setSeconds] = useState(POMODORO_FOCUS);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const intervalRef = useRef(null);

  /* ---------------- TIMER ENGINE ---------------- */

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        // Pomodoro countdown
        if (activeTab === 'Pomodoro') {
          if (prev === 0) {
            const nextIsBreak = !isBreak;
            setIsBreak(nextIsBreak);
            return nextIsBreak ? POMODORO_BREAK : POMODORO_FOCUS;
          }
          return prev - 1;
        }

        // Infinite count-up
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, activeTab, isBreak]);

  /* ---------------- TAB SWITCH HANDLING ---------------- */

  const switchTab = tab => {
    setActiveTab(tab);
    setIsRunning(false);
    setIsBreak(false);
    clearInterval(intervalRef.current);

    if (tab === 'Pomodoro') {
      setSeconds(POMODORO_FOCUS);
    } else {
      setSeconds(0);
    }
  };

  /* ---------------- CONTROLS ---------------- */

  const toggleTimer = () => setIsRunning(prev => !prev);

  const resetTimer = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setIsBreak(false);
    setSeconds(activeTab === 'Pomodoro' ? POMODORO_FOCUS : 0);
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
          <Text style={{ marginBottom: 20, fontWeight: '600' }}>
            {isBreak ? 'Break Time' : 'Focus Time'}
          </Text>
        )}

        {/* Controls */}
        <View style={styles.controlsPill}>
          <TouchableOpacity style={styles.controlIcon} onPress={toggleTimer}>
            <Icon name={isRunning ? 'pause' : 'play'} size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlIcon} onPress={resetTimer}>
            <Icon name="refresh" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Task Card (unchanged) */}
        <View style={styles.taskContainer}>
          <View style={styles.taskCard}>
            <Text style={styles.taskTitleText}>Task title</Text>
            <Text style={styles.taskGroupText}>Task group</Text>
          </View>
        </View>

        {/* Distraction */}
        <View style={styles.distractionRow}>
          <TouchableOpacity
            style={styles.distractionPill}
            onPress={() => setDistractions(d => d + 1)}
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
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 60,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },
  activeTabIndicator: {
    marginTop: 6,
    width: '100%',
    height: 4,
    backgroundColor: '#262626',
    borderRadius: 2,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 50,
  },
  timeUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginHorizontal: 5,
  },
  timerNumber: {
    fontSize: 100,
    fontWeight: '800',
    color: '#262626',
  },
  timerLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#262626',
    marginLeft: 4,
  },
  controlsPill: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 40,
    gap: 25,
    marginBottom: 60,
  },
  taskContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  taskCard: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 20,
    padding: 20,
    marginRight: 15,
  },
  taskTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  taskGroupText: {
    fontSize: 14,
    color: '#BFBFBF',
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distractionRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E9E5DC',
    padding: 8,
    borderRadius: 40,
    marginBottom: 20,
  },
  distractionPill: {
    backgroundColor: '#262626',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 35,
  },
  distractionBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  distractionCountText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#262626',
    marginRight: 20,
  },
  changeTaskPill: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 35,
    alignItems: 'center',
    gap: 10,
  },
  changeTaskText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimerScreen;
