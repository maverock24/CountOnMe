'use client';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
// Import this BEFORE any component that uses reanimated
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { DataProvider } from '@/components/data.provider';
import { Sound } from 'expo-av/build/Audio';
import { SoundProvider } from '@/components/sound.provider';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Move exports AFTER imports
export { ErrorBoundary } from 'expo-router';
export const unstable_settings = {
  initialRouteName: '(tabs)',
};
// This should appear after imports, not before
export const unstable_skipSSR = true;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme();

  useEffect(() => {
    if (error) console.error('Font loading error:', error);
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <Slot />;
  }

  // Simplified component structure - no need for separate RootLayoutNav
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DataProvider>
        <SoundProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              // Fix potential animation issues on Android
              animation: Platform.OS === 'android' ? 'fade' : 'default',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </SoundProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
