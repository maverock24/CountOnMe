import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

let currentSound: Audio.Sound | null = null;

interface SoundContextType {
  isPlaying: boolean;
  audioReady: boolean;
  selectedWorkoutFile: any;
  selectedBreakFile: any;
  selectedSuccessFile: any;
  selectedNextExerciseFile: any;
  playSound: (soundFile: any, loop?: boolean, volume?: number) => Promise<Audio.Sound | null>;
  stopSound: () => Promise<void>;
  fadeOutSound: () => Promise<void>;
  playSegmentMusic: (segment: string, callback?: () => void) => Promise<void>;
  loadMusicSettings: () => Promise<void>;
}

const SoundContext = createContext<SoundContextType>({
  isPlaying: false,
  audioReady: false,
  selectedWorkoutFile: null,
  selectedBreakFile: null,
  selectedSuccessFile: null,
  selectedNextExerciseFile: null,
  playSound: async () => null,
  stopSound: async () => {},
  fadeOutSound: async () => {},
  playSegmentMusic: async () => {},
  loadMusicSettings: async () => {},
});

export const SoundProvider: React.FC<{
  children: React.ReactNode;
  workoutMusic: any[];
  breakMusic: any[];
  successSound: any[];
  nextExerciseSound: any;
  selectedWorkoutMusic: string;
  selectedBreakMusic: string;
  selectedSuccessSound: string;
  selectedNextExerciseSound: string;
  setCurrentMusicBeingPlayed: (label: string) => void;
}> = ({
  children,
  workoutMusic,
  breakMusic,
  successSound,
  nextExerciseSound,
  setCurrentMusicBeingPlayed,
  selectedBreakMusic,
  selectedSuccessSound,
  selectedWorkoutMusic,
  selectedNextExerciseSound,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const [selectedWorkoutFile, setSelectedWorkoutMusicFile] = useState();
  const [selectedBreakFile, setSelectedBreakMusicFile] = useState();
  const [selectedSuccessFile, setSelectedSuccessSoundFile] = useState();
  const [selectedNextExerciseFile, setSelectedNextExerciseSoundFile] = useState();

  useEffect(() => {
    let isMounted = true;
    let initAttempts = 0;
    const maxInitAttempts = 3;

    const initAudio = async () => {
      try {
        const permissionResponse = await Audio.requestPermissionsAsync();
        if (!permissionResponse.granted) {
          console.warn('Audio permissions not granted');
          return;
        }

        if (Platform.OS === 'android') {
          try {
            await Audio.setIsEnabledAsync(true);
          } catch (error) {
            console.warn('Error enabling audio on Android:', error);
          }
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });

        try {
          const verificationSound = new Audio.Sound();

          const soundFile =
            workoutMusic.length > 0 ? workoutMusic[0].value : require('../assets/sounds/yeah.mp3');
          await verificationSound.loadAsync(soundFile);
          await verificationSound.unloadAsync();
        } catch (verifyError) {
          console.error('Audio verification failed:', verifyError);
          throw verifyError;
        }

        if (isMounted) {
          setAudioReady(true);
          console.log('Audio system initialized and ready');
        }
      } catch (error) {
        console.error('Error initializing audio system:', error);

        if (initAttempts < maxInitAttempts && isMounted) {
          initAttempts++;
          const delay = 1000 * initAttempts;
          console.log(
            `Retrying audio initialization in ${
              delay / 1000
            }s (attempt ${initAttempts}/${maxInitAttempts})`
          );
          setTimeout(initAudio, delay);
        }
      }
    };

    if (workoutMusic.length > 0 || breakMusic.length > 0 || successSound.length > 0) {
      initAudio();
    }

    return () => {
      isMounted = false;
      stopSound();
    };
  }, [workoutMusic, breakMusic, successSound]);

  useEffect(() => {
    if (
      audioReady &&
      (workoutMusic.length > 0 || breakMusic.length > 0 || successSound.length > 0)
    ) {
      loadMusicSettings();
    }
  }, [audioReady, workoutMusic, breakMusic, successSound]);

  // React to changes in selected music
  useEffect(() => {
    if (audioReady) {
      loadMusicSettings();
    }
  }, [selectedWorkoutMusic, selectedBreakMusic, selectedSuccessSound, selectedNextExerciseSound, audioReady]);

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

  const loadMusicSettings = async () => {
    console.log('loadMusicSettings called with:', {
      selectedWorkoutMusic,
      selectedBreakMusic,
      selectedSuccessSound,
      selectedNextExerciseSound,
      audioReady
    });
    
    if (!audioReady) {
      console.log('Audio not ready yet');
      return;
    }

    if (workoutMusic.length === 0 && breakMusic.length === 0 && successSound.length === 0) {
      console.log('No music data available');
      return;
    }

    try {
      const workoutFile = getSoundFileByLabel(selectedWorkoutMusic);
      console.log('Selected workout music file:', selectedWorkoutMusic, '→', workoutFile);
      const breakFile = getSoundFileByLabel(selectedBreakMusic);
      console.log('Selected break music file:', selectedBreakMusic, '→', breakFile);
      const successFile = getSoundFileByLabel(selectedSuccessSound);
      console.log('Selected success sound file:', selectedSuccessSound, '→', successFile);
      const nextExerciseFile = getSoundFileByLabel(selectedNextExerciseSound);
      console.log('Selected next exercise sound file:', selectedNextExerciseSound, '→', nextExerciseFile);

      if (workoutFile) {
        setSelectedWorkoutMusicFile(workoutFile);
      } else {
        console.warn('Could not find workout music for:', selectedWorkoutMusic);
        if (workoutMusic.length > 0) setSelectedWorkoutMusicFile(workoutMusic[0].value);
      }

      if (breakFile) {
        setSelectedBreakMusicFile(breakFile);
      } else {
        console.warn('Could not find break music for:', selectedBreakMusic);
        if (breakMusic.length > 0) setSelectedBreakMusicFile(breakMusic[0].value);
      }

      if (successFile) {
        setSelectedSuccessSoundFile(successFile);
      } else {
        console.warn('Could not find success sound for:', selectedSuccessSound);
        if (successSound.length > 0) setSelectedSuccessSoundFile(successSound[0].value);
      }

      if (nextExerciseFile) {
        setSelectedNextExerciseSoundFile(nextExerciseFile);
      } else {
        console.warn('Could not find next exercise sound for:', selectedNextExerciseSound);
        if (nextExerciseSound) setSelectedNextExerciseSoundFile(nextExerciseSound.value);
      }
    } catch (error) {
      console.error('Error loading music settings:', error);

      if (workoutMusic.length > 0) setSelectedWorkoutMusicFile(workoutMusic[0].value);
      if (breakMusic.length > 0) setSelectedBreakMusicFile(breakMusic[0].value);
      if (successSound.length > 0) setSelectedSuccessSoundFile(successSound[0].value);
      if (nextExerciseSound) setSelectedNextExerciseSoundFile(nextExerciseSound.value);
    }
  };

  const getSoundFileByLabel = (label: string) => {
    try {
      if (workoutMusic && Array.isArray(workoutMusic)) {
        const workoutMatch = workoutMusic.find((music) => music && music.label === label);
        if (workoutMatch && workoutMatch.value) return workoutMatch.value;
      }

      if (breakMusic && Array.isArray(breakMusic)) {
        const breakMatch = breakMusic.find((music) => music && music.label === label);
        if (breakMatch && breakMatch.value) return breakMatch.value;
      }

      if (successSound && Array.isArray(successSound)) {
        const successMatch = successSound.find((sound) => sound && sound.label === label);
        if (successMatch && successMatch.value) return successMatch.value;
      }

      if (nextExerciseSound && nextExerciseSound.label === label) {
        return nextExerciseSound.value;
      }

      if (workoutMusic?.length > 0) return workoutMusic[0].value;
      if (breakMusic?.length > 0) return breakMusic[0].value;
      if (successSound?.length > 0) return successSound[0].value;

      return null;
    } catch (error) {
      console.error('Error finding sound by label:', error);
      return null;
    }
  };

  const getRandomTrackByLabel = (musicArray: any[], label: string) => {
    const filtered = musicArray.filter(
      (item) => item.label && item.label.toLowerCase().includes(label.toLowerCase())
    );
    if (filtered.length === 0) return null;

    const shuffled = filtered
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    return shuffled[0].value;
  };

  const playSound = async (
    soundFile: any,
    loop: boolean = true,
    volume: number = 1.0,
    callback?: () => void,
    onFinish?: () => void
  ) => {
    if (!audioReady) {
      console.warn('Audio system not ready');
      return null;
    }

    if (!soundFile) {
      console.error('Cannot play null sound file');
      return null;
    }

    let foundLabel: string | null = null;
    const allMusic = [...(workoutMusic || []), ...(breakMusic || []), ...(successSound || []), nextExerciseSound];
    for (const item of allMusic) {
      if (item && item.value) {
        if (
          item.value === soundFile ||
          (item.value?.uri && soundFile?.uri && item.value.uri === soundFile.uri) ||
          (typeof item.value === 'string' &&
            typeof soundFile === 'string' &&
            item.value === soundFile) ||
          (typeof item.value === 'object' &&
            typeof soundFile === 'object' &&
            JSON.stringify(item.value) === JSON.stringify(soundFile))
        ) {
          foundLabel = item.label;
          break;
        }
      }
    }
    if (foundLabel) {
      setCurrentMusicBeingPlayed(foundLabel);
    }

    try {
      await stopSound();
      await new Promise((resolve) => setTimeout(resolve, 150));
      console.log('Playing sound file:', foundLabel || soundFile);

      if (Platform.OS === 'android') {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const { sound } = await Audio.Sound.createAsync(soundFile, {
        volume: volume,
        isLooping: loop,
        progressUpdateIntervalMillis: 1000,
      });

      currentSound = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          if ((status as AVPlaybackStatusSuccess).didJustFinish && !loop) {
            sound.unloadAsync().catch((e) => console.error('Error unloading sound:', e));
            setIsPlaying(false);
            callback && callback();
            currentSound = null;
            if (onFinish) onFinish();
          }
        } else if (status.error) {
          console.error('Playback error:', status.error);
          setIsPlaying(false);
          currentSound = null;
        }
      });

      await sound.playAsync();
      return sound;
    } catch (error) {
      console.error('Error playing sound:', error);
      currentSound = null;
      setIsPlaying(false);
      return null;
    }
  };

  const fadeOutSound = async () => {
    try {
      if (!currentSound) {
        return;
      }

      const status = await currentSound.getStatusAsync();
      if (!status.isLoaded || !(status as AVPlaybackStatusSuccess).isPlaying) {
        return;
      }

      let volume = (status as AVPlaybackStatusSuccess).volume ?? 1;
      const duration = 800;
      const steps = 5;
      const decrement = volume / steps;

      for (let i = 0; i < steps; i++) {
        volume = Math.max(volume - decrement, 0);
        await currentSound.setVolumeAsync(volume);
        await new Promise((resolve) => setTimeout(resolve, duration));
      }
    } catch (error) {
      console.error('Error during fadeout:', error);
    }
  };

  const playSegmentMusic = async (segment: string, callback?: () => void) => {
    console.log('playSegmentMusic called for segment:', segment);
    if (!audioReady) return;

    await stopSound();
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (segment === 'workout') {
      if (selectedWorkoutMusic === 'random:Action') {
        const playRandom = async () => {
          const randomAction = getRandomTrackByLabel(workoutMusic, 'action:');
          if (randomAction) {
            await playSound(randomAction, false, 1.0, undefined, playRandom);
          }
        };
        await playRandom();
        return;
      } else if (selectedWorkoutMusic === 'random:Chill') {
        const playRandom = async () => {
          const randomChill = getRandomTrackByLabel(workoutMusic, 'chill:');
          if (randomChill) {
            await playSound(randomChill, false, 1.0, undefined, playRandom);
          }
        };
        await playRandom();
        return;
      } else {
        await playSound(selectedWorkoutFile, true);
      }
    } else if (segment === 'break') {
      if (selectedBreakMusic === 'random:Chill') {
        const playRandom = async () => {
          const randomChill = getRandomTrackByLabel(breakMusic, 'chill:');
          if (randomChill) {
            await playSound(randomChill, false, 1.0, undefined, playRandom);
          }
        };
        await playRandom();
        return;
      } else {
        console.log('Playing selected break music');
        await playSound(selectedBreakFile, true);
      }
    } else if (segment === 'successSound' && selectedSuccessSound) {
      await playSound(selectedSuccessFile, false, 1.0, callback);
    } else if (segment === 'nextExerciseSound' && selectedNextExerciseSound) {
      await playSound(selectedNextExerciseFile, false, 1.0, callback);
    } else {
      console.warn('No matching music for segment:', segment);
    }
  };

  const contextValue = {
    isPlaying,
    audioReady,
    selectedWorkoutFile,
    selectedBreakFile,
    selectedSuccessFile,
    selectedNextExerciseFile,
    playSound,
    stopSound,
    fadeOutSound,
    playSegmentMusic,
    loadMusicSettings,
  };

  return <SoundContext.Provider value={contextValue}>{children}</SoundContext.Provider>;
};

export const useSound = () => useContext(SoundContext);
