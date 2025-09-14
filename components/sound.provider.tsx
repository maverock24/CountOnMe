import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { getBlob } from './data/indexeddb';

let currentSound: Audio.Sound | null = null;

interface SoundContextType {
  isPlaying: boolean;
  isAudioReady: boolean;
  selectedWorkoutFile: any;
  selectedBreakFile: any;
  selectedSuccessFile: any;
  selectedNextExerciseFile: any;
  playSound: (soundFile: any, loop?: boolean, volume?: number, callback?: () => void, onFinish?: () => void) => Promise<Audio.Sound | null>;
  stopSound: (preserveGlobalLock?: boolean) => Promise<void>;
  fadeOutSound: () => Promise<void>;
  playSegmentMusic: (segment: string, callback?: () => void) => Promise<void>;
  loadMusicSettings: () => Promise<void>;
  addCustomAudioFile: (label: string, uri: string) => Promise<void>;
  customAudioFiles: Map<string, { label: string; uri: string }>;
  getSoundFileByLabel: (label: string) => Promise<any>;
  playOverlaySound: (soundFile: any, volume?: number) => Promise<void>;
  selectedWorkoutMusic: string;
  selectedBreakMusic: string;
  selectedSuccessSound: string;
  updateSelectedWorkoutMusic: (value: string) => void;
  updateSelectedBreakMusic: (value: string) => void;
  updateSelectedSuccessSound: (value: string) => void;
}

const SoundContext = createContext<SoundContextType>({
  isPlaying: false,
  isAudioReady: false,
  selectedWorkoutFile: null,
  selectedBreakFile: null,
  selectedSuccessFile: null,
  selectedNextExerciseFile: null,
  playSound: async () => null,
  stopSound: async () => {},
  fadeOutSound: async () => {},
  playSegmentMusic: async () => {},
  loadMusicSettings: async () => {},
  addCustomAudioFile: async () => {},
  customAudioFiles: new Map(),
  getSoundFileByLabel: async () => null,
  playOverlaySound: async () => {},
  selectedWorkoutMusic: '',
  selectedBreakMusic: '',
  selectedSuccessSound: '',
  updateSelectedWorkoutMusic: () => {},
  updateSelectedBreakMusic: () => {},
  updateSelectedSuccessSound: () => {},
});

