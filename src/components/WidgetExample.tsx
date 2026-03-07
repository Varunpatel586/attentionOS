import React, { useState, useEffect } from 'react'
import { View, Text, Button, StyleSheet, Alert } from 'react-native'
import { 
  WidgetUpdater, 
  updateWithRealData,
  syncWithNativeTracking,
  controlTimer
} from '../utils/widgetUpdater'
import FirebaseService, { Task } from '../services/FirebaseService'
import { DeviceEventEmitter } from 'react-native'

const WidgetExample: React.FC = () => {
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load real user data from Firebase
    loadUserData()

    // Listen for timer control events from widget
    const timerPauseSubscription = DeviceEventEmitter.addListener('timerPause', () => {
      controlTimer('pause')
      Alert.alert('Timer Paused', 'Timer was paused from widget')
    })

    const timerResumeSubscription = DeviceEventEmitter.addListener('timerResume', () => {
      controlTimer('resume')
      Alert.alert('Timer Resumed', 'Timer was resumed from widget')
    })

    const timerResetSubscription = DeviceEventEmitter.addListener('timerReset', () => {
      controlTimer('reset')
      Alert.alert('Timer Reset', 'Timer was reset from widget')
    })

    return () => {
      timerPauseSubscription.remove()
      timerResumeSubscription.remove()
      timerResetSubscription.remove()
    }
  }, [])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      const data = await FirebaseService.getUserData()
      setUserData(data)
    } catch (error) {
      console.error('Error loading user data:', error)
      Alert.alert('Error', 'Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncWithNative = async () => {
    try {
      await syncWithNativeTracking()
      Alert.alert('Success', 'Synced with native tracking data')
    } catch (error) {
      console.error('Error syncing with native:', error)
      Alert.alert('Error', 'Failed to sync with native tracking')
    }
  }

  const handleRefreshWidgets = async () => {
    try {
      await updateWithRealData()
      Alert.alert('Success', 'Widgets refreshed with real data')
    } catch (error) {
      console.error('Error refreshing widgets:', error)
      Alert.alert('Error', 'Failed to refresh widgets')
    }
  }

  const handleAddSampleTask = async () => {
    try {
      const newTask: Task = {
        id: Date.now().toString(),
        title: `Sample Task ${Math.floor(Math.random() * 100)}`,
        done: false,
        createdAt: new Date(),
        dueDate: new Date(), // Due today
        priority: 'medium',
      }

      const updatedTasks = [...(userData?.tasks || []), newTask]
      await FirebaseService.updateTasks(updatedTasks)
      
      // Reload data
      await loadUserData()
      
      Alert.alert('Success', 'Sample task added')
    } catch (error) {
      console.error('Error adding sample task:', error)
      Alert.alert('Error', 'Failed to add sample task')
    }
  }

  const handleUpdateTimer = async () => {
    try {
      const newSeconds = (userData?.stats?.currentTimerSeconds || 0) + 60
      await FirebaseService.updateTimer(newSeconds, userData?.stats?.isTimerRunning || false)
      
      // Reload data
      await loadUserData()
      
      Alert.alert('Success', 'Timer updated')
    } catch (error) {
      console.error('Error updating timer:', error)
      Alert.alert('Error', 'Failed to update timer')
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading Firebase data...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Widget Example</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Firebase Data</Text>
        <Text>Focus Time: {WidgetUpdater.formatTime(userData?.stats?.todayFocusTime || 0)}</Text>
        <Text>Scroll Time: {WidgetUpdater.formatTime(userData?.stats?.todayScrollTime || 0)}</Text>
        <Text>Timer: {WidgetUpdater.formatTimer(userData?.stats?.currentTimerSeconds || 0)}</Text>
        <Text>Timer Running: {userData?.stats?.isTimerRunning ? 'Yes' : 'No'}</Text>
        <Text>Total Tasks: {userData?.tasks?.length || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Widget Controls</Text>
        <View style={styles.buttonRow}>
          <Button title="Sync Native Data" onPress={handleSyncWithNative} />
          <Button title="Refresh Widgets" onPress={handleRefreshWidgets} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Sample Data</Text>
        <View style={styles.buttonRow}>
          <Button title="Add Task" onPress={handleAddSampleTask} />
          <Button title="+1m Timer" onPress={handleUpdateTimer} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Tasks (Widget Preview)</Text>
        {userData?.tasks?.slice(0, 3).map((task: Task) => (
          <View key={task.id} style={styles.taskRow}>
            <Text style={styles.taskText}>
              {task.done ? '✓' : '○'} {task.title}
            </Text>
          </View>
        ))}
        {(!userData?.tasks || userData.tasks.length === 0) && (
          <Text style={styles.emptyText}>No tasks for today</Text>
        )}
      </View>

      <View style={styles.section}>
        <Button title="Reload Data" onPress={loadUserData} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  taskRow: {
    paddingVertical: 4,
  },
  taskText: {
    fontSize: 16,
    color: '#000'
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic'
  }
})

export default WidgetExample
