import React from 'react';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  return <AuthScreen mode="login" onSubmit={signIn} />;
}
