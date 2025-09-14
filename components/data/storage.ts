import AsyncStorage from '@react-native-async-storage/async-storage';
import { prefixKey, RESERVED_KEYS } from './constants';
import { GroupItem, StoredItem, WorkoutItem } from './types';



import { setBlob } from './indexeddb';

/**
 * Storage utilities for AsyncStorage operations
 */
export class StorageService {
  /**
   * Get all stored items with the app prefix
   */
  static async getAllStoredItems(): Promise<StoredItem[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const filteredKeys = keys.filter((key) => key.startsWith(prefixKey));
      const stores = await AsyncStorage.multiGet(filteredKeys);
      
      return stores.map(([key, value]) => ({
        key: key.replace(prefixKey, ''),
        value,
      }));
    } catch (error) {
      console.error('Error loading AsyncStorage data:', error);
      return [];
    }
  }

  /**
   * Store a single item
   */
  static async storeItem(key: string, value: string): Promise<void> {
    try {
      const fullKey = `${prefixKey}${key}`;
      console.log(`[StorageService] Storing item with key: ${fullKey}`, { value });
      await AsyncStorage.setItem(fullKey, value);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  }

  /**
   * Get a single item
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const fullKey = `${prefixKey}${key}`;
      const value = await AsyncStorage.getItem(fullKey);
      console.log(`[StorageService] Getting item with key: ${fullKey}`, { value });
      return value;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  /**
   * Delete a single item
   */
  static async deleteItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${prefixKey}${key}`);
    } catch (error) {
      console.error('Error deleting data:', error);
      throw error;
    }
  }

  private static safeParseArray(raw: string | null): Array<{ label: string; uri: string }> {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Append a custom audio entry to a list under a reserved key
   */
  static async addCustomAudio(
    key: 'custom_workoutMusic' | 'custom_breakMusic' | 'custom_successSound',
    item: { label: string; uri: string }
  ): Promise<void> {
    try {
      const isWeb = typeof window !== 'undefined';
      let storedItem = { ...item };

      if (isWeb && item.uri.startsWith('data:')) {
        const response = await fetch(item.uri);
        const blob = await response.blob();
        const dbKey = `custom-audio-${Date.now()}`;
        await setBlob(dbKey, blob);
        storedItem.uri = `indexeddb://${dbKey}`;
      }

      // Load all custom audio lists to create a unified list
      const [w, b, s] = await Promise.all([
        this.getCustomAudio('custom_workoutMusic'),
        this.getCustomAudio('custom_breakMusic'),
        this.getCustomAudio('custom_successSound'),
      ]);

      const all = [...w, ...b, ...s];
      
      // Remove any existing item with the same URI or label to avoid duplicates
      const filtered = all.filter((x) => x.uri !== storedItem.uri && x.label !== storedItem.label);
      
      // Add the new item
      const updated = [...filtered, storedItem];
      
      // Save the updated list back to the original key
      const jsonString = JSON.stringify(updated);
      
      await AsyncStorage.setItem(`@countOnMe_${key}`, jsonString);
    } catch (error) {
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        // Try to free up space by removing oldest items
        try {
          const existing = await this.getCustomAudio(key);
          if (existing.length > 1) {
            // Keep only the most recent 10 items
            const trimmed = existing.slice(-9); // Keep 9, add 1 new = 10 total
            const updated = [...trimmed, item];
            await AsyncStorage.setItem(`@countOnMe_${key}`, JSON.stringify(updated));
            console.warn(`Storage quota exceeded. Trimmed ${key} to most recent ${updated.length} items.`);
            return;
          }
        } catch (trimError) {
          console.error('Failed to trim storage after quota error:', trimError);
        }
        
        throw new Error('Storage quota exceeded and unable to free space. Please clear some custom audio files manually.');
      }
      
      console.error('Error adding custom audio:', error);
      throw error;
    }
  }

  /**
   * Get a custom audio list
   */
  static async getCustomAudio(listKey: 'custom_workoutMusic' | 'custom_breakMusic' | 'custom_successSound'): Promise<Array<{ label: string; uri: string }>> {
    try {
      const key = `${prefixKey}${listKey}`;
      const raw = await AsyncStorage.getItem(key);
      return this.safeParseArray(raw);
    } catch (error) {
      console.error('Error getting custom audio list:', error);
      return [];
    }
  }

  /**
   * Remove one custom audio by uri
   */
  static async removeCustomAudio(listKey: 'custom_workoutMusic' | 'custom_breakMusic' | 'custom_successSound', uri: string): Promise<void> {
    try {
      const key = `${prefixKey}${listKey}`;
      const raw = await AsyncStorage.getItem(key);
      const existing = this.safeParseArray(raw);
      const filtered = existing.filter((x) => x.uri !== uri);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing custom audio:', error);
      throw error;
    }
  }

  /**
   * Store a workout
   */
  static async storeWorkout(workout: WorkoutItem): Promise<void> {
    try {
      await AsyncStorage.setItem(`${prefixKey}${workout.name}`, JSON.stringify(workout));
    } catch (error) {
      console.error('Error storing workout:', error);
      throw error;
    }
  }

  /**
   * Store a group
   */
  static async storeGroup(group: GroupItem): Promise<void> {
    try {
      await AsyncStorage.setItem(`${prefixKey}group_${group.name}`, JSON.stringify(group));
    } catch (error) {
      console.error('Error storing group:', error);
      throw error;
    }
  }

  /**
   * Delete a workout
   */
  static async deleteWorkout(workoutName: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${prefixKey}${workoutName}`);
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupName: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${prefixKey}group_${groupName}`);
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }
}

