import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration (the one you got from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCudLn6yoS7eYj35BIHfRclVf1LviDqTS4",
  authDomain: "code-987cc.firebaseapp.com",
  projectId: "code-987cc",
  storageBucket: "code-987cc.firebasestorage.app",
  messagingSenderId: "921962116586",
  appId: "1:921962116586:web:79320241d62e923db66e93",
  measurementId: "G-JL7QZJ95YS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
