import React, { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SplashScreen from '../screens/SplashScreen';
import AppStack from './AppStack';

const RootNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  //Firebase auth listener
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      setAuthInitializing(false);
    });

    return unsubscribe;
  }, []);

  //Splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  //Wait for Firebase auth state
  if (authInitializing) {
    return null; // optional: loader
  }

  //Auth screens
  if (!user) {
    return authMode === 'login' ? (
      <LoginScreen onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <SignupScreen onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  // Logged-in app
  return <AppStack />;
};

export default RootNavigator;
