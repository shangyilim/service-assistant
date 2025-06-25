
"use client";

import type { User as AppUser } from '@/types'; // Renamed to avoid conflict with Firebase User
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  signInWithRedirect, // Changed from signInWithPopup
  GoogleAuthProvider, 
  signOut as firebaseSignOut, // Renamed to avoid conflict
  type User as FirebaseUser, // Type for Firebase user object
  signInWithPopup
} from 'firebase/auth';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: AppUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          avatarUrl: firebaseUser.photoURL,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // Using signInWithRedirect instead of signInWithPopup
      await signInWithPopup(auth, provider);
      // After signInWithRedirect, the page will redirect to Google's sign-in page.
      // Firebase handles the redirect result automatically, and onAuthStateChanged 
      // will pick up the user session once the redirect completes.
      // setLoading(false) will be handled by onAuthStateChanged after redirect.
    } catch (error) {
      console.error("Firebase sign-in error:", error);
      // Handle errors that might occur before the redirect (e.g., configuration issues)
      setLoading(false); 
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle clearing the user
      router.push('/');
    } catch (error) {
      console.error("Firebase sign-out error:", error);
      // You might want to show a toast notification to the user here
    }
    setLoading(false); // Ensure loading is set to false even if sign out fails for some reason
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
