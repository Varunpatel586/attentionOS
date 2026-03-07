import React, { useEffect } from 'react';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';
import TrackingSyncService from './services/TrackingSyncService';

function App() {
  useEffect(() => {
    // Initialize tracking sync service (runs in background)
    TrackingSyncService.initialize().catch(console.error);

    // Cleanup on unmount
    return () => {
      TrackingSyncService.stop();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
