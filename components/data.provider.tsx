import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SoundProvider } from './sound.provider'; // Adjust the import based on your file structure

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
  currentMusicBeingPlayed: string | null;
  setCurrentMusicBeingPlayed: (music: string | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefixKey = '@countOnMe_';
  const [storedItems, setStoredItems] = useState<StoredItem[]>([]);
  const [workoutItems, setWorkoutItems] = useState<StoredItem[]>([]);

  const [audioEnabled, setAudioEnabledState] = useState(true);
  const [currentMusicBeingPlayed, setCurrentMusicBeingPlayed] = useState<string | null>(null);

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
    { label: 'Action: Upbeat', value: require('../assets/sounds/upbeat.mp3') },
    { label: 'Action: Bollywood', value: require('../assets/sounds/bollywood.mp3') },
    { label: 'Action: Happy Rock', value: require('../assets/sounds/happy_rock.mp3') },
     { label: 'Action: Breeze Groove', value: require('../assets/sounds/action_breeze-groove.mp3') },
    {
      label: 'Action: Children Electro Swing',
      value: require('../assets/sounds/action_children-electro-swing-2_medium.mp3'),
    },
    {
      label: 'Action: Cooking Advertisement',
      value: require('../assets/sounds/action_cooking-food-advertising.mp3'),
    },
    {
      label: 'Action: Cooking Happy Time',
      value: require('../assets/sounds/action_cooking-time-happy-cooking-food.mp3'),
    },
    { label: 'Action: Enjoy long', value: require('../assets/sounds/action_enjoy_long.mp3') },
    { label: 'Action: Fun Day', value: require('../assets/sounds/action_fun-day.mp3') },
    { label: 'Action: Funny running', value: require('../assets/sounds/action_funny-running.mp3') },
    { label: 'Action: Joyride', value: require('../assets/sounds/action_joyride-jamboree.mp3') },
    { label: 'Action: Sunshine Whistle', value: require('../assets/sounds/action_sunshine-whistle.mp3') },
    { label: 'Action: Dance Music', value: require('../assets/sounds/action_the-dance-music.mp3') },
    {
      label: 'Action: Upbeat Electro Swing',
      value: require('../assets/sounds/action_upbeat_children-electro-swing.mp3'),
    },
    { label: 'Action: Upbeat energetic', value: require('../assets/sounds/action_upbeat-energetic.mp3') },
    { label: 'Action: Upbeat fun', value: require('../assets/sounds/action_upbeat-fun.mp3') },
    { label: 'Chill: Calm down', value: require('../assets/sounds/chill.mp3') },
    { label: 'Chill: Wandering', value: require('../assets/sounds/wandering.mp3') },
    { label: 'Chill: Starlit Serenity', value: require('../assets/sounds/starlit_serenity.mp3') },
    { label: 'Chill: Peaceful Indian', value: require('../assets/sounds/peaceful_music_indian.mp3') },
    { label: 'Chill: Mystical', value: require('../assets/sounds/mystical.mp3') },
    { label: 'Chill: Chill Beats', value: require('../assets/sounds/chill_beats.mp3') },
    { label: 'Chill: Breath of Life', value: require('../assets/sounds/chill_breath-of-life.mp3') },
    { label: 'Chill: Deep Meditation', value: require('../assets/sounds/chill_deep-meditation.mp3') },
    { label: 'Chill: Forest Melody', value: require('../assets/sounds/chill_forest-melody.mp3') },
    { label: 'Chill: Inner Peace', value: require('../assets/sounds/chill_inner-peace.mp3') },
    {
      label: 'Chill: Relax Sleep',
      value: require('../assets/sounds/chill_meditation-relax-sleep-music.mp3'),
    },
    { label: 'Chill: Perfect Beauty', value: require('../assets/sounds/chill_perfect-beauty.mp3') },
    { label: 'Chill: Space Ambient', value: require('../assets/sounds/chill_space-ambient-music.mp3') },
    { label: 'Radio: Ndr Info', value: 'https://www.ndr.de/resources/metadaten/audio/m3u/ndrinfo_hh.m3u' },
    { label: 'Radio: Hirschmilch Chillout', value: 'https://hirschmilch.de:7501/chillout.mp3' },
    { label: 'Radio: Hirschmilch Techno', value: 'https://hirschmilch.de:7501/techno.mp3' },
    { label: 'Radio: Chilltrax', value: 'https://streamssl3.chilltrax.com/listen.pls?sid=1' },
    { label: 'Radio: Frisky Chill', value: 'https://stream.chill.friskyradio.com/mp3_low' },
    { label: 'Radio: Hirschmilch Psy Trance', value: 'https://hirschmilch.de:7501/psytrance.mp3' },
    { label: 'Radio: Hirschmilch Ambient', value: 'https://hirschmilch.de:7501/ambient.mp3' },
    { label: 'Radio Moonphase', value: 'https://cp12.serverse.com/proxy/moonphase/stream' },
    {
      label: 'Radio: La Patate Douce',
      value: 'https://listen.radioking.com/radio/285742/stream/331753',
    },
    { label: 'Radio: Hunter FM LoFi', value: 'https://live.hunter.fm/lofi_normal' },
    { label: 'Radio: Ambient Sleeping Pill', value: 'https://s.stereoscenic.com/asp-h.m3u' },
    { label: 'Radio: Bagle Radio', value: 'https://ais-sa3.cdnstream1.com/2606_128.mp3' },
  ];

  const breakMusic = [
    { label: 'Chill: Calm down', value: require('../assets/sounds/chill.mp3') },
    { label: 'Chill: Wandering', value: require('../assets/sounds/wandering.mp3') },
    { label: 'Chill: Starlit Serenity', value: require('../assets/sounds/starlit_serenity.mp3') },
    { label: 'Chill: Peaceful Indian', value: require('../assets/sounds/peaceful_music_indian.mp3') },
    { label: 'Chill: Mystical', value: require('../assets/sounds/mystical.mp3') },
    { label: 'Chill: Chill Beats', value: require('../assets/sounds/chill_beats.mp3') },
    { label: 'Chill: Breath of Life', value: require('../assets/sounds/chill_breath-of-life.mp3') },
    { label: 'Chill: Deep Meditation', value: require('../assets/sounds/chill_deep-meditation.mp3') },
    { label: 'Chill: Forest Melody', value: require('../assets/sounds/chill_forest-melody.mp3') },
    { label: 'Chill: Inner Peace', value: require('../assets/sounds/chill_inner-peace.mp3') },
    {
      label: 'Chill: Relax Sleep',
      value: require('../assets/sounds/chill_meditation-relax-sleep-music.mp3'),
    },
    { label: 'Chill: Perfect Beauty', value: require('../assets/sounds/chill_perfect-beauty.mp3') },
    { label: 'Chill: Space Ambient', value: require('../assets/sounds/chill_space-ambient-music.mp3') },
    { label: 'Radio: Hirschmilch Chillout', value: 'https://hirschmilch.de:7501/chillout.mp3' },
    { label: 'Radio: Frisky Chill', value: 'https://stream.chill.friskyradio.com/mp3_low' },
    { label: 'Radio: Chilltrax', value: 'https://streamssl3.chilltrax.com/listen.pls?sid=1' },
    { label: 'Radio Moonphase', value: 'https://cp12.serverse.com/proxy/moonphase/stream' },
    {
      label: 'Radio: La Patate Douce',
      value: 'https://listen.radioking.com/radio/285742/stream/331753',
    },
    { label: 'Radio: Hunter FM LoFi', value: 'https://live.hunter.fm/lofi_normal' },
    { label: 'Radio: Ambient Sleeping Pill', value: 'https://s.stereoscenic.com/asp-h.m3u' },
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
    <SoundProvider
      workoutMusic={workoutMusic}
      breakMusic={breakMusic}
      successSound={successSound}
      setCurrentMusicBeingPlayed={setCurrentMusicBeingPlayed}
    >
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
          currentMusicBeingPlayed,
          setCurrentMusicBeingPlayed,
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
