import React, { useState } from 'react';
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

const TimerScreen = () => {
  const [activeTab, setActiveTab] = useState('Pomodoro');
  const [distractions, setDistractions] = useState(3);

  return (
    <SafeAreaProvider style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 1. Top Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('Pomodoro')} style={styles.tabItem}>
            <Text style={[styles.tabText, activeTab === 'Pomodoro' && styles.activeTabText]}>
              Pomodoro
            </Text>
            {activeTab === 'Pomodoro' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('Infinite')} style={styles.tabItem}>
            <Text style={[styles.tabText, activeTab === 'Infinite' && styles.activeTabText]}>
              Infinite
            </Text>
            {activeTab === 'Infinite' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* 2. Main Timer Display */}
        <View style={styles.timerDisplay}>
          <View style={styles.timeUnit}>
            <Text style={styles.timerNumber}>16</Text>
            <Text style={styles.timerLabel}>M</Text>
          </View>
          <View style={styles.timeUnit}>
            <Text style={styles.timerNumber}>44</Text>
            <Text style={styles.timerLabel}>S</Text>
          </View>
        </View>

        {/* 3. Controls Pill */}
        <View style={styles.controlsPill}>
          <TouchableOpacity style={styles.controlIcon}>
            <Icon name="pause" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlIcon}>
            <Icon name="refresh" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* 4. Task Information Card Area */}
        <View style={styles.taskContainer}>
          <View style={styles.taskCard}>
            <Text style={styles.taskTitleText}>Task title</Text>
            <Text style={styles.taskGroupText}>Task group</Text>
          </View>
          <View style={styles.taskActions}>
            <TouchableOpacity style={styles.actionCircle}>
              <Icon name="checkmark" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle}>
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Distraction Row */}
        <View style={styles.distractionRow}>
          <TouchableOpacity 
            style={styles.distractionPill}
            onPress={() => setDistractions(prev => prev + 1)}
          >
            <Text style={styles.distractionBtnText}>I got distracted!</Text>
          </TouchableOpacity>
          <Text style={styles.distractionCountText}>{distractions} times</Text>
        </View>

        {/* 6. Change Task Pill */}
        <TouchableOpacity style={styles.changeTaskPill}>
          <Text style={styles.changeTaskText}>Change task</Text>
          <Icon name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        {/* Spacer for Bottom Nav */}
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