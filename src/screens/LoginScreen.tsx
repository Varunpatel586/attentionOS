import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import auth from '@react-native-firebase/auth';

type LoginScreenProps = {
  onSwitchToSignup: () => void;
};

const LoginScreen = ({ onSwitchToSignup }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      {error ? <Text>{error}</Text> : null}
      <Button title="Login" onPress={login} />
      <Button title="Create new account" onPress={onSwitchToSignup} />
    </View>
  );
};

export default LoginScreen;
