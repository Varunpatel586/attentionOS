import React, { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AppTabs from './AppTabs';

const RootNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) return null;

  if (!user) {
    return authMode === 'login' ? (
      <LoginScreen onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <SignupScreen onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  return <AppTabs />;
};

export default RootNavigator;
