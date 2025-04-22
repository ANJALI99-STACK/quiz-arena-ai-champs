
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "kgjfhgtdjgsghdrh",
  authDomain: "quizzz-001.firebaseapp.com",
  projectId: "quizzz-001",
  storageBucket: "quizzz-001.firebasestorage.app",
  messagingSenderId: "7hjdjhdh8",
  appId: "gjhhdxwaryjikhulfgvjdhdh",
  measurementId: "G-hdjdjs0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;
