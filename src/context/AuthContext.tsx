
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { toast } from "sonner";

// Firebase configuration setup for development
// In a production app, these would be environment variables
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForDevelopmentPurposesOnly",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Demo user for development purposes
const DEMO_USER = {
  uid: "demo-user-123",
  email: "demo@example.com",
  displayName: "Demo User",
  photoURL: "https://api.dicebear.com/6.x/avataaars/svg?seed=demo",
  providerId: "demo",
  emailVerified: true
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      // For development purposes, we'll use a demo user
      // In production, this would use the actual Firebase auth
      if (firebaseConfig.apiKey.includes("DemoKey")) {
        setCurrentUser(DEMO_USER as unknown as User);
        toast.success("Signed in as Demo User");
        return;
      }
      
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error("Failed to sign in. Using demo mode instead.");
      setCurrentUser(DEMO_USER as unknown as User);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (firebaseConfig.apiKey.includes("DemoKey")) {
        setCurrentUser(null);
        toast.success("Signed out successfully");
        return;
      }
      
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
