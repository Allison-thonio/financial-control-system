import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAhkbpm6_G85vr-PVw0yNgzz6qL0_BJ6Rs",
  authDomain: "loan-app-2ebbc.firebaseapp.com",
  projectId: "loan-app-2ebbc",
  storageBucket: "loan-app-2ebbc.firebasestorage.app",
  messagingSenderId: "266635671844",
  appId: "1:266635671844:web:68cf612ec33b82c5a99bb1",
  measurementId: "G-SRNZFQW87K"
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Check if we are in the browser for analytics
let analytics = null;
if (typeof window !== 'undefined') {
  const { getAnalytics } = require('firebase/analytics');
  analytics = getAnalytics(app);
}

export { auth, db, storage, analytics };
export default app;

