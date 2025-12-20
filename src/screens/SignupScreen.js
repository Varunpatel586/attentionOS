import React, { useState } from 'react';
import { TextInput, Button, Text } from 'react-native';
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

      // Create user document
      await userRef.set({
        name,
        email,
        todayFocusTime: 0,
        todayScrollTime: 0,
        trackingEnabled: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
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
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      await userRef.collection('todos').doc('2').set({
        title: 'Read 20 pages',
        completed: false,
        promoted: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      await userRef.collection('todos').doc('3').set({
        title: 'Plan tomorrow',
        completed: false,
        promoted: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <SafeAreaView>
      <TextInput placeholder="Name" value={name} onChangeText={setName} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text>{error}</Text> : null}

      <Button title="Sign up" onPress={signup} />
      <Button
        title="Already have an account? Login"
        onPress={onSwitchToLogin}
      />
    </SafeAreaView>
  );
};

export default SignupScreen;
