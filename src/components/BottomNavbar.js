import React from 'react';
import { View, StyleSheet, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';

const BottomNavbar = props => {
  const { state, navigation } = props;

  if (!state) return null; // safety guard

  const currentIndex = state.index;

  return (
    <View style={styles.wrapper}>
      {/* Main pill navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={currentIndex === 0 ? styles.activeIcon : styles.icon}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons
            name="home-outline"
            size={22}
            color={currentIndex === 0 ? '#000' : '#FFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={currentIndex === 1 ? styles.activeIcon : styles.icon}
          onPress={() => navigation.navigate('Timer')}
        >
          <Ionicons
            name="timer-outline"
            size={22}
            color={currentIndex === 1 ? '#000' : '#FFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={currentIndex === 2 ? styles.activeIcon : styles.icon}
          onPress={() => navigation.navigate('Stats')}
        >
          <Ionicons
            name="stats-chart-outline"
            size={22}
            color={currentIndex === 2 ? '#000' : '#FFF'}
          />
        </TouchableOpacity>
      </View>

      {/* Floating action button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          DeviceEventEmitter.emit('openTaskModalAddMode');
        }}
      >
        <Ionicons name="create-outline" size={22} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  navbar: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    borderRadius: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },

  icon: {
    padding: 10,
    marginHorizontal: 4,
  },

  activeIcon: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 4,
  },

  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomNavbar;
