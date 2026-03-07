import React, { useState } from 'react';
import { TextInput, Button, Text, StyleSheet, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SignupScreen = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const signup = async () => {
    try {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }

      const cred = await auth().createUserWithEmailAndPassword(email, password);

      const userRef = firestore().collection('users').doc(cred.user.uid);

      // Create user document with proper stats structure
      await userRef.set({
        name,
        email,
        createdAt: new Date(),
        stats: {
          todayFocusTime: 0,
          todayScrollTime: 0,
          weeklyFocusTime: 0,
          weeklyScrollTime: 0,
          todayContextSwitches: 0,
          weeklyContextSwitches: 0,
          currentTimerSeconds: 0,
          isTimerRunning: false,
          lastUpdated: new Date(),
        },
        tasks: [],
      });

      // Create Big Three tasks
      await userRef.collection('bigThree').doc('1').set({
        title: 'Focus Task',
        category: 'Work',
        icon: 'briefcase-outline',
        active: true,
      });

      await userRef.collection('bigThree').doc('2').set({
        title: 'Learn',
        category: 'Study',
        icon: 'book-outline',
        active: false,
      });

      await userRef.collection('bigThree').doc('3').set({
        title: 'Workout',
        category: 'Gym',
        icon: 'barbell-outline',
        active: false,
      });

      // Create Todos
      await userRef.collection('todos').doc('1').set({
        title: 'Reply to emails',
        completed: false,
        promoted: false,
        taskGroup: 'work',
        dueDate: null,
        description: 'Reply to all pending emails in inbox',
        createdAt: new Date(),
      });

      await userRef.collection('todos').doc('2').set({
        title: 'Read 20 pages',
        completed: false,
        promoted: false,
        taskGroup: 'study',
        dueDate: null,
        description: 'Read 20 pages of the assigned book',
        createdAt: new Date(),
      });

      await userRef.collection('todos').doc('3').set({
        title: 'Plan tomorrow',
        completed: false,
        promoted: false,
        taskGroup: 'personal',
        dueDate: null,
        description: "Plan tomorrow's tasks and schedule",
        createdAt: new Date(),
      });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />

        <Text style={styles.appName}>AttentionOS</Text>
        <Text style={styles.createAccount}>Create Account</Text>

        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#555"
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#555"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholderTextColor="#555"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.primaryButton}>
          <Text style={styles.primaryButtonText} onPress={signup}>
            Sign Up
          </Text>
        </View>

        <View style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText} onPress={onSwitchToLogin}>
            Already have an account? Login
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F0EA',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  appName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 28,
    color: '#000',
  },

  createAccount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 28,
    color: '#000',
    marginTop: 10,
  },

  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#D9D9D6',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 14,
    color: '#000',
  },

  error: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 8,
  },

  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#1C1C1C',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#FFF',
  },

  secondaryButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },

  logo: {
    width: 211,
    height: 211,
    resizeMode: 'contain',
  },

  appName: {
    color: 'black',
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '800',
    wordWrap: 'break-word',
    marginTop: -60,
    marginBottom: 32,
  },
});

export default SignupScreen;
