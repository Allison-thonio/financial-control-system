  import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA1LaD2ZxojHnOxpZMBemYifzc5qkYcd78",
  authDomain: "financial-control-76d0c.firebaseapp.com",
  projectId: "financial-control-76d0c",
  storageBucket: "financial-control-76d0c.firebasestorage.app",
  messagingSenderId: "807920251355",
  appId: "1:807920251355:web:c28b8e52d0cc159e73f7fe"
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

  // Use persistent local cache on client to survive page refreshes
  if (typeof window !== 'undefined') {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalForceLongPolling: true
    });
  } else {
    db = getFirestore(app);
  }

  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export { auth, db, storage };
export default app!;
