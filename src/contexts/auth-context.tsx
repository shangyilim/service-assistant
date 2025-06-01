"use client";

import type { User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
  id: 'mock-user-id',
  name: 'Demo User',
  email: 'demo@example.com',
  avatarUrl: 'https://placehold.co/100x100.png'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth state on mount
    try {
      const storedUser = localStorage.getItem('data-weaver-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('data-weaver-user');
    }
    setLoading(false);
  }, []);

  const signIn = async () => {
    setLoading(true);
    // Simulate Google Sign-In
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(MOCK_USER);
    localStorage.setItem('data-weaver-user', JSON.stringify(MOCK_USER));
    setLoading(false);
    router.push('/dashboard');
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    localStorage.removeItem('data-weaver-user');
    setLoading(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
