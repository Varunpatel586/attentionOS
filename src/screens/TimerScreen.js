import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TimerScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>TimerScreen</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
  },
});
export default TimerScreen;
