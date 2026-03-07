import React, { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import TimerScreen from '../screens/TimerScreen';
import StatsScreen from '../screens/StatsScreen';
import TrackingScreen from '../screens/TrackingScreen';
import BottomNavbar from '../components/BottomNavbar';
import TaskSelectorModal from '../components/TaskSelectorModal';

const Tab = createBottomTabNavigator();

const AppTabs = () => {
  const [isTaskSelectorVisible, setIsTaskSelectorVisible] = useState(false);
  const [isForceAddMode, setIsForceAddMode] = useState(false);

  useEffect(() => {
    const subAdd = DeviceEventEmitter.addListener('openTaskModalAddMode', () => {
      setIsForceAddMode(true);
      setIsTaskSelectorVisible(true);
    });
    const subOpen = DeviceEventEmitter.addListener('openTaskModal', () => {
      setIsForceAddMode(false);
      setIsTaskSelectorVisible(true);
    });
    return () => {
      subAdd.remove();
      subOpen.remove();
    };
  }, []);

  return (
    <>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomNavbar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Timer" component={TimerScreen} />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Tracking" component={TrackingScreen} />
      </Tab.Navigator>

      <TaskSelectorModal
        visible={isTaskSelectorVisible}
        onClose={() => {
          setIsTaskSelectorVisible(false);
          setIsForceAddMode(false);
        }}
        onSelectTask={(task: any) => {
          setIsTaskSelectorVisible(false);
          setIsForceAddMode(false);
          // Emit event so other screens (like Timer) know a task was selected if needed
          DeviceEventEmitter.emit('taskSelectedGlobally', task);
        }}
        forceAddMode={isForceAddMode}
        currentTaskId={null}
      />
    </>
  );
};

export default AppTabs;
