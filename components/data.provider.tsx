import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface StoredItem {
  key: string;
  value: string | null;
}

export interface DataKey {
  label: string;
  value: any;
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
  deleteItem: (key: string) => Promise<void>;
  isCountOnMeKey: (key: string) => boolean;
  setAudioEnabled: (enabled: boolean) => void;
  audioEnabled: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefixKey = '@countOnMe_';
  const [storedItems, setStoredItems] = useState<StoredItem[]>([]);
  const [workoutItems, setWorkoutItems] = useState<StoredItem[]>([]);

  const [audioEnabled, setAudioEnabledState] = useState(true);
  //load all the music files friom the assets/sounds folder and use the file name as label and the file as value

  const setAudioEnabled = useCallback(async (enabled: boolean) => {
    setAudioEnabledState(enabled);
    try {
      await AsyncStorage.setItem('audioEnabled', String(enabled));
      console.log('Audio setting saved:', enabled);
    } catch (error) {
      console.error('Failed to save audio setting', error);
    }
  }, []);

  const workoutMusic: Array<DataKey> = [
    { label: 'Upbeat', value: require('../assets/sounds/upbeat.mp3') },
    { label: 'Bollywood', value: require('../assets/sounds/bollywood.mp3') },
    { label: 'Happy Rock', value: require('../assets/sounds/happy_rock.mp3') },
    { label: 'Chill', value: require('../assets/sounds/chill.mp3') },
    { label: 'Wandering', value: require('../assets/sounds/wandering.mp3') },
    { label: 'Starlit Serenity', value: require('../assets/sounds/starlit_serenity.mp3') },
    { label: 'Peaceful Indian', value: require('../assets/sounds/peaceful_music_indian.mp3') },
    { label: 'Mystical', value: require('../assets/sounds/mystical.mp3') },
    { label: 'Radio: Hirschmilch Chillout', value: 'https://hirschmilch.de:7501/chillout.mp3' },
    { label: 'Radio: Hirschmilch Techno', value: 'https://hirschmilch.de:7501/techno.mp3' },
    { label: 'Radio: Yoga Chill', value: 'http://radio4.vip-radios.fm:8027/secure-128mp3-YogaChill_autodj' },
    { label: 'Radio: Hirschmilch Psy Trance', value: 'https://hirschmilch.de:7501/psytrance.mp3' },
    { label: 'Radio: Hirschmilch Ambient', value: 'https://hirschmilch.de:7501/ambient.mp3' },
  ];

  const breakMusic = [
    { label: 'Chill', value: require('../assets/sounds/chill.mp3') },
    { label: 'Wandering', value: require('../assets/sounds/wandering.mp3') },
    { label: 'Starlit Serenity', value: require('../assets/sounds/starlit_serenity.mp3') },
    { label: 'Peaceful Indian', value: require('../assets/sounds/peaceful_music_indian.mp3') },
    { label: 'Mystical', value: require('../assets/sounds/mystical.mp3') },
    { label: 'Radio: Hirschmilch Chillout', value: 'https://hirschmilch.de:7501/chillout.mp3' },
    { label: 'Radio: Yoga Chill', value: 'http://radio4.vip-radios.fm:8027/secure-128mp3-YogaChill_autodj' },
    
  ];

  const successSound: Array<DataKey> = [
    { label: 'Yeah', value: require('../assets/sounds/yeah.mp3') },
    { label: 'Applause', value: require('../assets/sounds/clapping.mp3') },
    { label: 'Applause Cheer', value: require('../assets/sounds/applause_cheer.mp3') },
    { label: 'Crowd Cheer', value: require('../assets/sounds/crowd_cheer.mp3') },
    { label: 'Oh Yeah', value: require('../assets/sounds/oh_yeah.mp3') },
    { label: 'Yeah Choir', value: require('../assets/sounds/yeah_choir.mp3') },
  ];

  const language = [
    { label: 'English', value: 'en' },
    { label: 'German', value: 'de' },
  ];

  const reload = async () => {
    const reservedKeys = [
      'workoutMusic',
      'breakMusic',
      'successSound',
      'audioThreshold',
      'language',
    ];
    try {
      // Get all keys from AsyncStorage that start with the prefix
      const keys = await AsyncStorage.getAllKeys();
      // Filter keys to only include those that start with the prefix
      const filteredKeys = keys.filter((key) => key.startsWith(prefixKey));
      // Remove the prefix from the keys
      // Retrieve all key-value pairs as an array of [key, value]
      const stores = await AsyncStorage.multiGet(filteredKeys);
      // Map the retrieved data to an array of StoredItem objects
      const items: StoredItem[] = stores.map(([key, value]) => {
        const trimmedKey = key.replace(prefixKey, '');
        return { key: trimmedKey, value };
      });
      const workoutItems = items.filter((item) => !reservedKeys.includes(item.key));
      setWorkoutItems(workoutItems);
      setStoredItems(items);
    } catch (e) {
      console.error('Error loading AsyncStorage data:', e);
    }
  };

  const storeItem = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(`${prefixKey}${key}`, value);
      // Optionally update storedItems state by reloading all data
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
      // Optionally update storedItems state by reloading all data
      await reload();
    } catch (e) {
      console.error('Error deleting data:', e);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <DataContext.Provider
      value={{
        isCountOnMeKey,
        storedItems,
        workoutItems,
        breakMusic,
        workoutMusic,
        successSound,
        language,
        reload,
        storeItem,
        deleteItem,
        setAudioEnabled,
        audioEnabled,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
