'use client';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, SplashScreen } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
// Import this BEFORE any component that uses reanimated
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { DataProvider } from '@/components/data.provider';
import { Sound } from 'expo-av/build/Audio';
import { SoundProvider } from '@/components/sound.provider';
import TutorialModal from '@/components/TutorialModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const [showTutorial, setShowTutorial] = useState(false);

  const TUTORIAL_STORAGE_KEY = '@appTutorialSeen'; // Unique key for storage

  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        // Check if the tutorial flag exists in storage
        const hasSeenTutorial = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);

        if (hasSeenTutorial === null) {
          // First time user or flag not set - show the tutorial
          setShowTutorial(true);
        } else {
          // User has seen the tutorial before
          setShowTutorial(false);
        }
      } catch (error) {
        console.error('Error reading tutorial status from AsyncStorage:', error);
        // Decide how to handle errors, maybe default to not showing tutorial
        setShowTutorial(false);
      } finally {
        // Finished checking, hide loading indicator
        //setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleCloseTutorial = async () => {
    try {
      // Mark tutorial as seen in storage
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      // Hide the modal
      setShowTutorial(false);
    } catch (error) {
      console.error('Error saving tutorial status to AsyncStorage:', error);
      // Still hide the modal even if saving fails, but log the error
      setShowTutorial(false);
    }
  };

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
          <TutorialModal isVisible={showTutorial} onClose={handleCloseTutorial} />
        </SoundProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
