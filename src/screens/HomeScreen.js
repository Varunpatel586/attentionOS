import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Button,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavbar from '../components/BottomNavbar';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = () => {
  const user = auth().currentUser;

  const [userName, setUserName] = useState('');
  const [focusTime, setFocusTime] = useState(0);
  const [scrollTime, setScrollTime] = useState(0);
  const [bigThree, setBigThree] = useState([]);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribeUser = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        const data = doc.data();
        if (data) {
          setUserName(data.name || '');
          setFocusTime(data.todayFocusTime || 0);
          setScrollTime(data.todayScrollTime || 0);
        }
      });

    const unsubscribeBigThree = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('bigThree')
      .onSnapshot(snapshot => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBigThree(tasks);
      });

    const unsubscribeTodos = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('todos')
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTodos(list);
      });

    return () => {
      unsubscribeUser();
      unsubscribeBigThree();
      unsubscribeTodos();
    };
  }, []);

  const activeTask = bigThree.find(t => t.active);
  const inactiveTasks = bigThree.filter(t => !t.active);

  const orderedBigThree = [
    inactiveTasks[0] || null,
    activeTask || null,
    inactiveTasks[1] || null,
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Button title="Logout" onPress={() => auth().signOut()} />
        {/* Greeting */}
        <View style={styles.topTextContainer}>
          <Text style={styles.topText}>
            Evening{userName ? `, ${userName}` : ''}!
          </Text>
        </View>

        {/* Time cards */}
        <View style={styles.timeContainer}>
          <View style={[styles.card, styles.darkCard]}>
            <Text style={[styles.titleText, styles.darkText]}>
              {Math.floor(focusTime / 3600)}h{' '}
              {Math.floor((focusTime % 3600) / 60)}m
            </Text>
            <Text style={[styles.subText, styles.darkSubText]}>Focusing</Text>
          </View>

          <View style={[styles.card, styles.lightCard]}>
            <Text style={[styles.titleText, styles.lightText]}>
              {Math.floor(scrollTime / 3600)}h{' '}
              {Math.floor((scrollTime % 3600) / 60)}m
            </Text>
            <Text style={[styles.subText, styles.lightSubText]}>Scrolling</Text>
          </View>
        </View>

        {/* Big Three title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today’s Big Three</Text>
        </View>

        {/* Big Three cards */}
        <View style={styles.bigThreeRow}>
          {orderedBigThree.map((task, index) => {
            if (!task) return <View key={index} style={{ width: '30%' }} />;

            const isActive = task.active;

            return (
              <View
                key={task.id}
                style={[
                  isActive
                    ? styles.bigThreeCardActive
                    : styles.bigThreeCardSmall,
                  isActive ? styles.darkCard : styles.lightCard,
                ]}
              >
                <Ionicons
                  name={task.icon}
                  size={isActive ? 24 : 22}
                  color={isActive ? '#FFF' : '#000'}
                />

                <Text
                  style={[
                    styles.bigThreeTitle,
                    isActive ? styles.darkText : styles.lightText,
                  ]}
                >
                  {task.title}
                </Text>

                <Text
                  style={[
                    styles.bigThreeSubText,
                    isActive ? styles.darkSubText : styles.lightSubText,
                  ]}
                >
                  {task.category}
                </Text>

                {isActive && (
                  <View style={styles.bigThreeActions}>
                    <TouchableOpacity>
                      <Ionicons name="pause-outline" size={25} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Ionicons name="close-outline" size={25} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Today’s List title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today’s List</Text>
        </View>

        {/* Today’s List container */}
        <View style={styles.todoContainer}>
          {todos.map(todo => (
            <TouchableOpacity
              key={todo.id}
              style={styles.todoItem}
              onPress={() =>
                firestore()
                  .collection('users')
                  .doc(user.uid)
                  .collection('todos')
                  .doc(todo.id)
                  .update({ completed: !todo.completed })
              }
            >
              <View
                style={[
                  styles.todoCircle,
                  todo.completed && styles.todoCircleCompleted,
                ]}
              />

              <Text
                style={[
                  styles.todoText,
                  todo.completed && styles.todoTextCompleted,
                ]}
              >
                {todo.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {/* Bottom Navbar */}
      <BottomNavbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
  },

  topTextContainer: {
    marginLeft: 20,
  },

  topText: {
    fontSize: 30,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'Poppins',
  },

  timeContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    columnGap: 12,
  },

  sectionHeader: {
    marginTop: 10,
    marginLeft: 20,
  },

  sectionTitle: {
    fontSize: 25,
    fontWeight: '500',
    fontFamily: 'Poppins',
    fontStyle: 'bold',
    color: '#000',
  },

  card: {
    flex: 1,
    padding: 20,
    borderRadius: 28,
    height: 140,
    justifyContent: 'center',
  },
  smallCard: {
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    width: 120,
    height: 120,
    justifyContent: 'center',
  },

  bigThreeContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginLeft: 20,
    height: 250,
  },

  bigThreeCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    height: 180,
    justifyContent: 'center',
  },

  darkCard: {
    backgroundColor: '#262626',
  },

  lightCard: {
    backgroundColor: '#E9E5DC',
  },

  titleText: {
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  subText: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '300',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },

  cardSubText: {
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },

  darkText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },

  darkSubText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },

  lightText: {
    color: '#000000',
    fontFamily: 'Poppins',
  },

  lightSubText: {
    color: '#000000',
    fontFamily: 'Poppins',
  },

  bigThreeTitle: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'flex-start',
    fontFamily: 'Poppins',
  },

  bigThreeSubText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },

  todoContainer: {
    backgroundColor: '#E9E5DC',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  todoCircle: {
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#262626',
    marginRight: 12,
  },

  todoText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Poppins',
    fontStyle: 'medium',
    color: '#000',
  },

  bigThreeRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bigThreeCardSmall: {
    width: '30%',
    height: 150,
    padding: 13,
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  bigThreeCardActive: {
    width: '34%',
    height: 160,
    padding: 18,
    borderRadius: 18,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    elevation: 6,
  },

  bigThreeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginLeft: 7,
    marginTop: 12,
  },
});

export default HomeScreen;
