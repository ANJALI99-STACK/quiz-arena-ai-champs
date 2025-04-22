
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { toast } from "sonner";
import { auth } from '../firebase/config';

// Demo user for development purposes
const DEMO_USER = {
  uid: "demo-user-123",
  email: "demo@example.com",
  displayName: "Demo User",
  photoURL: "https://api.dicebear.com/6.x/avataaars/svg?seed=demo",
  providerId: "demo",
  emailVerified: true
};

// Initialize Google provider
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
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error("Failed to sign in with Google. Using demo mode instead.");
      
      // Use demo user when authentication fails
      setCurrentUser(DEMO_USER as unknown as User);
    }
  };

  const logout = async () => {
    try {
      if (currentUser && currentUser.providerId === 'demo') {
        // If using demo user, just clear it
        setCurrentUser(null);
        toast.success("Signed out successfully");
        return;
      }
      
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
      // Clear user anyway to prevent getting stuck
      setCurrentUser(null);
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
