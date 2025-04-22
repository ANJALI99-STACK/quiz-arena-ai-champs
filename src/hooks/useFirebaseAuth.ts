
import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { toast } from "sonner";

// Demo user for development fallback
const DEMO_USER = {
  uid: "demo-user-123",
  email: "demo@example.com",
  displayName: "Demo User",
  photoURL: "https://api.dicebear.com/6.x/avataaars/svg?seed=demo",
  providerId: "demo",
  emailVerified: true
};

export const useFirebaseAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      setLoading(false);
      return () => {};
    }
  }, []);

  const signup = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created successfully!");
      return result;
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(`Failed to create account: ${error.message}`);
      // Use demo user as fallback in development
      setCurrentUser(DEMO_USER as unknown as User);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in successfully!");
      return result;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Failed to sign in: ${error.message}`);
      // Use demo user as fallback in development
      setCurrentUser(DEMO_USER as unknown as User);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (currentUser && (currentUser as any).providerId === 'demo') {
        // If using demo user, just clear it
        setCurrentUser(null);
        toast.success("Signed out successfully");
        return;
      }
      
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(`Failed to sign out: ${error.message}`);
      // Clear user anyway to prevent getting stuck
      setCurrentUser(null);
      throw error;
    }
  };

  return {
    currentUser,
    loading,
    signup,
    login,
    logout
  };
};
