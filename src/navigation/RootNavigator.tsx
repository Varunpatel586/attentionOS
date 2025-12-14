import React, { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AppTabs from './AppTabs';
import SplashScreen from '../screens/SplashScreen';

const RootNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) return <SplashScreen />;

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
