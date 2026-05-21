import React from 'react';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { useAuth } from '@/lib/auth';

export default function SignupScreen() {
  const { signUp } = useAuth();
  return <AuthScreen mode="signup" onSubmit={signUp} />;
}
