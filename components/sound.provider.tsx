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

  // Debug effect to track break file changes
  useEffect(() => {
    console.log('[SoundProvider] selectedBreakFile changed:', selectedBreakFile);
    console.log('[SoundProvider] selectedBreakMusic:', selectedBreakMusic);
  }, [selectedBreakFile, selectedBreakMusic]);

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
      // Handle blob URLs (show a more user-friendly name)
      if (uri.includes('blob:')) {
        return 'Custom Audio File';
      }
      // Handle regular file paths
      const filename = decodeURIComponent(uri.split('/').pop() || 'Unknown');
      // Clean up common file extensions and make it more readable
      return filename
        .replace(/\.(mp3|wav|aac|ogg|m4a)$/i, '')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim() || 'Unknown';
    } catch {
      const filename = uri.split('/').pop() || 'Unknown';
      return filename
        .replace(/\.(mp3|wav|aac|ogg|m4a)$/i, '')
        .replace(/_/g, ' ')
        .trim() || 'Unknown';
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

    // Check for random patterns first - handle both "random:Category" and "RANDOM_CATEGORY" formats
    if (label && (label.startsWith('random:') || label.startsWith('RANDOM_'))) {
      let category = '';
      if (label.startsWith('random:')) {
        category = label.replace('random:', '');
      } else if (label.startsWith('RANDOM_')) {
        // Convert RANDOM_CHILL to Chill, RANDOM_ACTION to Action
        category = label.replace('RANDOM_', '').toLowerCase();
        category = category.charAt(0).toUpperCase() + category.slice(1);
      }
      
      console.log(`[getSoundFileByLabel] Random category requested: "${category}" (from label: "${label}")`);
      console.log(`[getSoundFileByLabel] Available breakMusic count: ${breakMusic?.length}, workoutMusic count: ${workoutMusic?.length}`);
      
      if (category === 'Action' && workoutMusic?.length > 0) {
        const selected = workoutMusic[Math.floor(Math.random() * workoutMusic.length)];
        console.log(`[getSoundFileByLabel] Returning random workout music:`, selected);
        return selected.value;
      } else if (category === 'Chill' && breakMusic?.length > 0) {
        const selected = breakMusic[Math.floor(Math.random() * breakMusic.length)];
        console.log(`[getSoundFileByLabel] Returning random break music:`, selected);
        return selected.value;
      }
    }

    const allSounds = [...workoutMusic, ...breakMusic, ...successSound, nextExerciseSound];
    console.log(`[getSoundFileByLabel] Searching in ${allSounds.length} total sounds for label: "${label}"`);
    console.log(`[getSoundFileByLabel] First few sound labels:`, allSounds.slice(0, 5).map(s => s?.label));
    
    // First try to find by exact label match
    const labelMatch = allSounds.find(s => s && s.label === label);
    if (labelMatch) {
      console.log(`[getSoundFileByLabel] Found exact label match in provided sound lists:`, labelMatch);
      return labelMatch.value;
    }
    
    // If no label match, try to find by file path/value match (for direct file paths)
    if (label && (label.includes('/assets/') || label.includes('.mp3') || label.includes('.wav'))) {
      console.log(`[getSoundFileByLabel] Label appears to be a file path, searching by value...`);
      const valueMatch = allSounds.find(s => s && s.value && (
        s.value === label || 
        (typeof s.value === 'object' && s.value.uri === label) ||
        (typeof s.value === 'string' && s.value.includes(label.split('/').pop()?.split('?')[0] || ''))
      ));
      if (valueMatch) {
        console.log(`[getSoundFileByLabel] Found value match in provided sound lists:`, valueMatch);
        return valueMatch.value;
      }
    }

    console.log('[getSoundFileByLabel] No match found. Falling back to default sounds.');
    console.log(`[getSoundFileByLabel] Checking label "${label}" for break music indicators...`);
    
    // Return appropriate default based on context - first check if it's a break music request
    if (label && (label.includes('Chill') || label.includes('break') || label.includes('LoFi') || label.includes('Ambient') || label.includes('Moonphase') || label.includes('Patate'))) {
      console.log(`[getSoundFileByLabel] Label contains break music indicator, returning first break music`);
      if (breakMusic?.length > 0) {
        console.log(`[getSoundFileByLabel] Returning break music fallback:`, breakMusic[0]);
        return breakMusic[0].value;
      }
    }
    
    // Default to workout music
    console.log(`[getSoundFileByLabel] Defaulting to workout music`);
    if (workoutMusic?.length > 0) {
      console.log(`[getSoundFileByLabel] Returning workout music fallback:`, workoutMusic[0]);
      return workoutMusic[0].value;
    }
    return null;
  };

  const loadMusicSettings = async () => {
    try {
      const wm = await AsyncStorage.getItem('@countOnMe_workoutMusic');
      const bm = await AsyncStorage.getItem('@countOnMe_breakMusic');
      const ss = await AsyncStorage.getItem('@countOnMe_successSound');
      
      // Load labels for display purposes
      const wmLabel = await AsyncStorage.getItem('@countOnMe_workoutMusicLabel');
      const bmLabel = await AsyncStorage.getItem('@countOnMe_breakMusicLabel');
      const ssLabel = await AsyncStorage.getItem('@countOnMe_successSoundLabel');

      console.log(`[loadMusicSettings] Retrieved from storage - wm: ${wm}, bm: ${bm}, ss: ${ss}`);
      console.log(`[loadMusicSettings] Retrieved labels - wmLabel: ${wmLabel}, bmLabel: ${bmLabel}, ssLabel: ${ssLabel}`);

      // Handle workout music
      if (wm) {
        console.log(`[loadMusicSettings] Setting workout music to: ${wm}`);
        updateSelectedWorkoutMusic(wm);
        // Set the label for display
        if (wmLabel) {
          selectedWorkoutLabelRef.current = wmLabel;
          console.log(`[loadMusicSettings] Set workout label to: ${wmLabel}`);
        }
        const workoutFile = await getSoundFileByLabel(wm);
        if (workoutFile) {
          setSelectedWorkoutMusicFile(workoutFile);
        } else if (wm === 'web-reselect') {
          setSelectedWorkoutMusicFile(null);
        } else {
          updateSelectedWorkoutMusic('random:Action');
          selectedWorkoutLabelRef.current = 'Random Action Music';
          setSelectedWorkoutMusicFile(await getSoundFileByLabel('random:Action'));
        }
      } else {
        console.log(`[loadMusicSettings] No workout music stored, setting default: random:Action`);
        updateSelectedWorkoutMusic('random:Action');
        selectedWorkoutLabelRef.current = 'Random Action Music';
        setSelectedWorkoutMusicFile(await getSoundFileByLabel('random:Action'));
      }

      // Handle break music
      if (bm) {
        console.log(`[loadMusicSettings] Setting break music to: ${bm}`);
        updateSelectedBreakMusic(bm);
        // Set the label for display
        if (bmLabel) {
          selectedBreakLabelRef.current = bmLabel;
          console.log(`[loadMusicSettings] Set break label to: ${bmLabel}`);
        }
        const breakFile = await getSoundFileByLabel(bm);
        console.log(`[loadMusicSettings] Break file retrieved:`, breakFile);
        if (breakFile) {
          setSelectedBreakMusicFile(breakFile);
          console.log(`[loadMusicSettings] Break file set successfully`);
        } else if (bm === 'web-reselect') {
          setSelectedBreakMusicFile(null);
        } else {
          console.log(`[loadMusicSettings] Break file not found, setting default`);
          updateSelectedBreakMusic('random:Chill');
          selectedBreakLabelRef.current = 'Random Chill Music';
          const defaultBreakFile = await getSoundFileByLabel('random:Chill');
          console.log(`[loadMusicSettings] Default break file:`, defaultBreakFile);
          setSelectedBreakMusicFile(defaultBreakFile);
        }
      } else {
        console.log(`[loadMusicSettings] No break music stored, setting default: random:Chill`);
        updateSelectedBreakMusic('random:Chill');
        selectedBreakLabelRef.current = 'Random Chill Music';
        const defaultBreakFile = await getSoundFileByLabel('random:Chill');
        console.log(`[loadMusicSettings] Default break file retrieved:`, defaultBreakFile);
        setSelectedBreakMusicFile(defaultBreakFile);
      }

      // Handle success sound
      if (ss) {
        console.log(`[loadMusicSettings] Setting success sound to: ${ss}`);
        updateSelectedSuccessSound(ss);
        // Set the label for display
        if (ssLabel) {
          selectedSuccessLabelRef.current = ssLabel;
          console.log(`[loadMusicSettings] Set success label to: ${ssLabel}`);
        }
        const successFile = await getSoundFileByLabel(ss);
        if (successFile) {
          setSelectedSuccessSoundFile(successFile);
        } else if (ss === 'web-reselect') {
          setSelectedSuccessSoundFile(null);
        } else {
          updateSelectedSuccessSound('Crowd Cheer');
          selectedSuccessLabelRef.current = 'Crowd Cheer';
          setSelectedSuccessSoundFile(await getSoundFileByLabel('Crowd Cheer'));
        }
      } else {
        console.log(`[loadMusicSettings] No success sound stored, setting default: Crowd Cheer`);
        updateSelectedSuccessSound('Crowd Cheer');
        selectedSuccessLabelRef.current = 'Crowd Cheer';
        setSelectedSuccessSoundFile(await getSoundFileByLabel('Crowd Cheer'));
      }

      // Set up next exercise sound
      console.log(`[loadMusicSettings] Setting up next exercise sound`);
      if (nextExerciseSound) {
        const nextExerciseFile = await getSoundFileByLabel(nextExerciseSound.label);
        if (nextExerciseFile) {
          setSelectedNextExerciseFile(nextExerciseFile);
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

  const fadeOutSound = async () => {
    console.log('[fadeOutSound] Starting fadeout...');
    if (currentSound) {
      const steps = 20;
      const fadeDuration = 2000; // 2 seconds
      const stepDuration = fadeDuration / steps;
      
      for (let i = 1; i <= steps; i++) {
        const volume = Math.max(0, 1 - (i / steps));
        console.log(`[fadeOutSound] Step ${i}/${steps}, volume: ${volume.toFixed(2)}`);
        try {
          await currentSound.setVolumeAsync(volume);
          if (i < steps) {
            await new Promise(resolve => setTimeout(resolve, stepDuration));
          }
        } catch (error) {
          console.log('[fadeOutSound] Sound may have been stopped during fadeout');
          break;
        }
      }
      console.log('[fadeOutSound] Fadeout complete');
    }
  };

  const playSegmentMusic = async (segment: string, callback?: () => void) => {
    console.log(`[playSegmentMusic] Starting playback for segment: "${segment}"`);
    console.log(`[playSegmentMusic] Current state - selectedWorkoutFile:`, selectedWorkoutFile, `selectedBreakFile:`, selectedBreakFile);
    
    let soundFile = null;
    let soundLabel = '';
    
    if (segment === 'workout') {
      soundFile = selectedWorkoutFile;
      soundLabel = selectedWorkoutMusic;
      console.log(`[playSegmentMusic] Using workout file:`, soundFile, `Label: ${soundLabel}`);
    } else if (segment === 'break') {
      soundFile = selectedBreakFile;
      soundLabel = selectedBreakMusic;
      console.log(`[playSegmentMusic] Using break file:`, soundFile, `Label: ${soundLabel}`);
    } else if (segment === 'successSound') {
      soundFile = selectedSuccessFile;
      soundLabel = selectedSuccessSound;
      console.log(`[playSegmentMusic] Using success file:`, soundFile, `Label: ${soundLabel}`);
    } else if (segment === 'nextExerciseSound') {
      soundFile = selectedNextExerciseFile;
      soundLabel = 'nextExerciseSound';
      console.log(`[playSegmentMusic] Using next exercise file:`, soundFile, `Label: ${soundLabel}`);
    }
    
    if (!soundFile) {
      console.log(`[playSegmentMusic] No sound file found for segment: "${segment}"`);
      if (callback) callback();
      return;
    }
    
    const shouldLoop = segment === 'workout' || segment === 'break';
    console.log(`[playSegmentMusic] Playing file for segment "${segment}", loop: ${shouldLoop}`);
    
    await playSound(soundFile, shouldLoop, 1.0, callback);
  };

  const addCustomAudioFile = async (label: string, uri: string) => {
    console.log(`[addCustomAudioFile] Adding custom audio: ${label} -> ${uri}`);
    setCustomAudioFiles(prev => new Map(prev.set(label, { label, uri })));
  };

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
