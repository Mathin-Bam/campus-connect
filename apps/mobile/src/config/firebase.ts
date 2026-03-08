import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyA11352OymoEZA8e2nJu_Ur9SodBI_uthA",
  authDomain: "campus-connect-d6483.firebaseapp.com",
  projectId: "campus-connect-d6483",
  storageBucket: "campus-connect-d6483.appspot.com",
  messagingSenderId: "1015664532865",
  appId: "1:1015664532865:web:e100711cd4770f933bdc80",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: any;
try {
  if (Platform.OS === 'web') {
    // Web: use browser persistence
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  } else {
    // Native: try AsyncStorage, fallback to no persistence
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const { getReactNativePersistence } = require('firebase/auth');
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // Fallback if AsyncStorage or getReactNativePersistence not available
      auth = initializeAuth(app);
    }
  }
} catch {
  // Already initialized
  auth = getAuth(app);
}

export { auth };
export default app;
