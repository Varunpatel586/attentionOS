import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase project credentials for AttentionOS
const firebaseConfig = {
  apiKey: 'AIzaSyB46dolK8QuyD5z7Br3SG14TJEm_B7oqM0',
  authDomain: 'attentionos-d2ab9.firebaseapp.com',
  projectId: 'attentionos-d2ab9',
  storageBucket: 'attentionos-d2ab9.firebasestorage.app',
  messagingSenderId: '1003757696318',
  appId: '1:1003757696318:android:78b487e470abf5992aa86f',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
export const db = getFirestore(app);

export default app;
