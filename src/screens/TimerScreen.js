import { View, Text, StyleSheet } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const TimerScreen = () => {
  return (
    <SafeAreaProvider style={styles.container}>
      <Text>TimerScreen</Text>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
  },
});
export default TimerScreen;
