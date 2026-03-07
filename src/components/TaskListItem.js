import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TaskListItem = ({ task, onSelect, isActive }) => {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={() => onSelect(task)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.taskTitle, isActive && styles.activeTitle]}>
            {task.title}
          </Text>
          <Text style={[styles.taskCategory, isActive && styles.activeCategory]}>
            {task.category || 'No category'}
          </Text>
        </View>
        {task.completedPomodoros !== undefined && (
          <View style={styles.pomodoroCount}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={isActive ? '#FFFFFF' : '#262626'}
            />
            <Text style={[styles.pomodoroText, isActive && styles.activePomodoroText]}>
              {task.completedPomodoros}
            </Text>
          </View>
        )}
      </View>
      {isActive && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E9E5DC',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  activeContainer: {
    backgroundColor: '#262626',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 4,
  },
  activeTitle: {
    color: '#FFFFFF',
  },
  taskCategory: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeCategory: {
    color: '#BFBFBF',
  },
  pomodoroCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  pomodoroText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#262626',
  },
  activePomodoroText: {
    color: '#FFFFFF',
  },
  checkmark: {
    marginLeft: 16,
  },
});

export default TaskListItem;