export const SoundProvider: React.FC<{
  children: React.ReactNode;
  workoutMusic: any[];
  breakMusic: any[];
  successSound: any[];
  nextExerciseSound: any;
  setCurrentMusicBeingPlayed: (label: string) => void;
}> = ({
  children,
  workoutMusic,
  breakMusic,
  successSound,
  nextExerciseSound,
  setCurrentMusicBeingPlayed,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setAudioReady] = useState(false);
  const [selectedWorkoutMusic, setSelectedWorkoutMusic] = useState('random:Action');
  const [selectedBreakMusic, setSelectedBreakMusic] = useState('random:Chill');
  const [selectedSuccessSound, setSelectedSuccessSound] = useState('Crowd Cheer');

  useEffect(() => {
    console.log('[SoundProvider] Selected workout music state changed:', selectedWorkoutMusic);
  }, [selectedWorkoutMusic]);

  useEffect(() => {
    console.log('[SoundProvider] Selected break music state changed:', selectedBreakMusic);
  }, [selectedBreakMusic]);

  useEffect(() => {
    console.log('[SoundProvider] Selected success sound state changed:', selectedSuccessSound);
  }, [selectedSuccessSound]);

  const [selectedWorkoutFile, setSelectedWorkoutMusicFile] = useState<any>(null);
  const [selectedBreakFile, setSelectedBreakMusicFile] = useState<any>(null);
  const [selectedSuccessFile, setSelectedSuccessSoundFile] = useState<any>(null);
  const [selectedNextExerciseFile, setSelectedNextExerciseFile] = useState<any>(null);
  
  const [customAudioFiles, setCustomAudioFiles] = useState<Map<string, { label: string; uri: string }>>(new Map());

  const playSoundInProgressRef = useRef(false);
  const globalSoundLockRef = useRef(false);
  const isPlayingSegmentRef = useRef<string | null>(null);

  const selectedWorkoutLabelRef = useRef<string | null>(null);
  const selectedBreakLabelRef = useRef<string | null>(null);
  const selectedSuccessLabelRef = useRef<string | null>(null);
  const selectedNextExerciseLabelRef = useRef<string | null>(null);

  const updateSelectedWorkoutMusic = (value: string) => {
    console.log(`[SoundProvider] Updating selectedWorkoutMusic from "${selectedWorkoutMusic}" to "${value}"`);
    setSelectedWorkoutMusic(value);
  };

  const updateSelectedBreakMusic = (value: string) => {
    console.log(`[SoundProvider] Updating selectedBreakMusic from "${selectedBreakMusic}" to "${value}"`);
    setSelectedBreakMusic(value);
  };

  const updateSelectedSuccessSound = (value: string) => {
    console.log(`[SoundProvider] Updating selectedSuccessSound from "${selectedSuccessSound}" to "${value}"`);
    setSelectedSuccessSound(value);
  };

  const deriveLabelFromSource = (source: any): string => {
    if (!source) return 'Unknown';
    const uri = typeof source === 'string' ? source : source.uri;
    if (!uri) return 'Unknown';
    try {
      return decodeURIComponent(uri.split('/').pop() || 'Unknown');
    } catch {
      return uri.split('/').pop() || 'Unknown';
    }
  };

  const getSoundFileByLabel = async (label: string) => {
    console.log(`[getSoundFileByLabel] Searching for label: "${label}"`);
    if (label === 'web-reselect') {
      console.log('[getSoundFileByLabel] Found "web-reselect", returning null.');
      return null;
    }

    if (customAudioFiles.has(label)) {
      const file = customAudioFiles.get(label);
      if (file) {
        console.log(`[getSoundFileByLabel] Found in custom audio files map. URI: "${file.uri}"`);
        if (file.uri === 'web-reselect') {
          console.log('[getSoundFileByLabel] Custom file is "web-reselect", returning null.');
          return null;
        }
        
        // Handle IndexedDB stored files
        if (file.uri.startsWith('indexeddb:')) {
          const fileKey = file.uri.replace('indexeddb:', '');
          console.log(`[getSoundFileByLabel] Retrieving blob from IndexedDB with key: ${fileKey}`);
          try {
            const blob = await getBlob(fileKey);
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              console.log(`[getSoundFileByLabel] Created blob URL: ${blobUrl}`);
              return { uri: blobUrl };
            } else {
              console.warn(`[getSoundFileByLabel] No blob found in IndexedDB for key: ${fileKey}`);
              return null;
            }
          } catch (error) {
            console.error(`[getSoundFileByLabel] Error retrieving blob from IndexedDB:`, error);
            return null;
          }
        }
        
        return { uri: file.uri };
      }
    }
    
    if (label && (label.startsWith('file:') || label.startsWith('content:') || label.startsWith('http') || label.startsWith('data:') || label.startsWith('indexeddb:'))) {
      console.log('[getSoundFileByLabel] Label is a direct URI, processing...');
      
      // Handle IndexedDB URIs
      if (label.startsWith('indexeddb:')) {
        const fileKey = label.replace('indexeddb:', '');
        console.log(`[getSoundFileByLabel] Retrieving blob from IndexedDB with key: ${fileKey}`);
        try {
          const blob = await getBlob(fileKey);
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            console.log(`[getSoundFileByLabel] Created blob URL: ${blobUrl}`);
            return { uri: blobUrl };
          } else {
            console.warn(`[getSoundFileByLabel] No blob found in IndexedDB for key: ${fileKey}`);
            return null;
          }
        } catch (error) {
          console.error(`[getSoundFileByLabel] Error retrieving blob from IndexedDB:`, error);
          return null;
        }
      }
      
      return { uri: label };
    }

    const allSounds = [...workoutMusic, ...breakMusic, ...successSound, nextExerciseSound];
    const match = allSounds.find(s => s && s.label === label);
    if (match) {
      console.log(`[getSoundFileByLabel] Found in provided sound lists.`);
      return match.value;
    }

    console.log('[getSoundFileByLabel] No match found. Falling back to default sounds.');
    if (workoutMusic?.length > 0) return workoutMusic[0].value;
    return null;
  };

  const loadMusicSettings = async () => {
    try {
      const wm = await AsyncStorage.getItem('@countOnMe_workoutMusic');
      const bm = await AsyncStorage.getItem('@countOnMe_breakMusic');
      const ss = await AsyncStorage.getItem('@countOnMe_successSound');

      if (wm) {
        console.log(`[loadMusicSettings] Setting workout music to: ${wm}`);
        updateSelectedWorkoutMusic(wm);
        const workoutFile = await getSoundFileByLabel(wm);
        if (workoutFile) {
          setSelectedWorkoutMusicFile(workoutFile);
        } else if (wm === 'web-reselect') {
          setSelectedWorkoutMusicFile(null);
        } else {
          updateSelectedWorkoutMusic('random:Action');
          setSelectedWorkoutMusicFile(await getSoundFileByLabel('random:Action'));
        }
      }
      if (bm) {
        console.log(`[loadMusicSettings] Setting break music to: ${bm}`);
        updateSelectedBreakMusic(bm);
        const breakFile = await getSoundFileByLabel(bm);
        if (breakFile) {
          setSelectedBreakMusicFile(breakFile);
        } else if (bm === 'web-reselect') {
          setSelectedBreakMusicFile(null);
        } else {
          updateSelectedBreakMusic('random:Chill');
          setSelectedBreakMusicFile(await getSoundFileByLabel('random:Chill'));
        }
      }
      if (ss) {
        console.log(`[loadMusicSettings] Setting success sound to: ${ss}`);
        updateSelectedSuccessSound(ss);
        const successFile = await getSoundFileByLabel(ss);
        if (successFile) {
          setSelectedSuccessSoundFile(successFile);
        } else if (ss === 'web-reselect') {
          setSelectedSuccessSoundFile(null);
        } else {
          updateSelectedSuccessSound('Crowd Cheer');
          setSelectedSuccessSoundFile(await getSoundFileByLabel('Crowd Cheer'));
        }
      }
    } catch (error) {
      console.error('Error loading music settings:', error);
    }
  };

  const stopSound = async (preserveGlobalLock = false) => {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (error) {
        console.error('Error stopping or unloading sound:', error);
      } finally {
        currentSound = null;
        setIsPlaying(false);
        if (!preserveGlobalLock) {
          globalSoundLockRef.current = false;
        }
        isPlayingSegmentRef.current = null;
      }
    }
  };

  const playSound = async (
    soundFile: any,
    loop: boolean = true,
    volume: number = 1.0,
    callback?: () => void,
    onFinish?: () => void
  ) => {
    if (!isAudioReady) {
      console.warn('Audio system not ready');
      return null;
    }

    if (!soundFile) {
      console.error('Cannot play null sound file');
      return null;
    }

    if (playSoundInProgressRef.current) {
      return null;
    }

    try {
      playSoundInProgressRef.current = true;

      let foundLabel: string | null = null;
      const getUri = (s: any) => (typeof s === 'string' ? s : s?.uri);
      const sfUri = getUri(soundFile);

      if (!foundLabel) {
        if (sfUri && getUri(selectedWorkoutFile) === sfUri) {
          foundLabel = selectedWorkoutLabelRef.current || deriveLabelFromSource(soundFile);
        } else if (sfUri && getUri(selectedBreakFile) === sfUri) {
          foundLabel = selectedBreakLabelRef.current || deriveLabelFromSource(soundFile);
        } else if (sfUri && getUri(selectedSuccessFile) === sfUri) {
          foundLabel = selectedSuccessLabelRef.current || deriveLabelFromSource(soundFile);
        } else if (sfUri && getUri(selectedNextExerciseFile) === sfUri) {
          foundLabel = selectedNextExerciseLabelRef.current || deriveLabelFromSource(soundFile);
        }
      }

      if (!foundLabel) {
        foundLabel = deriveLabelFromSource(soundFile);
      }
      if (foundLabel) {
        setCurrentMusicBeingPlayed(foundLabel);
      } else {
        setCurrentMusicBeingPlayed('');
      }

      await stopSound();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const { sound } = await Audio.Sound.createAsync(soundFile, {
        volume: volume,
        isLooping: loop,
      });

      currentSound = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          if ((status as AVPlaybackStatusSuccess).didJustFinish && !loop) {
            await stopSound();
            callback?.();
            onFinish?.();
          }
        } else if (status.error) {
          console.error('Playback error:', status.error);
          await stopSound();
        }
      });

      await sound.playAsync();
      return sound;
    } catch (error) {
      console.error('Error playing sound:', error);
      await stopSound();
      return null;
    } finally {
      playSoundInProgressRef.current = false;
    }
  };
  
  const playOverlaySound = async (soundFile: any, volume: number = 1.0) => {
    try {
      const { sound } = await Audio.Sound.createAsync(soundFile, { volume });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if ((status as AVPlaybackStatusSuccess).didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing overlay sound:', error);
    }
  };

  const fadeOutSound = async () => { /* ... implementation ... */ };
  const playSegmentMusic = async (segment: string, callback?: () => void) => { /* ... implementation ... */ };
  const addCustomAudioFile = async (label: string, uri: string) => { /* ... implementation ... */ };

  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
        setAudioReady(true);
        console.log('Audio system initialized and ready');
      } catch (e) {
        console.error('Failed to initialize audio system', e);
      }
    };
    initAudio();
    loadMusicSettings();
  }, []);

  const value = {
    isPlaying,
    isAudioReady,
    selectedWorkoutFile,
    selectedBreakFile,
    selectedSuccessFile,
    selectedNextExerciseFile,
    playSound,
    stopSound,
    fadeOutSound,
    playSegmentMusic,
    loadMusicSettings,
    addCustomAudioFile,
    customAudioFiles,
    getSoundFileByLabel,
    playOverlaySound,
    selectedWorkoutMusic,
    selectedBreakMusic,
    selectedSuccessSound,
    updateSelectedWorkoutMusic,
    updateSelectedBreakMusic,
    updateSelectedSuccessSound,
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = () => {
  return useContext(SoundContext);
};
