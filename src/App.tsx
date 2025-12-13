import HomeScreen from './screens/HomeScreen';
import { StatusBar, StyleSheet, useColorScheme, View , Text} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}

export default App;
