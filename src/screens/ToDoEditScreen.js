import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ToDoEditScreen = ({ route, navigation }) => {
  const { todoId } = route.params ?? {};
  const user = auth().currentUser;
  const userRef = firestore().collection('users').doc(user.uid);

  const [exists, setExists] = useState(false);
  const [title, setTitle] = useState('');
  const [taskGroup, setTaskGroup] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(null);

  const isEdit = Boolean(todoId);

  if (!user) {
    return null;
  }

  const todoRef = firestore()
    .collection('users')
    .doc(user.uid)
    .collection('todos')
    .doc(todoId);

  // Load todo if it exists
  useEffect(() => {
    if (!todoId) return;

    const unsub = todoRef.onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        setExists(true);
        setTitle(data.title || '');
        setTaskGroup(data.taskGroup || '');
        setDescription(data.description || '');
        setDueDate(data.dueDate || null);
      }
    });

    return unsub;
  }, []);

  const createTodo = async () => {
    try {
      console.log('Creating todo for user:', user.uid);

      const ref = await userRef.collection('todos').add({
        title,
        completed: false,
        promoted: false,
        taskGroup,
        dueDate,
        description,
        createdAt: new Date(),
      });

      console.log('Todo created with ID:', ref.id);
      navigation.goBack();
    } catch (e) {
      console.error('FAILED TO CREATE TODO:', e);
    }
  };

  const deleteTodo = async () => {
    await todoRef.delete();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.topText}>Edit Task</Text>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />

      <Text style={styles.label}>Task Group</Text>
      <TextInput
        value={taskGroup}
        onChangeText={setTaskGroup}
        style={styles.input}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 100 }]}
        multiline
      />

      {/* DATE BUTTONS (simple version) */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setDueDate(new Date())}>
          <Text>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDueDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}
        >
          <Text>Tomorrow</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, exists && styles.disabled]}
        disabled={exists}
        onPress={createTodo}
      >
        <Text>Create</Text>
      </TouchableOpacity>

      {exists && (
        <TouchableOpacity style={styles.delete} onPress={deleteTodo}>
          <Text style={{ color: 'red' }}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE9',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  topText: {
    color: '#000',
    fontFamily: 'Poppins',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
    justifyContent: 'center',
    alignContent: 'center',
  },

  card: {
    backgroundColor: '#E9E5DC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 6,
    fontFamily: 'Poppins',
  },

  input: {
    backgroundColor: '#F7F5F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#000',
  },

  inputMultiline: {
    height: 120,
    textAlignVertical: 'top',
  },

  section: {
    marginBottom: 20,
  },

  groupRow: {
    flexDirection: 'row',
    gap: 10,
  },

  groupButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#DCD7CC',
  },

  groupButtonActive: {
    backgroundColor: '#262626',
  },

  groupText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#000',
  },

  groupTextActive: {
    color: '#FFF',
  },

  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },

  dateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#DCD7CC',
    alignItems: 'center',
  },

  dateButtonActive: {
    backgroundColor: '#262626',
  },

  dateText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#000',
  },

  dateTextActive: {
    color: '#FFF',
  },

  actions: {
    marginTop: 'auto',
    gap: 12,
  },

  primaryButton: {
    backgroundColor: '#262626',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },

  primaryButtonDisabled: {
    backgroundColor: '#999',
  },

  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },

  deleteButton: {
    backgroundColor: '#E35D5D',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
});

export default ToDoEditScreen;
