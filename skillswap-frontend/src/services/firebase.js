import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDW3yBHBtDKL9a81yJ4Ln8ch3W2qY4bC3w",
  authDomain: "skillswap-africa-2b0a9.firebaseapp.com",
  projectId: "skillswap-africa-2b0a9",
  storageBucket: "skillswap-africa-2b0a9.firebasestorage.app",
  messagingSenderId: "483022677454",
  appId: "1:483022677454:web:5c94e358dc8e4a17ffb79f"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google provider for OAuth
export const googleProvider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence);

export default app;
