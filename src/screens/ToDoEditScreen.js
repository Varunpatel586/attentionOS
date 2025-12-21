import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';

const ToDoEditScreen = ({ route, navigation }) => {
  const { todoId } = route.params ?? {};
  const user = auth().currentUser;

  // 1. ALL HOOKS MUST REMAIN AT THE TOP OF THE COMPONENT
  const [exists, setExists] = useState(false);
  const [title, setTitle] = useState('');
  const [taskGroup, setTaskGroup] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false); //

  const userRef = firestore().collection('users').doc(user?.uid);
  const todoRef = userRef.collection('todos').doc(todoId || 'temp');

  useEffect(() => {
    if (!todoId || !user) return;

    const unsub = todoRef.onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        setExists(true);
        setTitle(data.title || '');
        setTaskGroup(data.taskGroup || '');
        setDescription(data.description || '');
        setDueDate(data.dueDate?.toDate() || null);
      }
    });
    return unsub;
  }, [todoId, user]);

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Task title is required');
    try {
      const data = {
        title: title.trim(),
        taskGroup: taskGroup.trim(),
        description: description.trim(),
        dueDate: dueDate ? firestore.Timestamp.fromDate(dueDate) : null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (exists) {
        await todoRef.update(data);
      } else {
        await userRef.collection('todos').add({
          ...data,
          completed: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => todoRef.delete().then(() => navigation.goBack()),
      },
    ]);
  };

  // Helper date logic
  const isToday = dueDate?.toDateString() === new Date().toDateString();
  const isTomorrow =
    dueDate?.toDateString() === new Date(Date.now() + 86400000).toDateString();
  const isCustomDate = dueDate && !isToday && !isTomorrow;

  // 2. RENDER CHECK MUST HAPPEN AFTER ALL HOOKS
  if (!user) return null;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>
            {exists ? 'Edit task' : 'New task'}
          </Text>

          <View style={styles.mainCard}>
            <TextInput
              style={styles.pillInput}
              placeholder="Task title"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.pillInput}
              placeholder="Task group"
              placeholderTextColor="#999"
              value={taskGroup}
              onChangeText={setTaskGroup}
            />

            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.datePill, isToday && styles.activePill]}
                onPress={() => setDueDate(new Date())}
              >
                <Text style={[styles.dateText, isToday && styles.activeText]}>
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.datePill,
                  styles.tomorrowPill,
                  isTomorrow && styles.activePill,
                ]}
                onPress={() => setDueDate(new Date(Date.now() + 86400000))}
              >
                <Text
                  style={[styles.dateText, isTomorrow && styles.activeText]}
                >
                  Tomorrow
                </Text>
              </TouchableOpacity>

              {/* DYNAMIC CIRCULAR CALENDAR BUTTON */}
              <TouchableOpacity
                style={[
                  styles.calendarCircleBtn,
                  isCustomDate && styles.activePill,
                ]}
                activeOpacity={0.7}
                onPress={() => setPickerOpen(true)} //
              >
                {isCustomDate ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        color: '#FFF',
                        fontSize: 10,
                        fontWeight: '700',
                        marginBottom: -2,
                      }}
                    >
                      {dueDate
                        .toLocaleString('default', { month: 'short' })
                        .toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        color: '#FFF',
                        fontSize: 18,
                        fontWeight: 'bold',
                      }}
                    >
                      {dueDate.getDate()}
                    </Text>
                  </View>
                ) : (
                  <Icon name="calendar-blank-outline" size={26} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.descriptionBox}
              placeholder="Description"
              placeholderTextColor="#999"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.createBtn} onPress={handleSave}>
                <Text style={styles.createBtnText}>
                  {exists ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>

              {exists && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={confirmDelete}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* NATIVE GOOGLE CALENDAR LOOK FOR ANDROID */}
      <DatePicker
        modal
        open={pickerOpen}
        date={dueDate || new Date()}
        mode="date" //
        androidVariant="calendar" // FORCES CALENDAR MODE
        theme="light"
        onConfirm={date => {
          setPickerOpen(false);
          setDueDate(date); //
        }}
        onCancel={() => {
          setPickerOpen(false);
        }}
      />

      <View style={styles.exitFabContainer}>
        <TouchableOpacity
          style={styles.exitFab}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="close" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3ED',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 30,
  },
  mainCard: {
    backgroundColor: '#EBE8E0',
    width: '100%',
    borderRadius: 40,
    padding: 20,
    gap: 15,
  },
  pillInput: {
    backgroundColor: '#F5F3EF',
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 25,
    fontSize: 16,
    color: '#000',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePill: {
    flex: 1,
    height: 60,
    backgroundColor: '#262626',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tomorrowPill: {
    flex: 1.5,
  },
  activePill: {
    backgroundColor: '#000',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  calendarCircleBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#262626',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dateText: {
    color: '#999',
    fontWeight: '600',
  },
  activeText: {
    color: '#FFF',
  },
  descriptionBox: {
    backgroundColor: '#F5F3EF',
    borderRadius: 30,
    padding: 25,
    height: 150,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#000',
  },
  actionContainer: {
    marginTop: 10,
    gap: 12,
    alignItems: 'center',
  },
  createBtn: {
    backgroundColor: '#1A1A1A',
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#F5F3EF',
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1CEC7',
  },
  deleteBtnText: {
    color: '#E35D5D',
    fontSize: 16,
    fontWeight: '600',
  },
  exitFabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 35,
    overflow: 'hidden',
  },
  exitFab: {
    width: 70,
    height: 70,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default ToDoEditScreen;
