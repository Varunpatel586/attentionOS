import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BottomNavbar from '../components/BottomNavbar';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
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

  // --- Modal & Task States ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const timerService = TimerService.getInstance();

  /* ---------------- TIMER SERVICE SUBSCRIPTION ---------------- */

  useEffect(() => {
    timerService.initialize();

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

  /* ---------------- CHANGE TASK LOGIC & MODAL ---------------- */

  const openTaskModal = async () => {
    setIsModalVisible(true);
    setIsLoadingTasks(true);

    try {
      const user = auth().currentUser;
      if (!user) return;

      // Fetching tasks from the 'todos' sub-collection (adjust if using 'bigThree')
      const snapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('todos')
        .get();

      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks for modal:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleSelectTask = task => {
    if (timerState.isRunning && timerState.activeTask?.id !== task.id) {
      // Timer is running, ask for confirmation
      Alert.alert(
        'Switch Task?',
        `You are currently working on "${
          timerState.activeTask?.title || 'a task'
        }". Do you want to switch to "${task.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            style: 'destructive',
            onPress: () => actuallySwitchTask(task),
          },
        ],
        { cancelable: true },
      );
    } else {
      // Timer not running, just switch it
      actuallySwitchTask(task);
    }
  };

  const actuallySwitchTask = async task => {
    setIsModalVisible(false); // Close the modal
    const user = auth().currentUser;
    if (!user) return;

    try {
      const batch = firestore().batch();

      // 1. Mark current task as inactive (if one exists)
      if (timerState.activeTask?.id) {
        const oldTaskRef = firestore()
          .collection('users')
          .doc(user.uid)
          .collection('todos')
          .doc(timerState.activeTask.id);
        batch.update(oldTaskRef, { active: false });
      }

      // 2. Mark new task as active
      const newTaskRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('todos')
        .doc(task.id);
      batch.update(newTaskRef, { active: true });

      await batch.commit();

      // Note: Because TimerService is listening to Firestore,
      // the activeTask in your UI should automatically update once the batch commits!
    } catch (error) {
      console.error('Error switching active task:', error);
    }
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
                ? timerState.activeTask.category || 'Focus Task'
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

        {/* Change Task Button */}
        <TouchableOpacity
          style={styles.changeTaskButton}
          onPress={openTaskModal}
          activeOpacity={0.7}
        >
          <Text style={styles.changeTaskButtonText}>Change task</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Local Task Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Task</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            {isLoadingTasks ? (
              <ActivityIndicator
                size="large"
                color="#262626"
                style={{ marginTop: 20 }}
              />
            ) : tasks.length === 0 ? (
              <Text style={styles.emptyTasksText}>No tasks found.</Text>
            ) : (
              <FlatList
                data={tasks}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalTaskItem,
                      timerState.activeTask?.id === item.id &&
                        styles.modalTaskItemActive,
                    ]}
                    onPress={() => handleSelectTask(item)}
                  >
                    <View>
                      <Text
                        style={[
                          styles.modalTaskTitle,
                          timerState.activeTask?.id === item.id &&
                            styles.modalTaskTitleActive,
                        ]}
                      >
                        {item.title}
                      </Text>
                      {item.category && (
                        <Text style={styles.modalTaskCategory}>
                          {item.category}
                        </Text>
                      )}
                    </View>
                    {timerState.activeTask?.id === item.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#FFF"
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

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
    marginBottom: 20,
  },
  distractionPill: {
    backgroundColor: '#262626',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 35,
  },
  distractionBtnText: { color: '#FFF', fontWeight: '600', fontSize: 18 },
  distractionCountText: { fontSize: 24, fontWeight: '800', marginRight: 15 },

  changeTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#262626',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  changeTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F2EFE9',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingBottom: 40,
    paddingTop: 25,
    maxHeight: '75%', // Leaves some room at the top of the screen
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#262626',
  },
  emptyTasksText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  modalTaskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E9E5DC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginBottom: 12,
  },
  modalTaskItemActive: {
    backgroundColor: '#262626',
  },
  modalTaskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
  },
  modalTaskTitleActive: {
    color: '#FFF',
  },
  modalTaskCategory: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});

export default TimerScreen;
