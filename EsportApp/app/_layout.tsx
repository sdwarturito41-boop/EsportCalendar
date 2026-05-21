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
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, loading, segments, router]);

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
