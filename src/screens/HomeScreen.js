import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import BottomNavbar from '../components/BottomNavbar';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      {/* Greeting */}
      <View style={styles.topTextContainer}>
        <Text style={styles.topText}>Good evening, Harsheel!</Text>
      </View>

      {/* Time cards */}
      <View style={styles.timeContainer}>
        <View style={[styles.card, styles.darkCard]}>
          <Text style={[styles.titleText, styles.darkText]}>2h 28m</Text>
          <Text style={[styles.subText, styles.darkSubText]}>Focusing</Text>
        </View>

        <View style={[styles.card, styles.lightCard]}>
          <Text style={[styles.titleText, styles.lightText]}>1h 40m</Text>
          <Text style={[styles.subText, styles.lightSubText]}>Scrolling</Text>
        </View>
      </View>

      {/* Big Three title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today’s Big Three</Text>
      </View>

      {/* Big Three cards */}
      <View style={styles.bigThreeContainer}>
        <View style={[styles.bigThreeCard, styles.lightCard]}>
          <Text style={[styles.bigThreeTitle, styles.lightText]}>
            Task Title
          </Text>
          <Text style={[styles.bigThreeSubText, styles.lightSubText]}>
            Study
          </Text>
        </View>

        <View style={[styles.bigThreeCard, styles.darkCard]}>
          <Text style={[styles.bigThreeTitle, styles.darkText]}>
            Task Title
          </Text>
          <Text style={[styles.bigThreeSubText, styles.darkSubText]}>Work</Text>
        </View>

        <View style={[styles.bigThreeCard, styles.lightCard]}>
          <Text style={[styles.bigThreeTitle, styles.lightText]}>
            Task Title
          </Text>
          <Text style={[styles.bigThreeSubText, styles.lightSubText]}>Gym</Text>
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
      {/* Bottom Navbar */}
      <BottomNavbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
  },

  topTextContainer: {
    marginTop: 50,
    marginLeft: 20,
  },

  topText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },

  timeContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    columnGap: 12,
  },

  sectionHeader: {
    marginTop: 24,
    marginLeft: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  card: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
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
    fontSize: 22,
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
    fontSize: 14,
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
    color: '#BFBFBF',
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
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },

  bigThreeSubText: {
    marginTop: 8,
    fontSize: 15,
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
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#262626',
    marginRight: 12,
  },

  todoText: {
    fontSize: 15,
    fontFamily: 'Poppins',
    color: '#000',
  },
});

export default HomeScreen;
