'use client';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
// Import this BEFORE any component that uses reanimated
import 'react-native-reanimated';

import { DataProvider, prefixKey } from '@/components/data.provider';
import GlobalStyle from '@/components/GlobalStyle';
import TutorialModal from '@/components/TutorialModal';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../i18n'; // Import i18n initialization

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Move exports AFTER imports
export { ErrorBoundary } from 'expo-router';
export const unstable_settings = {
  initialRouteName: '(tabs)',
};
// This should appear after imports, not before
export const unstable_skipSSR = true;

export const TUTORIAL_STORAGE_KEY = 'tutorialSeen'; // Unique key for storage
export const PROFILE_WEIGHT_KEY = 'profileWeight';
export const PROFILE_FITNESS_LEVEL_KEY = 'profileFitness';

enum FitnessLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Expert = 'expert',
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme();

  const [showTutorial, setShowTutorial] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const [profileWeight, setProfileWeight] = useState('');
  const [profileFitnessLevel, setProfileFitnessLevel] = useState<FitnessLevel | null>(null);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        // Check if the tutorial flag exists in storage
        const hasSeenTutorial = await AsyncStorage.getItem(`${prefixKey}${TUTORIAL_STORAGE_KEY}`);

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
      await AsyncStorage.setItem(`${prefixKey}${TUTORIAL_STORAGE_KEY}`, 'true');
      // Hide the modal
      setShowTutorial(false);
    } catch (error) {
      console.error('Error saving tutorial status to AsyncStorage:', error);
      // Still hide the modal even if saving fails, but log the error
      setShowTutorial(false);
    }
  };

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const storedWeight = await AsyncStorage.getItem(`${prefixKey}${PROFILE_WEIGHT_KEY}`);
        const storedFitness = await AsyncStorage.getItem(`${prefixKey}${PROFILE_FITNESS_LEVEL_KEY}`);
        if (!storedWeight || !storedFitness) {
          setShowProfileForm(true);
          setProfileWeight(storedWeight || '');
          setProfileFitnessLevel((storedFitness as FitnessLevel) || null);
        } else {
          setShowProfileForm(false);
        }
      } catch (error) {
        setShowProfileForm(true);
      }
    };
    checkProfileStatus();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await AsyncStorage.setItem(`${prefixKey}${PROFILE_WEIGHT_KEY}`, profileWeight);
      if (profileFitnessLevel) await AsyncStorage.setItem(`${prefixKey}${PROFILE_FITNESS_LEVEL_KEY}`, profileFitnessLevel);
      setShowProfileForm(false);
    } catch (error) {
      // Optionally show error
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
      <GlobalStyle css="input {outline: none;} select {outline: none;}" />
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
        {showProfileForm && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,20,20,0.95)', zIndex: 999999, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#222', borderRadius: 16, padding: 28, width: 320, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 18 }}>{'Set up your profile'}</Text>
              <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>{'Weight (kg)'}</Text>
              <TextInput
                style={{ backgroundColor: '#333', color: '#fff', borderRadius: 8, padding: 10, width: 120, marginBottom: 18, fontSize: 16, textAlign: 'center' }}
                keyboardType="numeric"
                value={profileWeight}
                onChangeText={setProfileWeight}
                placeholder="Enter your weight"
                placeholderTextColor="#aaa"
              />
              <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>{'Fitness Level'}</Text>
              <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                {[FitnessLevel.Beginner, FitnessLevel.Intermediate, FitnessLevel.Expert].map((level, idx) => (
                  <Pressable
                    key={level}
                    onPress={() => setProfileFitnessLevel(level)}
                    style={{ marginHorizontal: 8 }}
                  >
                    <FontAwesome
                      name={profileFitnessLevel === level ? 'star' : 'star-o'}
                      size={32}
                      color={profileFitnessLevel === level ? '#00bcd4' : '#fff'}
                    />
                    <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', marginTop: 2 }}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={handleSaveProfile}
                style={{ backgroundColor: '#00bcd4', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 8 }}
                disabled={!profileWeight || !profileFitnessLevel}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{'Save'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </DataProvider>
    </ThemeProvider>
  );
}
