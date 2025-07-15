import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import i18n from '@/i18n';

import {
  breakMusic as breakMusicData,
  DataKey,
  language as languageData,
  successSound as successSoundData,
  workoutMusic as workoutMusicData,
} from '@/constants/media';
import { SoundProvider } from './sound.provider'; // Adjust the import based on your file structure

export interface StoredItem {
  key: string;
  value: string | null;
}

export interface WorkoutItem {
  name: string;
  workout: string;
  group?: string;
}

export interface GroupWorkoutItem {
  orderId: number;
  name: string;
}

export interface GroupItem {
  name: string;
  workouts: GroupWorkoutItem[]; // Array of workout items with order
}

interface DataContextType {
  breakMusic: DataKey[];
  workoutMusic: DataKey[];
  successSound: DataKey[];
  language: DataKey[];
  storedItems: StoredItem[];
  workoutItems: WorkoutItem[];
  groupItems: GroupItem[];
  reload: () => Promise<void>;
  storeItem: (key: string, value: string) => Promise<void>;
  storeWorkout: (workout: WorkoutItem) => Promise<void>;
  storeGroup: (group: GroupItem) => Promise<void>;
  getStoredItem: (key: string) => Promise<string | null>;
  deleteItem: (key: string) => Promise<void>;
  deleteWorkout: (name: string) => Promise<void>;
  deleteGroup: (name: string) => Promise<void>;
  addWorkoutToGroup: (groupName: string, workoutName: string) => Promise<void>;
  removeWorkoutFromGroup: (groupName: string, workoutName: string) => Promise<void>;
  reorderWorkoutInGroup: (groupName: string, workoutName: string, newOrderId: number) => Promise<void>;
  getOrderedWorkoutsForGroup: (groupName: string) => WorkoutItem[];
  getWorkoutsByGroup: (groupName: string) => WorkoutItem[];
  isCountOnMeKey: (key: string) => boolean;
  setAudioEnabled: (enabled: boolean) => void;
  audioEnabled: boolean;
  currentMusicBeingPlayed: string | null;
  setCurrentMusicBeingPlayed: (music: string | null) => void;
  currentLanguage: string | null;
  setLanguage: (language: string | null) => void;
  setWeight: (newWeight: string | null) => Promise<void>;
  userWeight: string | null;
  setFitness: (newFitness: string | null) => Promise<void>;
  fitnessLevel: string | null;
}

export const prefixKey = '@countOnMe_';

const DataContext = createContext<DataContextType | undefined>(undefined);

interface State {
  storedItems: StoredItem[];
  workoutItems: WorkoutItem[];
  groupItems: GroupItem[];
  currentLanguage: string | null;
  selectedActionMusic: string;
  selectedBreakMusic: string;
  selectedSuccessSound: string;
  audioEnabled: boolean;
  currentMusicBeingPlayed: string | null;
  userWeight: string | null;
  fitnessLevel: string | null;
}

type Action = 
  | { type: 'SET_STORED_ITEMS'; payload: StoredItem[] }
  | { type: 'SET_WORKOUT_ITEMS'; payload: WorkoutItem[] }
  | { type: 'SET_GROUP_ITEMS'; payload: GroupItem[] }
  | { type: 'SET_LANGUAGE'; payload: string | null }
  | { type: 'SET_SELECTED_ACTION_MUSIC'; payload: string | null }
  | { type: 'SET_SELECTED_BREAK_MUSIC'; payload: string | null }
  | { type: 'SET_SELECTED_SUCCESS_SOUND'; payload: string | null }
  | { type: 'SET_AUDIO_ENABLED'; payload: boolean }
  | { type: 'SET_CURRENT_MUSIC_BEING_PLAYED'; payload: string | null }
  | { type: 'SET_USER_WEIGHT'; payload: string | null }
  | { type: 'SET_FITNESS_LEVEL'; payload: string | null };

