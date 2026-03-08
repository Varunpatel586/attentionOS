import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AttentionOSBridge from '../utils/AttentionOSBridge';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;
const CARD_MARGIN = 20;
const CARD_GAP = 12;
const CONTAINER_WIDTH = width - CARD_MARGIN * 2;
const PILL_WIDTH = (CONTAINER_WIDTH - CARD_GAP) / 2;

const HomeScreen = () => {
  const user = auth().currentUser;
  const navigation = useNavigation();

  const [userName, setUserName] = useState('');
  const [focusTime, setFocusTime] = useState(0);
  const [scrollTime, setScrollTime] = useState(0);
  const [bigThree, setBigThree] = useState([]);
  const [todos, setTodos] = useState([]);
  const [activeMode, setActiveMode] = useState('focus');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const modeAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(modeAnim, {
        toValue: activeMode === 'focus' ? 0 : PILL_WIDTH + CARD_GAP,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: activeMode === 'scroll' || isMenuOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(menuAnim, {
        toValue: isMenuOpen ? 0 : width,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeMode, isMenuOpen]);

  // --- Reset Focus Time on New Day ---
  const checkAndResetDailyStats = async () => {
    if (!user) return;
    try {
      const userRef = firestore().collection('users').doc(user.uid);
      const doc = await userRef.get();
      const data = doc.data();

      // Look at stats.lastUpdated
      if (data && data.stats && data.stats.lastUpdated) {
        const lastUpdatedDate = data.stats.lastUpdated.toDate();
        const today = new Date();
        const daysSinceLastUpdate =
          (today - lastUpdatedDate) / (1000 * 60 * 60 * 24);

        // Strip the time to compare just the calendar dates
        if (lastUpdatedDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
          // 1. Prepare Daily Reset Payload using Dot Notation
          const updates = {
            'stats.todayFocusTime': 0,
            'stats.todayScrollTime': 0,
            'stats.todayContextSwitches': 0,
            'stats.lastUpdated': firestore.FieldValue.serverTimestamp(),
          };

          // 2. Check for Weekly Reset (If it's Monday OR it's been over 7 days since last update)
          const isMonday = new Date().getDay() === 1; // 0 is Sunday, 1 is Monday

          if (isMonday || daysSinceLastUpdate >= 7) {
            updates['stats.weeklyFocusTime'] = 0;
            updates['stats.weeklyScrollTime'] = 0;
            updates['stats.weeklyContextSwitches'] = 0;
          }

          // Push all updates to Firebase at once
          await userRef.update(updates);
        }
      } else if (data && data.stats && !data.stats.lastUpdated) {
        // Fallback if lastUpdated doesn't exist inside stats yet
        await userRef.update({
          'stats.lastUpdated': firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error checking resets:', error);
    }
  };

  // --- Simple Firebase Stats Update ---
  // Note: Scrolling time is now synced directly from Android service
  // No need for complex sync logic anymore

  useEffect(() => {
    if (!user) return;

    // Run the reset check when the screen mounts
    checkAndResetDailyStats();

    const unsubscribeUser = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        const data = doc.data();
        if (data) {
          setUserName(data.name || 'Varun');

          const newFocusTime = data.stats?.todayFocusTime ?? 0;
          const newScrollTime = data.stats?.todayScrollTime ?? 0;

          console.log('🏠 HomeScreen Firebase Update:', {
            focusTime: newFocusTime,
            scrollTime: newScrollTime,
            lastUpdated: data.stats?.lastUpdated
              ?.toDate()
              ?.toLocaleTimeString(),
          });

          setFocusTime(newFocusTime);
          setScrollTime(newScrollTime);

          setActiveMode(data.activeMode || 'focus');
        }
      });

    const unsubscribeBigThree = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('bigThree')
      .onSnapshot(snapshot => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBigThree(tasks);
      });

    const unsubscribeTodos = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('todos')
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTodos(list);
      });

    // Run sync immediately on mount - no longer needed, Android syncs directly
    // syncScrollTimeToFirebase();

    // Sync from native bridge to Firebase every 30 seconds - no longer needed
    // const syncInterval = setInterval(() => {
    //   syncScrollTimeToFirebase();
    // }, 30000);

    return () => {
      unsubscribeUser();
      unsubscribeBigThree();
      unsubscribeTodos();
      // clearInterval(syncInterval); // No longer needed
    };
  }, [user]);

  const switchActiveMode = async mode => {
    if (!user) return;

    if (mode === 'focus') {
      try {
        const isRunning = await AttentionOSBridge.isTrackingRunning();
        if (!isRunning) {
          AttentionOSBridge.startTracking();
        }
      } catch (error) {
        console.error('Error starting tracking:', error);
      }
    }

    if (mode === 'scroll') {
      try {
        const isRunning = await AttentionOSBridge.isTrackingRunning();
        if (isRunning) {
          AttentionOSBridge.stopTracking();
        }
      } catch (error) {
        console.error('Error stopping tracking:', error);
      }
    }

    await firestore()
      .collection('users')
      .doc(user.uid)
      .update({ activeMode: mode });
  };

  const switchActiveBigThree = async clickedTask => {
    if (!user) return;
    const batch = firestore().batch();
    const baseRef = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('bigThree');
    bigThree.forEach(task =>
      batch.update(baseRef.doc(task.id), { active: false }),
    );
    batch.update(baseRef.doc(clickedTask.id), { active: true });
    await batch.commit();
  };

  const toggleTodo = async todo => {
    if (!user) return;
    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('todos')
      .doc(todo.id)
      .update({
        completed: !todo.completed,
      });
  };

  if (!user) return null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topInteractiveLayer}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Evening, {userName}!</Text>
            <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
              <Ionicons name="menu-outline" size={32} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <Animated.View
              style={[
                styles.slidingPill,
                { transform: [{ translateX: modeAnim }] },
              ]}
            />
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => switchActiveMode('focus')}
              style={styles.timeCard}
            >
              <Text
                style={
                  activeMode === 'focus'
                    ? styles.timeTextWhite
                    : styles.timeTextBlack
                }
              >
                {Math.floor(focusTime / 3600)}h{' '}
                {Math.floor((focusTime % 3600) / 60)}m
              </Text>
              <Text
                style={
                  activeMode === 'focus'
                    ? styles.subTextWhite
                    : styles.subTextBlack
                }
              >
                Focusing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => switchActiveMode('scroll')}
              style={styles.timeCard}
            >
              <Text
                style={
                  activeMode === 'scroll'
                    ? styles.timeTextWhite
                    : styles.timeTextBlack
                }
              >
                {Math.floor(scrollTime / 3600)}h{' '}
                {Math.floor((scrollTime % 3600) / 60)}m
              </Text>
              <Text
                style={
                  activeMode === 'scroll'
                    ? styles.subTextWhite
                    : styles.subTextBlack
                }
              >
                Scrolling
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          pointerEvents={
            activeMode === 'scroll' || isMenuOpen ? 'auto' : 'none'
          }
          style={[styles.dimOverlay, { opacity: overlayOpacity }]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => isMenuOpen && setIsMenuOpen(false)}
          />
        </Animated.View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.sectionTitle}>Today's Big Three</Text>
          <View style={styles.bigThreeRow}>
            {bigThree.slice(0, 3).map(task => (
              <TouchableOpacity
                key={task.id}
                activeOpacity={0.9}
                onPress={() => switchActiveBigThree(task)}
                style={[
                  styles.bigThreeCard,
                  task.active ? styles.activeBigThree : styles.inactiveBigThree,
                ]}
              >
                <Ionicons
                  name={task.icon || 'star'}
                  size={24}
                  color={task.active ? '#FFFFFF' : '#262626'}
                />
                <View style={{ marginTop: 12 }}>
                  <Text
                    style={[
                      styles.bigThreeTitle,
                      { color: task.active ? '#FFFFFF' : '#262626' },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <Text
                    style={[
                      styles.bigThreeCategory,
                      { color: task.active ? '#F2EFE8' : '#353535' },
                    ]}
                  >
                    {task.category}
                  </Text>
                </View>
                {task.active && (
                  <View style={styles.actionIcons}>
                    <TouchableOpacity>
                      <Ionicons name="pause" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Ionicons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Today's List</Text>
          <View style={styles.listContainer}>
            {todos.map(todo => (
              <View key={todo.id} style={styles.todoItem}>
                <TouchableOpacity
                  onPress={() => toggleTodo(todo)}
                  hitSlop={{ top: 10, bottom: 10, left: 10 }}
                >
                  <View
                    style={[
                      styles.todoCircle,
                      todo.completed && styles.todoCircleCompleted,
                    ]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() =>
                    navigation.navigate('ToDoEdit', { todoId: todo.id })
                  }
                >
                  <Text
                    style={[
                      styles.todoText,
                      todo.completed && styles.todoTextCompleted,
                    ]}
                  >
                    {todo.title}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* SIDEBAR */}
      <Animated.View
        style={[styles.sidebar, { transform: [{ translateX: menuAnim }] }]}
      >
        <SafeAreaView style={styles.sidebarSafeArea}>
          <View style={styles.menuContent}>
            <View style={styles.closeIconContainer}>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
                <Ionicons name="close" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileContainer}>
              <View style={styles.profileCircle}>
                <Ionicons name="person" size={50} color="#262626" />
              </View>
              <Text style={styles.profileName}>{userName}</Text>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Preferences</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>About</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutButton]}
                onPress={() => auth().signOut()}
              >
                <Text style={[styles.menuText, { color: '#FF6B6B' }]}>
                  LogOut
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2EFE8' },
  container: { flex: 1 },
  topInteractiveLayer: { zIndex: 100 },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 50,
  },

  sidebar: {
    position: 'absolute',
    right: 0,
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: '#262626',
    zIndex: 200,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
  },

  sidebarSafeArea: {
    flex: 1,
    alignItems: 'center',
  },

  menuContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: width * 0.08,
    paddingVertical: width * 0.05,
  },
  closeIconContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: width * 0.08,
  },

  profileContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: width * 0.05,
    marginBottom: width * 0.1,
  },
  profileCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2EFE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  menuItems: {
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
    gap: width * 0.02,
  },
  menuItem: {
    paddingVertical: width * 0.04,
    paddingHorizontal: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  logoutButton: { marginTop: width * 0.05 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 20,
  },
  greeting: { fontSize: 28, fontWeight: '700', color: '#000000' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 25,
    gap: 12,
    backgroundColor: '#E9E5DC',
    borderRadius: 28,
    height: 110,
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: 110,
    backgroundColor: '#262626',
    borderRadius: 28,
  },
  timeCard: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timeTextWhite: { color: '#FFFFFF', fontSize: 22, fontWeight: '600' },
  timeTextBlack: { color: '#000000', fontSize: 22, fontWeight: '600' },
  subTextWhite: { color: '#F2EFE8', fontSize: 16 },
  subTextBlack: { color: '#353535', fontSize: 16 },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 25,
    marginTop: 35,
  },
  bigThreeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 10,
  },
  bigThreeCard: {
    flex: 1,
    borderRadius: 24,
    padding: 15,
    height: 135,
    justifyContent: 'space-between',
  },
  activeBigThree: { backgroundColor: '#262626', height: 170 },
  inactiveBigThree: { backgroundColor: '#E9E5DC' },
  bigThreeTitle: { fontSize: 15, fontWeight: '700' },
  bigThreeCategory: { fontSize: 13 },
  actionIcons: { flexDirection: 'row', gap: 15, marginTop: 5 },

  listContainer: {
    backgroundColor: '#E9E5DC',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 24,
    padding: 22,
  },
  todoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  todoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#262626',
    marginRight: 16,
  },
  todoCircleCompleted: { backgroundColor: '#262626' },
  todoText: { fontSize: 18, fontWeight: '500', color: '#262626' },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#353535',
    opacity: 0.5,
  },
});

export default HomeScreen;
