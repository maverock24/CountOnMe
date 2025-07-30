import i18n from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';

import {
  breakMusic as breakMusicData,
  DataKey,
  language as languageData,
  nextExerciseSound,
  successSound as successSoundData,
  workoutMusic as workoutMusicData,
} from '@/constants/media';
import { SoundProvider, useSound } from './sound.provider';

// Import refactored modules
import { prefixKey } from './data/constants';
import { initialState as defaultInitialState, stateReducer } from './data/reducer';
import { DataParser, StorageService } from './data/storage';
import {
  GroupItem,
  StoredItem,
  WorkoutItem
} from './data/types';
import { WorkoutService } from './data/workoutService';

interface DataContextType {
  // Media data
  breakMusic: DataKey[];
  workoutMusic: DataKey[];
  successSound: DataKey[];
  language: DataKey[];
  
  // Core data
  storedItems: StoredItem[];
  workoutItems: WorkoutItem[];
  groupItems: GroupItem[];
  
  // Core operations
  reload: () => Promise<void>;
  
  // Storage operations
  storeItem: (key: string, value: string) => Promise<void>;
  storeWorkout: (workout: WorkoutItem) => Promise<void>;
  storeGroup: (group: GroupItem) => Promise<void>;
  getStoredItem: (key: string) => Promise<string | null>;
  deleteItem: (key: string) => Promise<void>;
  
  // Workout operations
  deleteWorkout: (name: string) => Promise<void>;
  deleteGroup: (name: string) => Promise<void>;
  addWorkoutToGroup: (groupName: string, workoutName: string) => Promise<void>;
  removeWorkoutFromGroup: (groupName: string, workoutName: string) => Promise<void>;
  reorderWorkoutInGroup: (groupName: string, workoutName: string, newOrderId: number) => Promise<void>;
  reorderEntireGroup: (groupName: string, orderedWorkoutNames: string[]) => Promise<void>;
  syncAllGroup: () => Promise<void>;
  getOrderedWorkoutsForGroup: (groupName: string) => WorkoutItem[];
  getWorkoutsByGroup: (groupName: string) => WorkoutItem[];
  
  // Utility functions
  isCountOnMeKey: (key: string) => boolean;
  
  // Audio settings
  setAudioEnabled: (enabled: boolean) => void;
  audioEnabled: boolean;
  currentMusicBeingPlayed: string | null;
  setCurrentMusicBeingPlayed: (music: string | null) => void;
  audioReady: boolean;
  
  // === CENTRALIZED SOUND MANAGEMENT ===
  
  // Timer Lifecycle Management
  handleTimerStart: (isRunning: boolean, currentSegment?: string, isAutoTransition?: boolean) => Promise<void>;
  handleTimerStop: () => Promise<void>;
  handleTimerReset: () => Promise<void>;
  handleTimerSegmentChange: (segment: string) => Promise<void>;
  handleTimerFadeOut: (time: number, segment: string) => Promise<void>;
  
  // Workflow Management
  handleWorkoutCompletion: (hasNextWorkout: boolean, callback?: () => void) => Promise<void>;
  handleAudioToggle: (enabled: boolean, isRunning: boolean, currentSegment?: string) => Promise<void>;
  
  // Convenience Functions
  playWorkoutMusic: () => Promise<void>;
  playBreakMusic: () => Promise<void>;
  playSuccessSound: (callback?: () => void) => Promise<void>;
  playNextExerciseSound: (callback?: () => void) => Promise<void>;
  stopAllSounds: () => Promise<void>;
  testAudio: () => Promise<void>; // Add test function

  // === CENTRALIZED TIMER MANAGEMENT ===
  
  // Timer State
  timerIsRunning: boolean;
  timerCurrentTime: number;
  timerCurrentIndex: number;
  timerElapsedTime: number;
  timers: any[];
  timerStopped: boolean;
  timerDisabled: boolean;
  timerSelectedItem: string | null;
  timerProgressKey: number;
  
