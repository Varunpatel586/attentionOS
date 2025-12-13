import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SignupScreen = ({ onSwitchToLogin }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const signup = async () => {
    try {
      const cred = await auth().createUserWithEmailAndPassword(email, password);

      await firestore()
        .collection('users')
        .doc(cred.user.uid)
        .set({
          email,
          createdAt: firestore.FieldValue.serverTimestamp(),
          trackingEnabled: false,
        });
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      {error ? <Text>{error}</Text> : null}
      <Button title="Sign up" onPress={signup} />
      <Button title="Already have an account? Login" onPress={onSwitchToLogin} />
    </View>
  );
};

export default SignupScreen;
