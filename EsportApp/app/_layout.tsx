import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import 'react-native-reanimated';

import { Fonts, Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // On charge les fonts mais on n'attend rien — l'app rend tout de suite,
  // les fonts pop-in quand elles arrivent. Aucun appel à SplashScreen.
  useFonts(Fonts);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.page }}>
      <ThemeProvider value={DarkTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg.page },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="match/[id]" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </View>
  );
}
