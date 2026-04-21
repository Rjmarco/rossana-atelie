import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const config = {
  apiKey: firebaseConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${firebaseConfig.projectId}.firebaseapp.com`,
  projectId: firebaseConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: (firebaseConfig as any).measurementId,
};

const databaseId = (import.meta.env.VITE_FIREBASE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId) || '(default)';

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

// Diagnostic log (projectId only) to help verify config
if (import.meta.env.DEV) {
  console.log("Firebase initialized for project:", config.projectId);
}

// Reinforce persistence
setPersistence(auth, browserLocalPersistence).catch(console.error);
