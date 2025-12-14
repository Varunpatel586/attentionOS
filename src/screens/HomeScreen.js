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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Button title="Logout" onPress={() => auth().signOut()} />
        {/* Greeting */}
        <View style={styles.topTextContainer}>
          <Text style={styles.topText}>Evening, Harsheel!</Text>
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
          {/* Left card */}
          <View style={[styles.bigThreeCardSmall, styles.lightCard]}>
            <Ionicons name="book-outline" size={22} color="#000" />
            <Text style={[styles.bigThreeTitle, styles.lightText]}>
              Task title
            </Text>
            <Text style={[styles.bigThreeSubText, styles.lightSubText]}>
              Study
            </Text>
          </View>

          {/* Active middle card */}
          <View style={[styles.bigThreeCardActive, styles.darkCard]}>
            <Ionicons name="briefcase-outline" size={24} color="#FFF" />

            <Text style={[styles.bigThreeTitle, styles.darkText]}>
              Task title
            </Text>
            <Text style={[styles.bigThreeSubText, styles.darkSubText]}>
              Work
            </Text>

            <View style={styles.bigThreeActions}>
              <TouchableOpacity>
                <Ionicons name="pause-outline" size={25} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="close-outline" size={25} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Right card */}
          <View style={[styles.bigThreeCardSmall, styles.lightCard]}>
            <Ionicons name="barbell-outline" size={22} color="#000" />
            <Text style={[styles.bigThreeTitle, styles.lightText]}>
              Task title
            </Text>
            <Text style={[styles.bigThreeSubText, styles.lightSubText]}>
              Gym
            </Text>
          </View>
        </View>

        {/* Today’s List title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today’s List</Text>
        </View>

        {/* Today’s List container */}
        <View style={styles.todoContainer}>
          <View style={styles.todoItem}>
            <View style={styles.todoCircle} />
            <Text style={styles.todoText}>Task1</Text>
          </View>

          <View style={styles.todoItem}>
            <View style={styles.todoCircle} />
            <Text style={styles.todoText}>Task2</Text>
          </View>

          <View style={styles.todoItem}>
            <View style={styles.todoCircle} />
            <Text style={styles.todoText}>Task3</Text>
          </View>
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
    textAlign: 'center',
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
