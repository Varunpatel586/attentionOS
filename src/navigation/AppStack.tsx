import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppTabs from './AppTabs';
import ToDoEditScreen from '../screens/ToDoEditScreen';

const Stack = createNativeStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Bottom tabs */}
      <Stack.Screen name="Tabs" component={AppTabs} />

      {/* Full-screen edit */}
      <Stack.Screen
        name="ToDoEdit"
        component={ToDoEditScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;