  // Timer Actions
  startTimer: (segment?: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  setTimers: (timers: any[]) => void;
  setTimerSelectedItem: (item: string | null) => void;
  updateTimerTime: (time: number) => void;
  setCurrentIndex: (index: number) => void;
  incrementElapsedTime: () => void;
  autoSelectNextWorkout: (orderedWorkouts: WorkoutItem[]) => void;
  onWorkoutComplete?: () => void;
  setWorkoutCompleteCallback: (callback: () => void) => void;
  handleWorkoutCompleteFlow: (orderedWorkouts: WorkoutItem[]) => void;
  
  // Timer Utilities
  getCurrentSegment: () => string;
  getTotalTime: () => number;
  
  // Language settings
  currentLanguage: string | null;
  setLanguage: (language: string | null) => void;
  
  // User profile
  setWeight: (newWeight: string | null) => Promise<void>;
  userWeight: string | null;
  setFitness: (newFitness: string | null) => Promise<void>;
  fitnessLevel: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Inner component that has access to sound context
const DataProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(stateReducer, defaultInitialState);
  const { audioReady, playSegmentMusic, stopSound, fadeOutSound } = useSound();
  const lastSoundPlayTimeRef = useRef<number>(0);
  const currentSegmentRef = useRef<string | null>(null);
  const soundCallInProgressRef = useRef(false);
  const globalAudioLockRef = useRef(false);

  // === CENTRALIZED SOUND MANAGEMENT SYSTEM ===
  
  /**
   * Core sound playback function with consistent audio state checking
   * @param soundType - Type of sound to play ('workout', 'break', 'successSound', 'nextExerciseSound')
   * @param callback - Optional callback to execute when sound completes
   * @param loop - Whether to loop the sound (currently unused)
   */
  const playSound = useCallback(async (soundType: string, callback?: () => void, loop?: boolean) => {
    if (!state.audioSettings.enabled || !audioReady) {
      // If audio is disabled, still call the callback
      if (callback) callback();
      return;
    }

    // Simple protection against rapid duplicate calls
    if (soundCallInProgressRef.current) {
      return;
    }

    try {
      soundCallInProgressRef.current = true;
      await playSegmentMusic(soundType, callback);
    } finally {
      // Always clear the flag when done
      soundCallInProgressRef.current = false;
    }
  }, [state.audioSettings.enabled, audioReady, playSegmentMusic]);

  /**
   * Stops all currently playing sounds
   */
  const stopAllSounds = useCallback(async () => {
    // Clear data provider locks when stopping sounds
    soundCallInProgressRef.current = false;
    await stopSound();
  }, [stopSound]);

  // === TIMER LIFECYCLE MANAGEMENT ===
  
  /**
   * Handles sound when timer starts
   * @param isRunning - Whether the timer is running
   * @param currentSegment - Current segment type ('workout' or 'break')
   * @param isAutoTransition - Whether this is an automatic segment transition
   */
  const handleTimerStart = useCallback(async (isRunning: boolean, currentSegment?: string, isAutoTransition = false) => {
    if (!isRunning || !currentSegment) {
      return;
    }

    // For automatic transitions, we want to ensure the sound plays regardless of recent calls
    if (isAutoTransition) {
      lastSoundPlayTimeRef.current = Date.now();
      currentSegmentRef.current = currentSegment;
      await playSound(currentSegment);
      return;
    }

    // Basic debouncing for manual calls only
    const now = Date.now();
    const timeSinceLastCall = now - lastSoundPlayTimeRef.current;
    const isSameSegment = currentSegmentRef.current === currentSegment;
    
    // Only debounce if it's the same segment within a short time (manual calls should be more intentional)
    if (isSameSegment && timeSinceLastCall < 500) {
      return;
    }

    lastSoundPlayTimeRef.current = now;
    currentSegmentRef.current = currentSegment;
    
    await playSound(currentSegment);
  }, [playSound]);

  /**
   * Handles sound when timer is stopped
   */
  const handleTimerStop = useCallback(async () => {
    // Clear tracking refs on stop
    currentSegmentRef.current = null;
    await stopAllSounds();
  }, [stopAllSounds]);

  /**
   * Handles sound when timer is reset
   */
  const handleTimerReset = useCallback(async () => {
    // Clear tracking refs on reset
    currentSegmentRef.current = null;
    lastSoundPlayTimeRef.current = 0;
    await stopAllSounds();
  }, [stopAllSounds]);

  /**
   * Handles sound when timer segment changes
   * @param segment - New segment type ('workout' or 'break')
   */
  const handleTimerSegmentChange = useCallback(async (segment: string) => {
    if (segment === 'workout' || segment === 'break') {
      // Only play if this is actually a different segment
      if (currentSegmentRef.current !== segment) {
        currentSegmentRef.current = segment;
        lastSoundPlayTimeRef.current = Date.now();
        await playSound(segment);
      }
    }
  }, [playSound]);

  /**
   * Handles sound fadeout as timer nears completion
   * @param time - Current time remaining
   * @param segment - Current segment type
   */
  const handleTimerFadeOut = useCallback(async (time: number, segment: string) => {
    // Simple fadeout: only for workout/break music at 3 seconds remaining
    if (
      state.audioSettings.enabled &&
      (segment === 'break' || segment === 'workout') &&
      time === 3
    ) {
      await fadeOutSound();
    }
  }, [state.audioSettings.enabled, fadeOutSound]);

  // === WORKFLOW MANAGEMENT ===
  
  /**
   * Handles sound when workout is completed
   * @param hasNextWorkout - Whether there's a next workout in the queue
   * @param callback - Optional callback to execute when sound completes
   */
  const handleWorkoutCompletion = useCallback(async (hasNextWorkout: boolean, callback?: () => void) => {
    const soundType = hasNextWorkout ? 'nextExerciseSound' : 'successSound';
    
    // Ensure we stop any existing sounds first
    await stopAllSounds();
    
    // Small delay to ensure sound system is clean
    setTimeout(async () => {
      await playSound(soundType, callback);
    }, 300);
  }, [playSound, stopAllSounds]);

  /**
   * Handles sound when audio setting is toggled
   * @param enabled - Whether audio is enabled
   * @param isRunning - Whether timer is currently running
   * @param currentSegment - Current segment type
   */
  const handleAudioToggle = useCallback(async (enabled: boolean, isRunning: boolean, currentSegment?: string) => {
    if (!enabled) {
      // Stop all sounds when audio is disabled
      await stopAllSounds();
    } else if (enabled && isRunning && currentSegment) {
      // Start playing appropriate segment music when audio is re-enabled
      await playSound(currentSegment);
    }
  }, [stopAllSounds, playSound]);

  // === CONVENIENCE FUNCTIONS ===
  
  /**
   * Test function to verify audio is working
   */
  const testAudio = useCallback(async () => {
    if (!audioReady) {
      return;
    }
    
    if (!state.audioSettings.enabled) {
      return;
    }
    
    await playSound('workout');
  }, [audioReady, state.audioSettings.enabled, playSound]);
  
  /**
   * Plays workout music
   */
  const playWorkoutMusic = useCallback(async () => {
    await playSound('workout');
  }, [playSound]);

  /**
   * Plays break music
   */
  const playBreakMusic = useCallback(async () => {
    await playSound('break');
  }, [playSound]);

  /**
   * Plays success sound with optional callback
   * @param callback - Optional callback to execute when sound completes
   */
  const playSuccessSound = useCallback(async (callback?: () => void) => {
    await playSound('successSound', callback);
  }, [playSound]);

  /**
   * Plays next exercise sound with optional callback
   * @param callback - Optional callback to execute when sound completes
   */
  const playNextExerciseSound = useCallback(async (callback?: () => void) => {
    await playSound('nextExerciseSound', callback);
  }, [playSound]);

  // === CENTRALIZED TIMER MANAGEMENT ===
  
  /**
   * Start the timer with optional sound triggering
   * @param segment - Optional segment to play sound for
   */
  const startTimer = useCallback(async (segment?: string) => {
    dispatch({ type: 'START_TIMER' });
    
    // Trigger sound if segment is provided
    if (segment) {
      await handleTimerStart(true, segment);
    }
  }, [handleTimerStart]);

  /**
   * Stop the timer and sounds
   */
  const stopTimer = useCallback(async () => {
    dispatch({ type: 'STOP_TIMER' });
    await handleTimerStop();
  }, [handleTimerStop]);

  /**
   * Reset the timer to initial state
   */
  const resetTimer = useCallback(async () => {
    dispatch({ type: 'RESET_TIMER' });
    await handleTimerReset();
  }, [handleTimerReset]);

  /**
   * Set the timers array and initialize timer state
   * @param timers - Array of timer configurations
   */
  const setTimers = useCallback((timers: any[]) => {
    dispatch({ type: 'SET_TIMERS', payload: timers });
  }, []);

  /**
   * Set the currently selected workout item
   * @param item - The selected workout item name
   */
  const setTimerSelectedItem = useCallback((item: string | null) => {
    dispatch({ 
      type: 'SET_TIMER_STATE', 
      payload: { selectedItem: item } 
    });
  }, []);

  /**
   * Update the current timer time
   * @param time - New time value in seconds
   */
  const updateTimerTime = useCallback((time: number) => {
    dispatch({ type: 'UPDATE_TIMER_TIME', payload: time });
  }, []);

  /**
   * Set the current timer index and update time
   * @param index - New timer index
   */
  const setCurrentIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_CURRENT_INDEX', payload: index });
  }, []);

  /**
   * Increment the elapsed time by 1 second
   */
  const incrementElapsedTime = useCallback(() => {
    dispatch({ type: 'INCREMENT_ELAPSED_TIME' });
  }, []);

  /**
   * Get the current segment name
   * @returns Current segment string or empty string
   */
  const getCurrentSegment = useCallback(() => {
    const { timers, currentIndex } = state.timerState;
    return timers.length > 0 && currentIndex < timers.length 
      ? timers[currentIndex].segment 
      : '';
  }, [state.timerState.timers, state.timerState.currentIndex]);

  /**
   * Calculate total time for all timers
   * @returns Total time in seconds
   */
  const getTotalTime = useCallback(() => {
    return state.timerState.timers.reduce((total, timer) => total + timer.time, 0);
  }, [state.timerState.timers]);

  /**
   * Auto-select and start the next workout in the sequence
   */
  const autoSelectNextWorkout = useCallback((orderedWorkouts: WorkoutItem[]) => {
    const { selectedItem } = state.timerState;
    if (!selectedItem) return;

    const currentWorkoutIndex = orderedWorkouts.findIndex(workout => workout.name === selectedItem);
    
    if (currentWorkoutIndex === -1 || currentWorkoutIndex >= orderedWorkouts.length - 1) {
      // No next workout available
      return;
    }

    const nextWorkout = orderedWorkouts[currentWorkoutIndex + 1];

    // Reset current state
    dispatch({ type: 'RESET_TIMER' });
    handleTimerReset();

    // Small delay to ensure state is completely reset
    setTimeout(() => {
      // Select the next workout
      setTimerSelectedItem(nextWorkout.name);

      // Parse and set up the new workout
      const newTimers = nextWorkout.workout.split(';').map((time: string, index: number) => ({
        id: index.toString(),
        time: parseInt(time),
        segment: index % 2 === 0 ? 'workout' : 'break',
      }));

      setTimers(newTimers);

      // Set initial time for the first segment of new workout
      if (newTimers.length > 0) {
        updateTimerTime(newTimers[0].time);
      }

      // Start the next workout after a brief pause
      setTimeout(() => {
        handleTimerStop();
        setTimeout(() => {
          // Manually trigger sound for the new workout's first segment
          if (newTimers.length > 0) {
            const firstSegment = newTimers[0].segment;
            startTimer(firstSegment);
          }
        }, 200);
      }, 800);
    }, 200);
  }, [state.timerState.selectedItem, handleTimerReset, setTimerSelectedItem, setTimers, updateTimerTime, handleTimerStop, startTimer]);

  // Workout completion callback management
  const workoutCompleteCallbackRef = useRef<(() => void) | null>(null);
  
  const setWorkoutCompleteCallback = useCallback((callback: () => void) => {
    workoutCompleteCallbackRef.current = callback;
  }, []);

  // Simplified workout completion flow - handles everything in data provider
  const handleWorkoutCompleteFlow = useCallback((orderedWorkouts: WorkoutItem[]) => {
    const { selectedItem } = state.timerState;
    if (!selectedItem) {
      return;
    }

    const currentWorkoutIndex = orderedWorkouts.findIndex(workout => workout.name === selectedItem);
    const hasNextWorkout = currentWorkoutIndex !== -1 && currentWorkoutIndex < orderedWorkouts.length - 1;
    
    if (audioReady && state.audioSettings.enabled) {
      // Play appropriate completion sound and handle progression after sound completes
      handleWorkoutCompletion(hasNextWorkout, () => {
        if (hasNextWorkout) {
          autoSelectNextWorkout(orderedWorkouts);
        } else {
          // Reset the timer immediately after success sound completes
          dispatch({ type: 'RESET_TIMER' });
          handleTimerReset();
        }
      });
    } else {
      // No audio - proceed immediately
      if (hasNextWorkout) {
        autoSelectNextWorkout(orderedWorkouts);
      } else {
        // Reset the timer immediately when audio is disabled
        dispatch({ type: 'RESET_TIMER' });
        handleTimerReset();
      }
    }
  }, [state.timerState.selectedItem, state.audioSettings.enabled, audioReady, handleWorkoutCompletion, autoSelectNextWorkout, handleTimerReset]);

  // Timer interval management - centralized countdown logic
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (state.timerState.isRunning && state.timerState.currentTime > 0) {
      // Start the countdown interval
      timerIntervalRef.current = setInterval(() => {
        const newTime = Math.max(0, state.timerState.currentTime - 1);
        dispatch({ type: 'UPDATE_TIMER_TIME', payload: newTime });
        dispatch({ type: 'INCREMENT_ELAPSED_TIME' });
        
        // Handle fadeout when time reaches exactly 3 seconds
        if (newTime === 3) {
          const { timers, currentIndex } = state.timerState;
          if (timers.length > 0 && currentIndex < timers.length) {
            const currentSegment = timers[currentIndex].segment;
            handleTimerFadeOut(newTime, currentSegment);
          }
        }
        
        // Check if timer has reached 0
        if (newTime === 0) {
          const { timers, currentIndex } = state.timerState;
          
          if (currentIndex < timers.length - 1) {
            // Move to next segment
            const nextIndex = currentIndex + 1;
            const nextSegment = timers[nextIndex].segment;
            
            dispatch({ type: 'SET_CURRENT_INDEX', payload: nextIndex });
            dispatch({ type: 'UPDATE_TIMER_TIME', payload: timers[nextIndex].time });
            
            // Trigger sound for the new segment
            setTimeout(() => {
              handleTimerStart(true, nextSegment, true); // Mark as auto transition
            }, 100);
          } else {
            // Timer completed - stop any ongoing sounds first
            dispatch({ type: 'STOP_TIMER' });
            clearInterval(timerIntervalRef.current!);
            timerIntervalRef.current = null;
            
            // Stop any ongoing sounds immediately before completion
            stopAllSounds().then(() => {
              // Call the workout completion callback if set
              if (workoutCompleteCallbackRef.current) {
                workoutCompleteCallbackRef.current();
              }
            });
          }
        }
      }, 1000);
    } else {
      // Clear interval when not running
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [state.timerState.isRunning, state.timerState.currentTime, state.timerState.currentIndex, state.timerState.timers, handleTimerFadeOut]);

  // User profile operations
  const setWeight = useCallback(async (newWeight: string | null) => {
    dispatch({ 
      type: 'SET_USER_PROFILE', 
      payload: { weight: newWeight } 
    });
    try {
      await AsyncStorage.setItem(`${prefixKey}profileWeight`, newWeight || '');
    } catch (error) {
      console.error('Failed to save weight', error);
    }
  }, []);

  const setFitness = useCallback(async (newFitness: string | null) => {
    dispatch({ 
      type: 'SET_USER_PROFILE', 
      payload: { fitnessLevel: newFitness } 
    });
    try {
      await AsyncStorage.setItem(`${prefixKey}profileFitness`, newFitness || '');
    } catch (error) {
      console.error('Failed to save fitness level', error);
    }
  }, []);

  // Audio operations
  const setAudioEnabled = useCallback(async (enabled: boolean) => {
    dispatch({ 
      type: 'SET_AUDIO_SETTINGS', 
      payload: { enabled } 
    });
    try {
      await AsyncStorage.setItem('audioEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to save audio setting', error);
    }
  }, []);

  // Main reload function
  const reload = async () => {
    try {
      const items = await StorageService.getAllStoredItems();
      
      // Check if this is the first time setup (no audio settings exist)
      const hasWorkoutMusic = items.some(item => item.key === 'workoutMusic');
      const hasBreakMusic = items.some(item => item.key === 'breakMusic');
      const hasSuccessSound = items.some(item => item.key === 'successSound');
      
      // If this is the first time, set default values in storage
      if (!hasWorkoutMusic || !hasBreakMusic || !hasSuccessSound) {
        if (!hasWorkoutMusic) {
          await StorageService.storeItem('workoutMusic', 'random:Action');
        }
        if (!hasBreakMusic) {
          await StorageService.storeItem('breakMusic', 'random:Chill');
        }
        if (!hasSuccessSound) {
          await StorageService.storeItem('successSound', 'Oh Yeah');
        }
        
        // Reload items after setting defaults
        const updatedItems = await StorageService.getAllStoredItems();
        items.push(...updatedItems.filter(item => !items.some(existing => existing.key === item.key)));
      }
      
      // Process reserved keys for settings
      items.forEach((item) => {
        const trimmedKey = item.key;
        switch (trimmedKey) {
          case 'workoutMusic':
            dispatch({ 
              type: 'SET_AUDIO_SETTINGS', 
              payload: { selectedActionMusic: item.value || 'random:Action' } 
            });
            break;
          case 'breakMusic':
            dispatch({ 
              type: 'SET_AUDIO_SETTINGS', 
              payload: { selectedBreakMusic: item.value || 'random:Chill' } 
            });
            break;
          case 'successSound':
            dispatch({ 
              type: 'SET_AUDIO_SETTINGS', 
              payload: { selectedSuccessSound: item.value || 'Oh Yeah' } 
            });
            break;
          case 'language':
            if (item.value && item.value !== i18n.language) {
              i18n.changeLanguage(item.value);
            }
            dispatch({ type: 'SET_LANGUAGE', payload: item.value });
            break;
          case 'audioEnabled':
            dispatch({ 
              type: 'SET_AUDIO_SETTINGS', 
              payload: { enabled: item.value === 'true' } 
            });
            break;
          case 'profileWeight':
            dispatch({ 
              type: 'SET_USER_PROFILE', 
              payload: { weight: item.value } 
            });
            break;
          case 'profileFitness':
            dispatch({ 
              type: 'SET_USER_PROFILE', 
              payload: { fitnessLevel: item.value } 
            });
            break;
        }
      });

      // Parse workouts and groups
      const { workoutItems, groupItems } = DataParser.parseStoredItems(items);

      dispatch({ type: 'SET_WORKOUT_ITEMS', payload: workoutItems });
      dispatch({ type: 'SET_GROUP_ITEMS', payload: groupItems });
      dispatch({ type: 'SET_STORED_ITEMS', payload: items });
    } catch (e) {
      console.error('Error loading AsyncStorage data:', e);
    }
  };

  // Storage operations
  const getStoredItem = useCallback(StorageService.getItem, []);

  const storeItem = async (key: string, value: string) => {
    try {
      await StorageService.storeItem(key, value);
      await reload();
    } catch (e) {
      console.error('Error storing data:', e);
    }
  };

  const storeWorkout = async (workout: WorkoutItem) => {
    try {
      await StorageService.storeWorkout(workout);
      await reload();
    } catch (e) {
      console.error('Error storing workout:', e);
    }
  };

  const storeGroup = async (group: GroupItem) => {
    try {
      await StorageService.storeGroup(group);
      await reload();
    } catch (e) {
      console.error('Error storing group:', e);
    }
  };

  const deleteItem = async (key: string) => {
    try {
      await StorageService.deleteItem(key);
      await reload();
    } catch (e) {
      console.error('Error deleting data:', e);
    }
  };

  // Workout operations using WorkoutService
  const deleteWorkout = async (name: string) => {
    try {
      await WorkoutService.deleteWorkout(state.groupItems, name);
      await reload();
    } catch (e) {
      console.error('Error deleting workout:', e);
    }
  };

  const deleteGroup = async (name: string) => {
    try {
      await StorageService.deleteGroup(name);
      await reload();
    } catch (e) {
      console.error('Error deleting group:', e);
    }
  };

  const addWorkoutToGroup = async (groupName: string, workoutName: string) => {
    try {
      await WorkoutService.addWorkoutToGroup(state.groupItems, groupName, workoutName);
      await reload();
    } catch (e) {
      console.error('Error adding workout to group:', e);
    }
  };

  const removeWorkoutFromGroup = async (groupName: string, workoutName: string) => {
    try {
      await WorkoutService.removeWorkoutFromGroup(state.groupItems, groupName, workoutName);
      await reload();
    } catch (e) {
      console.error('Error removing workout from group:', e);
    }
  };

  const reorderWorkoutInGroup = async (groupName: string, workoutName: string, newOrderId: number) => {
    try {
      await WorkoutService.reorderWorkoutInGroup(state.groupItems, groupName, workoutName, newOrderId);
      await reload();
    } catch (e) {
      console.error('Error reordering workout in group:', e);
    }
  };

  const reorderEntireGroup = async (groupName: string, orderedWorkoutNames: string[]) => {
    try {
      await WorkoutService.reorderEntireGroupWithContext(state.groupItems, groupName, orderedWorkoutNames);
      await reload();
    } catch (e) {
      console.error('Error reordering entire group:', e);
    }
  };

  const syncAllGroup = async () => {
    try {
      await WorkoutService.syncAllGroup();
      await reload();
    } catch (e) {
      console.error('Error syncing All group:', e);
    }
  };

  // Query operations
  const getOrderedWorkoutsForGroup = (groupName: string): WorkoutItem[] => {
    return WorkoutService.getOrderedWorkoutsForGroup(state.workoutItems, state.groupItems, groupName);
  };

  const getWorkoutsByGroup = (groupName: string): WorkoutItem[] => {
    return WorkoutService.getWorkoutsByGroup(state.workoutItems, state.groupItems, groupName);
  };

  // Utility functions
  const isCountOnMeKey = (key: string) => {
    return key.startsWith(prefixKey);
  };

  useEffect(() => {
    reload();
  }, []);

  return (
      <DataContext.Provider
        value={{
          // Media data
          breakMusic: breakMusicData,
          workoutMusic: workoutMusicData,
          successSound: successSoundData,
          language: languageData,
          
          // Core data
          storedItems: state.storedItems,
          workoutItems: state.workoutItems,
          groupItems: state.groupItems,
          
          // Core operations
          reload,
          
          // Storage operations
          storeItem,
          storeWorkout,
          storeGroup,
          getStoredItem,
          deleteItem,
          
          // Workout operations
          deleteWorkout,
          deleteGroup,
          addWorkoutToGroup,
          removeWorkoutFromGroup,
          reorderWorkoutInGroup,
          reorderEntireGroup,
          syncAllGroup,
          getOrderedWorkoutsForGroup,
          getWorkoutsByGroup,
          
          // Utility functions
          isCountOnMeKey,
          
          // Audio settings
          setAudioEnabled,
          audioEnabled: state.audioSettings.enabled,
          currentMusicBeingPlayed: state.audioSettings.currentMusicBeingPlayed,
          setCurrentMusicBeingPlayed: (music) =>
            dispatch({ 
              type: 'SET_AUDIO_SETTINGS', 
              payload: { currentMusicBeingPlayed: music } 
            }),
          audioReady,
          
          // === CENTRALIZED SOUND MANAGEMENT ===
          
          // Timer Lifecycle Management
          handleTimerStart,
          handleTimerStop,
          handleTimerReset,
          handleTimerSegmentChange,
          handleTimerFadeOut,
          
          // Workflow Management
          handleWorkoutCompletion,
          handleAudioToggle,
          
          // Convenience Functions
          playWorkoutMusic,
          playBreakMusic,
          playSuccessSound,
          playNextExerciseSound,
          stopAllSounds,
          testAudio, // Add test function
          
          // === CENTRALIZED TIMER MANAGEMENT ===
          
          // Timer State
          timerIsRunning: state.timerState.isRunning,
          timerCurrentTime: state.timerState.currentTime,
          timerCurrentIndex: state.timerState.currentIndex,
          timerElapsedTime: state.timerState.elapsedTime,
          timers: state.timerState.timers,
          timerStopped: state.timerState.stopped,
          timerDisabled: state.timerState.disabled,
          timerSelectedItem: state.timerState.selectedItem,
          timerProgressKey: state.timerState.progressKey,
          
          // Timer Actions
          startTimer,
          stopTimer,
          resetTimer,
          setTimers,
          setTimerSelectedItem,
          updateTimerTime,
          setCurrentIndex,
          incrementElapsedTime,
          autoSelectNextWorkout,
          setWorkoutCompleteCallback,
          handleWorkoutCompleteFlow,
          
          // Timer Utilities
          getCurrentSegment,
          getTotalTime,
          
          // Language settings
          currentLanguage: state.currentLanguage,
          setLanguage: (lang) => dispatch({ type: 'SET_LANGUAGE', payload: lang }),
          
          // User profile
          setWeight,
          userWeight: state.userProfile.weight,
          setFitness,
          fitnessLevel: state.userProfile.fitnessLevel,
        }}
      >
        {children}
      </DataContext.Provider>
  );
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(stateReducer, defaultInitialState);

  // Load initial state to get music settings
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const items = await StorageService.getAllStoredItems();
        
        // Process reserved keys for settings
        items.forEach((item) => {
          const trimmedKey = item.key;
          switch (trimmedKey) {
            case 'workoutMusic':
              dispatch({ 
                type: 'SET_AUDIO_SETTINGS', 
                payload: { selectedActionMusic: item.value || 'random:Action' } 
              });
              break;
            case 'breakMusic':
              dispatch({ 
                type: 'SET_AUDIO_SETTINGS', 
                payload: { selectedBreakMusic: item.value || 'random:Chill' } 
              });
              break;
            case 'successSound':
              dispatch({ 
                type: 'SET_AUDIO_SETTINGS', 
                payload: { selectedSuccessSound: item.value || 'Oh Yeah' } 
              });
              break;
          }
        });
      } catch (error) {
        console.error('Error loading initial state:', error);
      }
    };
    
    loadInitialState();
  }, []);

  return (
    <SoundProvider
      workoutMusic={workoutMusicData}
      breakMusic={breakMusicData}
      successSound={successSoundData}
      nextExerciseSound={nextExerciseSound}
      setCurrentMusicBeingPlayed={(music) =>
        dispatch({ 
          type: 'SET_AUDIO_SETTINGS', 
          payload: { currentMusicBeingPlayed: music } 
        })
      }
      selectedBreakMusic={state.audioSettings.selectedBreakMusic}
      selectedWorkoutMusic={state.audioSettings.selectedActionMusic}
      selectedSuccessSound={state.audioSettings.selectedSuccessSound}
      selectedNextExerciseSound={state.audioSettings.selectedNextExerciseSound}
    >
      <DataProviderInner>{children}</DataProviderInner>
    </SoundProvider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Re-export types for backward compatibility
export { prefixKey } from './data/constants';
export type { GroupItem, StoredItem, WorkoutItem } from './data/types';

