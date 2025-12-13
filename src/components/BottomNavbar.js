import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BottomNavbar = () => {
  return (
    <View style={styles.wrapper}>
      {/* Main pill navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.activeIcon}>
          <Ionicons name="home-outline" size={22} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.icon}>
          <Ionicons name="timer-outline" size={22} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.icon}>
          <Ionicons name="stats-chart-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Floating edit button */}
      <TouchableOpacity style={styles.fab}>
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