const initialState: State = {
  storedItems: [],
  workoutItems: [],
  groupItems: [],
  currentLanguage: null,
  selectedActionMusic: 'Action: Upbeat',
  selectedBreakMusic: 'Break: Chill',
  selectedSuccessSound: 'Success: Yeah',
  audioEnabled: true,
  currentMusicBeingPlayed: null,
  userWeight: null,
  fitnessLevel: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STORED_ITEMS':
      return { ...state, storedItems: action.payload };
    case 'SET_WORKOUT_ITEMS':
      return { ...state, workoutItems: action.payload };
    case 'SET_GROUP_ITEMS':
      return { ...state, groupItems: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.payload };
    case 'SET_SELECTED_ACTION_MUSIC':
      return { ...state, selectedActionMusic: action.payload || 'Action: Upbeat' };
    case 'SET_SELECTED_BREAK_MUSIC':
      return { ...state, selectedBreakMusic: action.payload || 'Break: Chill' };
    case 'SET_SELECTED_SUCCESS_SOUND':
      return { ...state, selectedSuccessSound: action.payload || 'Success: Yeah' };
    case 'SET_AUDIO_ENABLED':
      return { ...state, audioEnabled: action.payload };
    case 'SET_CURRENT_MUSIC_BEING_PLAYED':
      return { ...state, currentMusicBeingPlayed: action.payload };
    case 'SET_USER_WEIGHT':
      return { ...state, userWeight: action.payload };
    case 'SET_FITNESS_LEVEL':
      return { ...state, fitnessLevel: action.payload };
    default:
      return state;
  }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setWeight = useCallback(async (newWeight: string | null) => {
    dispatch({ type: 'SET_USER_WEIGHT', payload: newWeight });
    try {
      await AsyncStorage.setItem(`${prefixKey}profileWeight`, newWeight || '');
      console.log('Weight saved:', newWeight);
    } catch (error) {
      console.error('Failed to save weight', error);
    }
  }, []);

  const setFitness = useCallback(async (newFitness: string | null) => {
    dispatch({ type: 'SET_FITNESS_LEVEL', payload: newFitness });
    try {
      await AsyncStorage.setItem(`${prefixKey}profileFitness`, newFitness || '');
      console.log('Fitness level saved:', newFitness);
    } catch (error) {
      console.error('Failed to save fitness level', error);
    }
  }, []);

  const setAudioEnabled = useCallback(async (enabled: boolean) => {
    dispatch({ type: 'SET_AUDIO_ENABLED', payload: enabled });
    try {
      await AsyncStorage.setItem('audioEnabled', String(enabled));
      console.log('Audio setting saved:', enabled);
    } catch (error) {
      console.error('Failed to save audio setting', error);
    }
  }, []);

  const reload = async () => {
    const reservedKeys = [
      'workoutMusic',
      'breakMusic',
      'successSound',
      'audioThreshold',
      'language',
      'profileWeight',
      'profileFitness',
      'tutorialSeen',
    ];
    try {
      const keys = await AsyncStorage.getAllKeys();
      const filteredKeys = keys.filter((key) => key.startsWith(prefixKey));
      const stores = await AsyncStorage.multiGet(filteredKeys);
      const items: StoredItem[] = stores.map(([key, value]) => {
        const trimmedKey = key.replace(prefixKey, '');
        switch (trimmedKey) {
          case 'workoutMusic':
            dispatch({ type: 'SET_SELECTED_ACTION_MUSIC', payload: value });
            break;
          case 'breakMusic':
            dispatch({ type: 'SET_SELECTED_BREAK_MUSIC', payload: value });
            break;
          case 'successSound':
            dispatch({ type: 'SET_SELECTED_SUCCESS_SOUND', payload: value });
            break;
          case 'language':
            if (value && value !== i18n.language) {
              i18n.changeLanguage(value);
            }
            break;
          case 'audioEnabled':
            dispatch({ type: 'SET_AUDIO_ENABLED', payload: value === 'true' });
            break;
          case 'profileWeight':
            dispatch({ type: 'SET_USER_WEIGHT', payload: value });
            break;
          case 'profileFitness':
            dispatch({ type: 'SET_FITNESS_LEVEL', payload: value });
            break;
        }
        return { key: trimmedKey, value };
      });

      // Parse workouts with new structure
      const workoutItems: WorkoutItem[] = [];
      const groupItems: GroupItem[] = [];
      
      items.forEach((item) => {
        const trimmedKey = item.key;
        
        if (!reservedKeys.includes(trimmedKey)) {
          try {
            // Check if this is a group item (starts with 'group_')
            if (trimmedKey.startsWith('group_')) {
              const parsed = JSON.parse(item.value || '{}');
              if (parsed.name && parsed.workouts) {
                // Group format: { name: 'group1', workouts: [{ orderId: 1, name: 'workout1' }] }
                if (Array.isArray(parsed.workouts)) {
                  if (parsed.workouts.length > 0 && typeof parsed.workouts[0] === 'string') {
                    // Old format: convert string array to GroupWorkoutItem array
                    const convertedWorkouts = parsed.workouts.map((workoutName: string, index: number) => ({
                      orderId: index + 1,
                      name: workoutName
                    }));
                    groupItems.push({
                      name: parsed.name,
                      workouts: convertedWorkouts
                    });
                  } else {
                    // New format: already has orderId and name
                    groupItems.push(parsed);
                  }
                }
              }
            }
            // Check if this is a workout item (starts with 'workout_')
            else if (trimmedKey.startsWith('workout_')) {
              const parsed = JSON.parse(item.value || '{}');
              if (parsed.name && parsed.workout) {
                // New format: { name: 'workout1', workout: '1;2;1;2', group?: 'group1' }
                workoutItems.push(parsed);
              }
            }
            // Legacy format handling
            else {
              const parsed = JSON.parse(item.value || '{}');
              if (parsed.name && parsed.workout) {
                // New format: { name: 'workout1', workout: '1;2;1;2', group?: 'group1' }
                workoutItems.push(parsed);
              } else if (parsed.name && parsed.workouts) {
                // Group format
                if (Array.isArray(parsed.workouts)) {
                  if (parsed.workouts.length > 0 && typeof parsed.workouts[0] === 'string') {
                    // Old format: convert string array to GroupWorkoutItem array
                    const convertedWorkouts = parsed.workouts.map((workoutName: string, index: number) => ({
                      orderId: index + 1,
                      name: workoutName
                    }));
                    groupItems.push({
                      name: parsed.name,
                      workouts: convertedWorkouts
                    });
                  } else {
                    // New format: already has orderId and name
                    groupItems.push(parsed);
                  }
                }
              } else {
                // Legacy format: convert old key-value pairs to new format
                workoutItems.push({
                  name: trimmedKey,
                  workout: item.value || '',
                  group: undefined
                });
              }
            }
          } catch {
            // Fallback for legacy format
            workoutItems.push({
              name: trimmedKey,
              workout: item.value || '',
              group: undefined
            });
          }
        }
      });

      dispatch({ type: 'SET_WORKOUT_ITEMS', payload: workoutItems });
      dispatch({ type: 'SET_GROUP_ITEMS', payload: groupItems });
      dispatch({ type: 'SET_STORED_ITEMS', payload: items });
    } catch (e) {
      console.error('Error loading AsyncStorage data:', e);
    }
  };

  const getStoredItem = useCallback(
    async (key: string): Promise<string | null> => {
      try {
        const value = await AsyncStorage.getItem(`${prefixKey}${key}`);
        return value;
      } catch (e) {
        console.error('Error retrieving data:', e);
        return null;
      }
    },
    [prefixKey]
  );

  const storeItem = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(`${prefixKey}${key}`, value);
      await reload();
    } catch (e) {
      console.error('Error storing data:', e);
    }
  };

  const storeWorkout = async (workout: WorkoutItem) => {
    try {
      await AsyncStorage.setItem(`${prefixKey}workout_${workout.name}`, JSON.stringify(workout));
      await reload();
    } catch (e) {
      console.error('Error storing workout:', e);
    }
  };

  const storeGroup = async (group: GroupItem) => {
    try {
      await AsyncStorage.setItem(`${prefixKey}group_${group.name}`, JSON.stringify(group));
      await reload();
    } catch (e) {
      console.error('Error storing group:', e);
    }
  };

  const deleteWorkout = async (name: string) => {
    try {
      // First, remove the workout from all groups that contain it
      const groupsToUpdate = state.groupItems.filter(group => 
        group.workouts.some(w => w.name === name)
      );
      
      for (const group of groupsToUpdate) {
        const updatedWorkouts = group.workouts.filter(w => w.name !== name);
        
        if (updatedWorkouts.length === 0) {
          // If the group becomes empty, delete the entire group
          await AsyncStorage.removeItem(`${prefixKey}group_${group.name}`);
        } else {
          // Otherwise, update the group with remaining workouts
          const updatedGroup = {
            ...group,
            workouts: updatedWorkouts.map((workout, index) => ({
              ...workout,
              orderId: index + 1 // Reorder remaining workouts
            }))
          };
          await AsyncStorage.setItem(`${prefixKey}group_${group.name}`, JSON.stringify(updatedGroup));
        }
      }
      
      // Then delete the workout itself
      await AsyncStorage.removeItem(`${prefixKey}workout_${name}`);
      await reload();
    } catch (e) {
      console.error('Error deleting workout:', e);
    }
  };

  const deleteGroup = async (name: string) => {
    try {
      await AsyncStorage.removeItem(`${prefixKey}group_${name}`);
      await reload();
    } catch (e) {
      console.error('Error deleting group:', e);
    }
  };

  const isCountOnMeKey = (key: string) => {
    return key.startsWith(prefixKey);
  };

  const deleteItem = async (key: string) => {
    try {
      await AsyncStorage.removeItem(`${prefixKey}${key}`);
      await reload();
    } catch (e) {
      console.error('Error deleting data:', e);
    }
  };

  const addWorkoutToGroup = async (groupName: string, workoutName: string) => {
    try {
      const group = state.groupItems.find(g => g.name === groupName);
      if (!group) return;

      const maxOrderId = group.workouts.length > 0 
        ? Math.max(...group.workouts.map(w => w.orderId)) 
        : 0;

      const updatedGroup = {
        ...group,
        workouts: [...group.workouts, { orderId: maxOrderId + 1, name: workoutName }]
      };

      await AsyncStorage.setItem(`${prefixKey}group_${groupName}`, JSON.stringify(updatedGroup));
      await reload();
    } catch (e) {
      console.error('Error adding workout to group:', e);
    }
  };

  const removeWorkoutFromGroup = async (groupName: string, workoutName: string) => {
    try {
      const group = state.groupItems.find(g => g.name === groupName);
      if (!group) return;

      const updatedGroup = {
        ...group,
        workouts: group.workouts.filter(w => w.name !== workoutName)
      };

      await AsyncStorage.setItem(`${prefixKey}group_${groupName}`, JSON.stringify(updatedGroup));
      await reload();
    } catch (e) {
      console.error('Error removing workout from group:', e);
    }
  };

  const reorderWorkoutInGroup = async (groupName: string, workoutName: string, newOrderId: number) => {
    try {
      const group = state.groupItems.find(g => g.name === groupName);
      if (!group) return;

      const updatedWorkouts = group.workouts.map(w => {
        if (w.name === workoutName) {
          return { ...w, orderId: newOrderId };
        }
        return w;
      });

      // Re-sort by orderId to maintain order
      updatedWorkouts.sort((a, b) => a.orderId - b.orderId);

      const updatedGroup = {
        ...group,
        workouts: updatedWorkouts
      };

      await AsyncStorage.setItem(`${prefixKey}group_${groupName}`, JSON.stringify(updatedGroup));
      await reload();
    } catch (e) {
      console.error('Error reordering workout in group:', e);
    }
  };

  const getOrderedWorkoutsForGroup = (groupName: string): WorkoutItem[] => {
    const group = state.groupItems.find(g => g.name === groupName);
    if (!group) return [];

    // Sort by orderId and return corresponding WorkoutItems
    const sortedGroupWorkouts = [...group.workouts].sort((a, b) => a.orderId - b.orderId);
    
    return sortedGroupWorkouts
      .map(gw => state.workoutItems.find(wi => wi.name === gw.name))
      .filter((item): item is WorkoutItem => item !== undefined);
  };

  const getWorkoutsByGroup = (groupName: string): WorkoutItem[] => {
    const group = state.groupItems.find(g => g.name === groupName);
    if (!group) return [];

    const groupWorkoutNames = new Set(group.workouts.map(gw => gw.name));
    return state.workoutItems.filter(wi => groupWorkoutNames.has(wi.name));
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <SoundProvider
      workoutMusic={workoutMusicData}
      breakMusic={breakMusicData}
      successSound={successSoundData}
      setCurrentMusicBeingPlayed={(music) =>
        dispatch({ type: 'SET_CURRENT_MUSIC_BEING_PLAYED', payload: music })
      }
      selectedBreakMusic={state.selectedBreakMusic}
      selectedWorkoutMusic={state.selectedActionMusic}
      selectedSuccessSound={state.selectedSuccessSound}
    >
      <DataContext.Provider
        value={{
          isCountOnMeKey,
          storedItems: state.storedItems,
          workoutItems: state.workoutItems,
          groupItems: state.groupItems,
          breakMusic: breakMusicData,
          workoutMusic: workoutMusicData,
          successSound: successSoundData,
          language: languageData,
          currentLanguage: state.currentLanguage,
          setLanguage: (lang) => dispatch({ type: 'SET_LANGUAGE', payload: lang }),
          reload,
          storeItem,
          storeWorkout,
          storeGroup,
          deleteItem,
          deleteWorkout,
          deleteGroup,
          addWorkoutToGroup,
          removeWorkoutFromGroup,
          reorderWorkoutInGroup,
          getOrderedWorkoutsForGroup,
          getWorkoutsByGroup,
          setAudioEnabled,
          audioEnabled: state.audioEnabled,
          currentMusicBeingPlayed: state.currentMusicBeingPlayed,
          setCurrentMusicBeingPlayed: (music) =>
            dispatch({ type: 'SET_CURRENT_MUSIC_BEING_PLAYED', payload: music }),
          getStoredItem,
          setWeight,
          userWeight: state.userWeight,
          setFitness,
          fitnessLevel: state.fitnessLevel,
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