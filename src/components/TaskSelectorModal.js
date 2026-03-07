import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import TaskListItem from './TaskListItem';

const { height } = Dimensions.get('window');

const ICON_OPTIONS = [
  'star',
  'heart',
  'flash',
  'medal',
  'hammer',
  'book',
  'bulb',
  'checkmark-circle',
  'airplane',
  'briefcase',
];

const TaskSelectorModal = ({ visible, onClose, onSelectTask, currentTaskId, forceAddMode }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isBig3Mode, setIsBig3Mode] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('star');

  useEffect(() => {
    if (visible && forceAddMode) {
      setIsAddingTask(true);
    } else if (!visible) {
      setIsAddingTask(false);
      setIsBig3Mode(false);
    }
  }, [visible, forceAddMode]);

  useEffect(() => {
    if (!visible) return;

    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch all tasks (not just active ones)
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('bigThree')
      .onSnapshot(
        snapshot => {
          const taskList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTasks(taskList);
          setLoading(false);
        },
        error => {
          console.error('Error fetching tasks:', error);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [visible]);

  const handleSelectTask = async task => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      // Deactivate all tasks
      const querySnapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('bigThree')
        .get();

      const batch = firestore().batch();
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { active: false });
      });

      // Activate selected task
      batch.update(
        firestore()
          .collection('users')
          .doc(user.uid)
          .collection('bigThree')
          .doc(task.id),
        { active: true }
      );

      // Commit the changes to effectively swap active tasks
      await batch.commit();

      // Callback to parent
      if (onSelectTask) {
        onSelectTask(task);
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error selecting task:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }

    try {
      const user = auth().currentUser;
      if (!user) return;

      setLoading(true);

      // Deactivate all existing tasks
      const querySnapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('bigThree')
        .get();

      const batch = firestore().batch();
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { active: false });
      });

      // Create new task and set as active
      const newTaskRef = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('bigThree')
        .add({
          title: newTaskTitle.trim(),
          category: newTaskCategory.trim() || 'Uncategorized',
          description: newTaskDescription.trim(),
          taskDate: newTaskDate.toISOString(),
          active: true,
          createdAt: new Date(),
          pomodorosCompleted: 0,
        });

      // Get the newly created task
      const newTaskDoc = await newTaskRef.get();
      const newTask = {
        id: newTaskDoc.id,
        ...newTaskDoc.data(),
      };

      // Also add to Today's List (todos collection)
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('todos')
        .add({
          title: newTaskTitle.trim(),
          category: newTaskCategory.trim() || 'Uncategorized',
          description: newTaskDescription.trim(),
          taskDate: newTaskDate.toISOString(),
          completed: false,
          createdAt: new Date(),
        });

      // Commit batch
      await batch.commit();

      // Callback to parent
      if (onSelectTask) {
        onSelectTask(newTask);
      }

      setNewTaskTitle('');
      setNewTaskCategory('');
      setNewTaskDescription('');
      setNewTaskDate(new Date());
      setIsAddingTask(false);
      setLoading(false);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to create task: ' + error.message);
      setLoading(false);
    }
  };

  const handleAddBig3Task = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }

    if (!newTaskCategory.trim()) {
      Alert.alert('Error', 'Category cannot be empty');
      return;
    }

    try {
      const user = auth().currentUser;
      if (!user) return;

      setLoading(true);

      // Deactivate all existing tasks
      const querySnapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('bigThree')
        .get();

      const batch = firestore().batch();
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { active: false });
      });

      // Create new Big 3 task and set as active
      const newTaskRef = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('bigThree')
        .add({
          title: newTaskTitle.trim(),
          category: newTaskCategory.trim(),
          icon: selectedIcon,
          active: true,
          createdAt: new Date(),
          pomodorosCompleted: 0,
        });

      // Get the newly created task
      const newTaskDoc = await newTaskRef.get();
      const newTask = {
        id: newTaskDoc.id,
        ...newTaskDoc.data(),
      };

      // Commit batch
      await batch.commit();

      // Callback to parent
      if (onSelectTask) {
        onSelectTask(newTask);
      }

      setNewTaskTitle('');
      setNewTaskCategory('');
      setSelectedIcon('star');
      setIsBig3Mode(false);
      setIsAddingTask(false);
      setLoading(false);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error adding Big 3 task:', error);
      Alert.alert('Error', 'Failed to create task: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isAddingTask ? isBig3Mode ? 'Create Big 3 Task' : 'Add Task Type' : 'Select Task'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isAddingTask) {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                } else {
                  onClose();
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#262626" />
            </TouchableOpacity>
          </View>

          {/* Task Type / Addition Selection */}
          {isAddingTask ? (
            <ScrollView
              style={styles.formScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.addTaskFormContainer}>
                <Text style={styles.addTaskLabel}>Create New Task</Text>
                <TextInput
                  style={styles.addTaskInput}
                  placeholder="Task title..."
                  placeholderTextColor="#999"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  autoFocus
                  maxLength={100}
                />

                <Text style={[styles.addTaskLabel, { marginTop: 12 }]}>Category</Text>
                <TextInput
                  style={styles.addTaskInput}
                  placeholder="e.g., Work, Health, Personal..."
                  placeholderTextColor="#999"
                  value={newTaskCategory}
                  onChangeText={setNewTaskCategory}
                  maxLength={50}
                />

                <Text style={[styles.addTaskLabel, { marginTop: 12 }]}>Description</Text>
                <TextInput
                  style={[styles.addTaskInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Additional details..."
                  placeholderTextColor="#999"
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                  multiline={true}
                  maxLength={500}
                />

                <Text style={[styles.addTaskLabel, { marginTop: 12 }]}>Date to Perform</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#262626" style={{ marginRight: 8 }} />
                  <Text style={styles.dateText}>
                    {newTaskDate.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={newTaskDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setNewTaskDate(selectedDate);
                    }}
                  />
                )}

                <View style={styles.addTaskButtonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                    setNewTaskCategory('');
                    setNewTaskDescription('');
                    setNewTaskDate(new Date());
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleAddTask}
                >
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          ) : (
            <>
              {/* Content */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#262626" />
                </View>
              ) : tasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#999" />
                  <Text style={styles.emptyTitle}>No tasks available</Text>
                  <Text style={styles.emptyText}>Create your first task to get started</Text>
                  <TouchableOpacity
                    style={styles.emptyAddButton}
                    onPress={() => setIsAddingTask(true)}
                  >
                    <Ionicons name="add-circle" size={20} color="#FFF" />
                    <Text style={styles.emptyAddButtonText}>Add Task</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  style={styles.taskList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.taskListContent}
                >
                  {tasks.map(task => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      onSelect={handleSelectTask}
                      isActive={task.id === currentTaskId}
                    />
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F2EFE8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.75,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E5DC',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#262626',
  },
  taskTypeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  taskTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 14,
  },
  taskTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9E5DC',
  },
  taskTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  taskTypeDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  formScrollView: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  addTaskFormContainer: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E5DC',
  },
  addTaskLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 12,
  },
  addTaskInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#262626',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9E5DC',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  iconButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E5DC',
  },
  iconButtonSelected: {
    backgroundColor: '#262626',
    borderColor: '#262626',
  },
  addTaskButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E9E5DC',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskList: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  taskListContent: {
    paddingBottom: 12,
  },
  emptyContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyAddButton: {
    marginTop: 18,
    backgroundColor: '#262626',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E9E5DC',
    marginBottom: 14,
  },
  dateText: {
    fontSize: 16,
    color: '#262626',
  },
});

export default TaskSelectorModal;
