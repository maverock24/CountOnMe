import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from './data.provider'; // Import the useData hook

// Module-scoped variable for tracking the current playing sound (singleton)
let currentSound: Audio.Sound | null = null;

// Interface for our context
interface SoundContextType {
  isPlaying: boolean;
  audioReady: boolean;
  selectedWorkoutMusic: any;
  selectedBreakMusic: any;
  selectedSuccessSound: any;
  playSound: (soundFile: any, loop?: boolean, volume?: number) => Promise<Audio.Sound | null>;
  stopSound: () => Promise<void>;
  fadeOutSound: () => Promise<void>;
  playSegmentMusic: (segment: string, callback?: () => void) => Promise<void>;
  loadMusicSettings: () => Promise<void>;
}

// Create context with default values
const SoundContext = createContext<SoundContextType>({
  isPlaying: false,
  audioReady: false,
  selectedWorkoutMusic: null,
  selectedBreakMusic: null,
  selectedSuccessSound: null,
  playSound: async () => null,
  stopSound: async () => {},
  fadeOutSound: async () => {},
  playSegmentMusic: async () => {},
  loadMusicSettings: async () => {},
});

// Provider component
export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [selectedWorkoutMusic, setSelectedWorkoutMusic] = useState<any>(null);
  const [selectedBreakMusic, setSelectedBreakMusic] = useState<any>(null);
  const [selectedSuccessSound, setSelectedSuccessSound] = useState<any>(null);

  // Get workoutMusic, breakMusic, and successSound from useData hook
  const { workoutMusic, breakMusic, successSound } = useData();

  // Initialize audio system
  useEffect(() => {
    let isMounted = true;
    let initAttempts = 0;
    const maxInitAttempts = 3;

    const initAudio = async () => {
      try {
        // Request permissions
        const permissionResponse = await Audio.requestPermissionsAsync();
        if (!permissionResponse.granted) {
          console.warn('Audio permissions not granted');
          return;
        }

        // For Android, explicitly enable audio before setting mode
        if (Platform.OS === 'android') {
          try {
            await Audio.setIsEnabledAsync(true);
          } catch (error) {
            console.warn('Error enabling audio on Android:', error);
          }
        }

        // Set audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });

        // Verify audio system is working by creating and immediately releasing a sound
        try {
          const verificationSound = new Audio.Sound();
          // Use a simple sound file for verification if available
          const soundFile =
            workoutMusic.length > 0 ? workoutMusic[0].value : require('../assets/sounds/yeah.mp3');
          await verificationSound.loadAsync(soundFile);
          await verificationSound.unloadAsync();
        } catch (verifyError) {
          console.error('Audio verification failed:', verifyError);
          throw verifyError; // Re-throw to trigger retry
        }

        if (isMounted) {
          setAudioReady(true);
          console.log('Audio system initialized and ready');
        }
      } catch (error) {
        console.error('Error initializing audio system:', error);

        // Retry with increasing delay
        if (initAttempts < maxInitAttempts && isMounted) {
          initAttempts++;
          const delay = 1000 * initAttempts; // Increase delay with each attempt
          console.log(
            `Retrying audio initialization in ${
              delay / 1000
            }s (attempt ${initAttempts}/${maxInitAttempts})`
          );
          setTimeout(initAudio, delay);
        }
      }
    };

    // Only initialize audio if we have music data
    if (workoutMusic.length > 0 || breakMusic.length > 0 || successSound.length > 0) {
      initAudio();
    }

    return () => {
      isMounted = false;
      stopSound();
    };
  }, [workoutMusic, breakMusic, successSound]); // Add dependencies to re-init if audio data changes

  // Load music settings once audio is ready
  useEffect(() => {
    if (
      audioReady &&
      (workoutMusic.length > 0 || breakMusic.length > 0 || successSound.length > 0)
    ) {
      loadMusicSettings();
    }
  }, [audioReady, workoutMusic, breakMusic, successSound]);

  // Stop sound function
  const stopSound = async () => {
    if (!currentSound) return;

    try {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded) {
        if ((status as AVPlaybackStatusSuccess).isPlaying) {
          await currentSound.stopAsync();
        }
        await currentSound.unloadAsync();
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    } finally {
      currentSound = null;
      setIsPlaying(false);
    }
  };

  // Load music settings from AsyncStorage
  const loadMusicSettings = async () => {
    if (!audioReady) {
      console.log('Audio not ready yet');
      return;
    }

    // Check if we have any music data
    if (workoutMusic.length === 0 && breakMusic.length === 0 && successSound.length === 0) {
      console.log('No music data available');
      return;
    }

    try {
      const storedWorkoutMusic = (await AsyncStorage.getItem('workoutMusic')) || 'Upbeat';
      const storedBreakMusic = (await AsyncStorage.getItem('breakMusic')) || 'Chill';
      const storedSuccessSound = (await AsyncStorage.getItem('successSound')) || 'Yeah';

      const workoutFile = getSoundFileByLabel(storedWorkoutMusic);
      const breakFile = getSoundFileByLabel(storedBreakMusic);
      const successFile = getSoundFileByLabel(storedSuccessSound);

      if (workoutFile) {
        setSelectedWorkoutMusic(workoutFile);
      } else {
        console.warn('Could not find workout music for:', storedWorkoutMusic);
        if (workoutMusic.length > 0) setSelectedWorkoutMusic(workoutMusic[0].value);
      }

      if (breakFile) {
        setSelectedBreakMusic(breakFile);
      } else {
        console.warn('Could not find break music for:', storedBreakMusic);
        if (breakMusic.length > 0) setSelectedBreakMusic(breakMusic[0].value);
      }

      if (successFile) {
        setSelectedSuccessSound(successFile);
      } else {
        console.warn('Could not find success sound for:', storedSuccessSound);
        if (successSound.length > 0) setSelectedSuccessSound(successSound[0].value);
      }
    } catch (error) {
      console.error('Error loading music settings:', error);

      // Set defaults if there's an error
      if (workoutMusic.length > 0) setSelectedWorkoutMusic(workoutMusic[0].value);
      if (breakMusic.length > 0) setSelectedBreakMusic(breakMusic[0].value);
      if (successSound.length > 0) setSelectedSuccessSound(successSound[0].value);
    }
  };

  // Helper function to find sound file by label
  const getSoundFileByLabel = (label: string) => {
    try {
      // Check workoutMusic
      if (workoutMusic && Array.isArray(workoutMusic)) {
        const workoutMatch = workoutMusic.find((music) => music && music.label === label);
        if (workoutMatch && workoutMatch.value) return workoutMatch.value;
      }

      // Check breakMusic
      if (breakMusic && Array.isArray(breakMusic)) {
        const breakMatch = breakMusic.find((music) => music && music.label === label);
        if (breakMatch && breakMatch.value) return breakMatch.value;
      }

      // Check successSound
      if (successSound && Array.isArray(successSound)) {
        const successMatch = successSound.find((sound) => sound && sound.label === label);
        if (successMatch && successMatch.value) return successMatch.value;
      }

      // Default fallbacks
      if (workoutMusic?.length > 0) return workoutMusic[0].value;
      if (breakMusic?.length > 0) return breakMusic[0].value;
      if (successSound?.length > 0) return successSound[0].value;

      return null;
    } catch (error) {
      console.error('Error finding sound by label:', error);
      return null;
    }
  };

  // Helper to get a random track by label
  const getRandomTrackByLabel = (musicArray: any[], label: string) => {
    const filtered = musicArray.filter((item) =>
      item.label && item.label.toLowerCase().includes(label.toLowerCase())
    );
    if (filtered.length === 0) return null;
    // Shuffle the array to ensure a new random order each time
    const shuffled = filtered
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    return shuffled[0].value;
  };

  // Play sound function with validation and error handling
  const playSound = async (
    soundFile: any,
    loop: boolean = true,
    volume: number = 1.0,
    callback?: () => void
  ) => {
    if (!audioReady) {
      console.warn('Audio system not ready');
      return null;
    }

    if (!soundFile) {
      console.error('Cannot play null sound file');
      return null;
    }

    try {
      // Clean up existing sound first
      await stopSound();

      // For Android, add small delay before creating new sound
      if (Platform.OS === 'android') {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const { sound } = await Audio.Sound.createAsync(soundFile, {
        volume: volume,
        isLooping: loop,
        progressUpdateIntervalMillis: 1000,
      });

      // Store reference in the module-scoped variable
      currentSound = sound;
      setIsPlaying(true);

      // Set up status monitoring
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if ((status as AVPlaybackStatusSuccess).didJustFinish && !loop) {
            sound.unloadAsync().catch((e) => console.error('Error unloading sound:', e));
            setIsPlaying(false);
            callback && callback();
            currentSound = null;
          }
        } else if (status.error) {
          console.error('Playback error:', status.error);
          setIsPlaying(false);
          currentSound = null;
        }
      });

      // Start playback and wait for it to finish
      await sound.playAsync();
      return sound;
    } catch (error) {
      console.error('Error playing sound:', error);
      currentSound = null;
      setIsPlaying(false);
      return null;
    }
  };

  // Fade out sound function
  const fadeOutSound = async () => {
    try {
      // First check if we have a sound to fade
      if (!currentSound) {
        return;
      }

      // Get current status to check if it's playing
      const status = await currentSound.getStatusAsync();
      if (!status.isLoaded || !(status as AVPlaybackStatusSuccess).isPlaying) {
        return;
      }

      // Start with current volume or default to 1
      let volume = (status as AVPlaybackStatusSuccess).volume ?? 1;
      const duration = 800; // ms per step
      const steps = 5;
      const decrement = volume / steps;

      // Gradually reduce volume
      for (let i = 0; i < steps; i++) {
        volume = Math.max(volume - decrement, 0);
        await currentSound.setVolumeAsync(volume);
        await new Promise((resolve) => setTimeout(resolve, duration));
      }
    } catch (error) {
      console.error('Error during fadeout:', error);
    }
  };

  // Play segment-specific music
  const playSegmentMusic = async (segment: string, callback?: () => void) => {
    if (!audioReady) return;

    if (segment === 'workout') {
      const workoutMusicValue = await AsyncStorage.getItem('workoutMusic');
      if (workoutMusicValue === 'random:Action') {
        const randomAction = getRandomTrackByLabel(workoutMusic, 'action:');
        if (randomAction) {
          await playSound(randomAction, true);
          return;
        }
      } else {
        await playSound(selectedWorkoutMusic, true);
      }
    } else if (segment === 'break') {
      const breakMusicValue = await AsyncStorage.getItem('breakMusic');
      if (breakMusicValue === 'random:Chill') {
        const randomChill = getRandomTrackByLabel(breakMusic, 'chill:');
        if (randomChill) {
          await playSound(randomChill, true);
          return;
        }
      }else {
        console.log('Playing selected break music');
        await playSound(selectedBreakMusic, true);
      }
    } else if (segment === 'successSound' && selectedSuccessSound) {
      await playSound(selectedSuccessSound, false, 1.0, callback);
    } else {
      console.warn('No matching music for segment:', segment);
    }
  };

  const contextValue = {
    isPlaying,
    audioReady,
    selectedWorkoutMusic,
    selectedBreakMusic,
    selectedSuccessSound,
    playSound,
    stopSound,
    fadeOutSound,
    playSegmentMusic,
    loadMusicSettings,
  };

  return <SoundContext.Provider value={contextValue}>{children}</SoundContext.Provider>;
};

// Custom hook for using the sound context
export const useSound = () => useContext(SoundContext);
