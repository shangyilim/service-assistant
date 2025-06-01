"use client";

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const { signOut, loading } = useAuth();

  return (
    <Button variant="outline" onClick={signOut} disabled={loading}>
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? 'Signing Out...' : 'Sign Out'}
    </Button>
  );
}
