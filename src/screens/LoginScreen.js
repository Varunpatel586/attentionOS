import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';

import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';

const app = getApp();
const auth = getAuth(app);

const LoginScreen = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text>{error}</Text> : null}
      <Button title="Login" onPress={login} />
      <Button title="Create new account" onPress={onSwitchToSignup} />
    </View>
  );
};

export default LoginScreen;
