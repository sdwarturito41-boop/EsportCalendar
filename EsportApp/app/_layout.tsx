import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { Fonts, Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      if (!inAuthGroup) router.replace('/login');
      return;
    }
    // Session OK — vérifie l'onboarding initial
    if (!profile?.onboarded_at) {
      if (!inOnboardingGroup) router.replace('/games');
      return;
    }
    // Session + onboardé : sors uniquement du groupe auth.
    // On laisse l'utilisateur entrer dans (onboarding) volontairement
    // pour éditer ses préférences depuis Profil.
    if (inAuthGroup) router.replace('/');
  }, [session, profile, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg.page, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent.indigo} size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg.page },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="match/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  useFonts(Fonts);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.page }}>
      <ThemeProvider value={DarkTheme}>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
        <StatusBar style="light" />
      </ThemeProvider>
    </View>
  );
}