/**
 * Data parsing utilities
 */
export class DataParser {
  /**
   * Parse stored items into workouts and groups
   */
  static parseStoredItems(items: StoredItem[]): { workoutItems: WorkoutItem[]; groupItems: GroupItem[] } {
    const workoutItems: WorkoutItem[] = [];
    const groupItems: GroupItem[] = [];

    items.forEach((item) => {
      const trimmedKey = item.key;
      
      if (!RESERVED_KEYS.includes(trimmedKey)) {
        try {
          if (trimmedKey.startsWith('group_')) {
            const groupItem = this.parseGroupItem(item);
            if (groupItem) groupItems.push(groupItem);
          } else if (trimmedKey.startsWith('workout_')) {
            const workoutItem = this.parseWorkoutItem(item);
            if (workoutItem) workoutItems.push(workoutItem);
          } else {
            // Legacy format handling
            const legacyItem = this.parseLegacyItem(item);
            if (legacyItem.workout) {
              workoutItems.push(legacyItem.workout);
            }
            if (legacyItem.group) {
              groupItems.push(legacyItem.group);
            }
          }
        } catch {
          // Fallback for corrupted data
          const fallbackWorkout = this.createFallbackWorkout(item);
          if (fallbackWorkout) workoutItems.push(fallbackWorkout);
        }
      }
    });

    return { workoutItems, groupItems };
  }

  private static parseGroupItem(item: StoredItem): GroupItem | null {
    try {
      const parsed = JSON.parse(item.value || '{}');
      if (parsed.name && parsed.workouts && Array.isArray(parsed.workouts)) {
        if (parsed.workouts.length > 0 && typeof parsed.workouts[0] === 'string') {
          // Old format: convert string array to GroupWorkoutItem array
          const convertedWorkouts = parsed.workouts.map((workoutName: string, index: number) => ({
            orderId: index + 1,
            name: workoutName
          }));
          return {
            name: parsed.name,
            workouts: convertedWorkouts
          };
        } else {
          // New format: already has orderId and name
          return parsed;
        }
      }
    } catch {
      // Invalid JSON
    }
    return null;
  }

  private static parseWorkoutItem(item: StoredItem): WorkoutItem | null {
    try {
      const parsed = JSON.parse(item.value || '{}');
      if (parsed.name && parsed.workout) {
        return parsed;
      }
    } catch {
      // Invalid JSON
    }
    return null;
  }

  private static parseLegacyItem(item: StoredItem): { workout?: WorkoutItem; group?: GroupItem } {
    try {
      const parsed = JSON.parse(item.value || '{}');
      
      if (parsed.name && parsed.workout) {
        return { workout: parsed };
      } else if (parsed.name && parsed.workouts) {
        const group = this.parseGroupItem(item);
        return { group: group || undefined };
      } else {
        // Legacy format: convert old key-value pairs to new format
        return {
          workout: {
            name: item.key,
            workout: item.value || '',
            group: undefined
          }
        };
      }
    } catch {
      return {};
    }
  }

  private static createFallbackWorkout(item: StoredItem): WorkoutItem | null {
    if (item.value) {
      return {
        name: item.key,
        workout: item.value,
        group: undefined
      };
    }
    return null;
  }
}
