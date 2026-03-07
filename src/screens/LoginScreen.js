import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />

        <Text style={styles.appName}>AttentionOS</Text>

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
          <Text style={styles.primaryButtonText} onPress={login}>
            Log In
          </Text>
        </View>

        <View style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText} onPress={onSwitchToSignup}>
            Create Account
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
    marginTop: 8,
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
});

export default LoginScreen;
