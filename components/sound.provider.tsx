import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  const isLoadingSoundRef = useRef(false);
  const isPlayingSegmentRef = useRef<string | null>(null);
  const playSoundInProgressRef = useRef(false);
  const globalSoundLockRef = useRef(false);

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

  const stopSound = async (preserveGlobalLock: boolean = false) => {
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
      // Clear all locks when sound is stopped, unless preserving global lock
      isPlayingSegmentRef.current = null;
      playSoundInProgressRef.current = false;
      if (!preserveGlobalLock) {
        globalSoundLockRef.current = false;
      }
    }
  };

  const loadMusicSettings = async () => {
    if (!audioReady) {
      return;
    }

    if (workoutMusic.length === 0 && breakMusic.length === 0 && successSound.length === 0) {
      return;
    }

    try {
      const workoutFile = getSoundFileByLabel(selectedWorkoutMusic);
      const breakFile = getSoundFileByLabel(selectedBreakMusic);
      const successFile = getSoundFileByLabel(selectedSuccessSound);
      const nextExerciseFile = getSoundFileByLabel(selectedNextExerciseSound);

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
        if (successSound.length > 0) {
          setSelectedSuccessSoundFile(successSound[0].value);
        }
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
      // First check success sounds specifically for success-related labels
      if (label && label.toLowerCase().includes('success')) {
        if (successSound && Array.isArray(successSound)) {
          const successMatch = successSound.find((sound) => sound && sound.label === label);
          if (successMatch && successMatch.value) {
            return successMatch.value;
          }
        }
      }
      
      // Check workout music for workout-related labels
      if (label && (label.toLowerCase().includes('action') || label.toLowerCase().includes('upbeat') || label.toLowerCase().includes('chill'))) {
        if (workoutMusic && Array.isArray(workoutMusic)) {
          const workoutMatch = workoutMusic.find((music) => music && music.label === label);
          if (workoutMatch && workoutMatch.value) {
            return workoutMatch.value;
          }
        }
      }
      
      // Check break music for break-related labels
      if (label && label.toLowerCase().includes('break')) {
        if (breakMusic && Array.isArray(breakMusic)) {
          const breakMatch = breakMusic.find((music) => music && music.label === label);
          if (breakMatch && breakMatch.value) {
            return breakMatch.value;
          }
        }
      }
      
      // Check next exercise sound
      if (nextExerciseSound && nextExerciseSound.label === label) {
        return nextExerciseSound.value;
      }
      
      // Fallback: search all arrays in order (but this should be avoided)
      if (successSound && Array.isArray(successSound)) {
        const successMatch = successSound.find((sound) => sound && sound.label === label);
        if (successMatch && successMatch.value) {
          return successMatch.value;
        }
      }

      if (workoutMusic && Array.isArray(workoutMusic)) {
        const workoutMatch = workoutMusic.find((music) => music && music.label === label);
        if (workoutMatch && workoutMatch.value) {
          return workoutMatch.value;
        }
      }

      if (breakMusic && Array.isArray(breakMusic)) {
        const breakMatch = breakMusic.find((music) => music && music.label === label);
        if (breakMatch && breakMatch.value) {
          return breakMatch.value;
        }
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
    
    if (filtered.length === 0) {
      console.warn('No tracks found matching label:', label);
      return null;
    }

    // Generate a truly random index each time
    const randomIndex = Math.floor(Math.random() * filtered.length);
    const selectedTrack = filtered[randomIndex];
    
    return selectedTrack.value;
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

    // Prevent overlapping playSound calls
    if (playSoundInProgressRef.current) {
      return null;
    }

    // Don't check global lock here since playSegmentMusic manages it
    // The global lock is meant to prevent external overlapping calls, not internal ones

    try {
      playSoundInProgressRef.current = true;

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

      await stopSound();
      await new Promise((resolve) => setTimeout(resolve, 150));

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
    } finally {
      // Always clear the lock when done
      playSoundInProgressRef.current = false;
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
      const steps = 5; // Fewer steps for simpler, faster fadeout
      const stepDuration = 400; // Shorter duration per step
      const decrement = volume / steps;

      for (let i = 0; i < steps; i++) {
        volume = Math.max(volume - decrement, 0);
        if (currentSound) {
          await currentSound.setVolumeAsync(volume);
        }
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
      }
    } catch (error) {
      console.error('Error during fadeout:', error);
    }
  };

  const playSegmentMusic = async (segment: string, callback?: () => void) => {
    if (!audioReady) {
      return;
    }

    // Check if we're already playing this exact segment
    if (isPlayingSegmentRef.current === segment) {
      return;
    }

    // Global lock to prevent any overlapping sound operations
    if (globalSoundLockRef.current) {
      return;
    }

    try {
      globalSoundLockRef.current = true;
      
      // Only stop existing sound if we're switching to a different segment
      // Don't stop if we're just re-triggering the same segment
      if (isPlayingSegmentRef.current && isPlayingSegmentRef.current !== segment) {
        // Don't clear the global lock when stopping sound during playSegmentMusic
        const preserveGlobalLock = true;
        await stopSound(preserveGlobalLock);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else if (!isPlayingSegmentRef.current) {
        // No existing sound, proceeding with new segment
      }
      
      // Update the segment reference before playing
      isPlayingSegmentRef.current = segment;

      if (segment === 'workout') {
      if (selectedWorkoutMusic === 'random:Action') {
        const playRandom = async () => {
          const randomAction = getRandomTrackByLabel(workoutMusic, 'action');
          if (randomAction) {
            await playSound(randomAction, false, 1.0, undefined, playRandom);
          } else {
            console.warn('No action music found for random selection');
          }
        };
        await playRandom();
        return;
      } else if (selectedWorkoutMusic === 'random:Chill') {
        const playRandom = async () => {
          const randomChill = getRandomTrackByLabel(workoutMusic, 'chill');
          if (randomChill) {
            await playSound(randomChill, false, 1.0, undefined, playRandom);
          } else {
            console.warn('No chill music found for random selection');
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
          const randomChill = getRandomTrackByLabel(breakMusic, 'chill');
          if (randomChill) {
            await playSound(randomChill, false, 1.0, undefined, playRandom);
          } else {
            console.warn('No chill break music found for random selection');
          }
        };
        await playRandom();
        return;
      } else {
        await playSound(selectedBreakFile, true);
      }
    } else if (segment === 'successSound') {
      if (selectedSuccessFile) {
        await playSound(selectedSuccessFile, false, 1.0, callback);
      } else {
        console.warn('No success sound file available, using fallback');
        // Fallback to first available success sound if selectedSuccessFile is not set
        if (successSound && successSound.length > 0) {
          await playSound(successSound[0].value, false, 1.0, callback);
        }
      }
    } else if (segment === 'nextExerciseSound') {
      if (selectedNextExerciseFile) {
        await playSound(selectedNextExerciseFile, false, 1.0, callback);
      } else {
        console.warn('No next exercise sound file available, using fallback');
        // Fallback to nextExerciseSound if selectedNextExerciseFile is not set
        if (nextExerciseSound) {
          await playSound(nextExerciseSound.value, false, 1.0, callback);
        }
      }
    } else {
      console.warn('No matching music for segment:', segment);
    }
    
    } catch (error) {
      console.error('Error in playSegmentMusic:', error);
    } finally {
      // Clear both locks when done
      isPlayingSegmentRef.current = null;
      globalSoundLockRef.current = false;
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
