'use client';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
// Import this BEFORE any component that uses reanimated
import 'react-native-reanimated';

import { DataProvider } from '@/components/data.provider';
import GlobalStyle from '@/components/GlobalStyle';
import TutorialModal from '@/components/TutorialModal';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../i18n'; // Import i18n initialization
import { setAppLocale } from './utils/language';

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
    const checkLanguage = async () => {
      try {
        // Check if the language setting exists in storage
        const storedLanguage = await AsyncStorage.getItem('language');
        if (storedLanguage) {
          // If a language is stored, set it in the app (this could be a context or state update)
          // For example, you might have a function to set the app's language
          setAppLocale(storedLanguage);
        } else {
          // If no language is stored, you might want to set a default language
          setAppLocale('en'); // Default to English or any other default language
        }
      } catch (error) {
        console.error('Error reading language from AsyncStorage:', error);
        // Handle error, maybe set a default language
        // setAppLocale('en'); // Default to English or any other default language
      }
    };
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

    checkLanguage();
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

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: 'transparent',
    },
  };

  // Simplified component structure - no need for separate RootLayoutNav
  return (
    <ThemeProvider value={CustomDarkTheme}>
      <GlobalStyle css="input {outline: none;}" />
      <DataProvider>
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
      </DataProvider>
    </ThemeProvider>
  );
}
