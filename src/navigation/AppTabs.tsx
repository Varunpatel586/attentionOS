import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import TimerScreen from '../screens/TimerScreen';
import StatsScreen from '../screens/StatsScreen';
import TrackingScreen from '../screens/TrackingScreen';
import BottomNavbar from '../components/BottomNavbar';

const Tab = createBottomTabNavigator();

const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNavbar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Tracking" component={TrackingScreen} />
    </Tab.Navigator>
  );
};

export default AppTabs;
