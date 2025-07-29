import i18n from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import {
    breakMusic as breakMusicData,
    DataKey,
    language as languageData,
    nextExerciseSound,
    successSound as successSoundData,
    workoutMusic as workoutMusicData,
} from '@/constants/media';
import { SoundProvider } from './sound.provider';

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
  getOrderedWorkoutsForGroup: (groupName: string) => WorkoutItem[];
  getWorkoutsByGroup: (groupName: string) => WorkoutItem[];
  
  // Utility functions
  isCountOnMeKey: (key: string) => boolean;
  
  // Audio settings
  setAudioEnabled: (enabled: boolean) => void;
  audioEnabled: boolean;
  currentMusicBeingPlayed: string | null;
  setCurrentMusicBeingPlayed: (music: string | null) => void;
  
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(stateReducer, defaultInitialState);

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
      
      // Process reserved keys for settings
      items.forEach((item) => {
        const trimmedKey = item.key;
        switch (trimmedKey) {
          case 'workoutMusic':
            dispatch({ 
              type: 'SET_AUDIO_SETTINGS', 
              payload: { selectedActionMusic: item.value || 'Action: Upbeat' } 
            });
            break;
          case 'breakMusic':
            dispatch({ 
              type: 'SET_AUDIO_SETTINGS', 
              payload: { selectedBreakMusic: item.value || 'Break: Chill' } 
            });
            break;
          case 'successSound':
            dispatch({ 
              type: 'SET_AUDIO_SETTINGS', 
              payload: { selectedSuccessSound: item.value || 'Success: Yeah' } 
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

