import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import i18n from '@/i18n';

import { SoundProvider } from './sound.provider'; // Adjust the import based on your file structure
import {
  breakMusic as breakMusicData,
  DataKey,
  language as languageData,
  successSound as successSoundData,
  workoutMusic as workoutMusicData,
} from '@/constants/media';

export interface StoredItem {
  key: string;
  value: string | null;
}

interface DataContextType {
  breakMusic: DataKey[];
  workoutMusic: DataKey[];
  successSound: DataKey[];
  language: DataKey[];
  storedItems: StoredItem[];
  workoutItems: StoredItem[];
  reload: () => Promise<void>;
  storeItem: (key: string, value: string) => Promise<void>;
  getStoredItem: (key: string) => Promise<string | null>;
  deleteItem: (key: string) => Promise<void>;
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
  workoutItems: StoredItem[];
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
  | { type: 'SET_WORKOUT_ITEMS'; payload: StoredItem[] }
  | { type: 'SET_LANGUAGE'; payload: string | null }
  | { type: 'SET_SELECTED_ACTION_MUSIC'; payload: string }
  | { type: 'SET_SELECTED_BREAK_MUSIC'; payload: string }
  | { type: 'SET_SELECTED_SUCCESS_SOUND'; payload: string }
  | { type: 'SET_AUDIO_ENABLED'; payload: boolean }
  | { type: 'SET_CURRENT_MUSIC_BEING_PLAYED'; payload: string | null }
  | { type: 'SET_USER_WEIGHT'; payload: string | null }
  | { type: 'SET_FITNESS_LEVEL'; payload: string | null };

const initialState: State = {
  storedItems: [],
  workoutItems: [],
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
    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.payload };
    case 'SET_SELECTED_ACTION_MUSIC':
      return { ...state, selectedActionMusic: action.payload };
    case 'SET_SELECTED_BREAK_MUSIC':
      return { ...state, selectedBreakMusic: action.payload };
    case 'SET_SELECTED_SUCCESS_SOUND':
      return { ...state, selectedSuccessSound: action.payload };
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
      const workoutItems = items.filter((item) => !reservedKeys.includes(item.key));
      dispatch({ type: 'SET_WORKOUT_ITEMS', payload: workoutItems });
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
          breakMusic: breakMusicData,
          workoutMusic: workoutMusicData,
          successSound: successSoundData,
          language: languageData,
          currentLanguage: state.currentLanguage,
          setLanguage: (lang) => dispatch({ type: 'SET_LANGUAGE', payload: lang }),
          reload,
          storeItem,
          deleteItem,
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