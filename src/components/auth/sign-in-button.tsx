"use client";

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function SignInButton() {
  const { signIn, loading } = useAuth();

  return (
    <Button onClick={signIn} disabled={loading} size="lg" className="w-full sm:w-auto">
      <LogIn className="mr-2 h-5 w-5" />
      {loading ? 'Signing In...' : 'Sign In with Google'}
    </Button>
  );
}
