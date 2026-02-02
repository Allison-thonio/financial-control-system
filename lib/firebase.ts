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
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // These will be caught by AuthContext's demo mode check
}

export { auth, db, storage };
export default app!;

