import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA11352OymoEZA8e2nJu_Ur9SodBI_uthA",
  authDomain: "campus-connect-d6483.firebaseapp.com",
  projectId: "campus-connect-d6483",
  storageBucket: "campus-connect-d6483.appspot.com",
  messagingSenderId: "1015664532865",
  appId: "1:1015664532865:web:e100711cd4770f933bdc80",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Set persistence to local storage (will work in React Native)
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Ignore errors if persistence is already set
});

export default app;
