import React, { createContext, useEffect, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredItem {
  key: string;
  value: string | null;
}

interface DataContextType {
  storedItems: StoredItem[];
  reload: () => Promise<void>;
  storeItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedItems, setStoredItems] = useState<StoredItem[]>([]);

  const reload = async () => {
    try {
      // Get all keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      // Retrieve all key-value pairs as an array of [key, value]
      const stores = await AsyncStorage.multiGet(keys);
      // Map the retrieved data to an array of StoredItem objects
      const items: StoredItem[] = stores.map(([key, value]) => ({ key, value }));
      setStoredItems(items);
    } catch (e) {
      console.error('Error loading AsyncStorage data:', e);
    }
  };

  const storeItem = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      // Optionally update storedItems state by reloading all data
      await reload();
    } catch (e) {
      console.error('Error storing data:', e);
    }
  };

  const deleteItem = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
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
    <DataContext.Provider value={{ storedItems, reload, storeItem, deleteItem }}>
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
