import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const SignupScreen = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const signup = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        createdAt: serverTimestamp(),
        trackingEnabled: false,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <SafeAreaView>
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
