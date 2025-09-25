import AsyncStorage from '@react-native-async-storage/async-storage';
import { roundAndClamp } from './numberUtils';

// Usage example (call from App startup or a dev-only setup screen):
// import { seedProgressionGroupsToStorage } from './utils/progressionStorage';
// useEffect(() => { seedProgressionGroupsToStorage().then(console.log) }, []);
// This will write keys like '@countOnMe_group_All' and '@countOnMe_Pistol_Squat' to AsyncStorage.

// Load the static progressions JSON bundled with the app
// Using require keeps this file compatible with TypeScript setups that allow JSON imports
const progressions: any[] = require('../assets/progressions.json');

type Progression = {
  name: string;
  description?: string;
  workout?: string;
  calories?: number | null;
  level?: string | null;
  components?: Array<{ component: string; description?: string; workout?: string }>;
};

type GroupWorkoutItem = { orderId: number; name: string; workout?: string; description?: string };

function sanitizeKey(name: string) {
  // Replace spaces with underscores and drop unusual chars to produce safe AsyncStorage keys
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-()]/g, '');
}

/**
 * Seed the bundled progressions into AsyncStorage.
 * Creates these keys:
 * - @countOnMe_group_All -> { name: 'All', workouts: [ {orderId, name}, ... ] }
 * - @countOnMe_<sanitized progression name> -> { name, workout, calories, level, description }
 * - @countOnMe_group_<sanitized progression name> -> { name, workouts: [ {orderId, name, workout?, description?} ... ] }
 *
 * The function is idempotent and will overwrite existing keys with the same names.
 */
export async function seedProgressionGroupsToStorage(options?: { force?: boolean }): Promise<{ success: boolean; written?: string[]; skipped?: string[]; error?: string }> {
  try {
    if (!Array.isArray(progressions)) {
      throw new Error('progressions.json is not an array');
    }

    const desiredMap = new Map<string, string>();
    const allNamesSet = new Set<string>();

    // Create per-progression metadata entries and collect names for the All group
    (progressions as Progression[]).forEach((p) => {
      const metaKey = `@countOnMe_${sanitizeKey(p.name)}`;
      const metaValue = {
        name: p.name,
        workout: p.workout ?? '',
        calories: typeof p.calories === 'number' ? roundAndClamp(p.calories) : (p.calories ?? null),
        level: p.level ?? null,
        description: p.description ?? '',
      };
      desiredMap.set(metaKey, JSON.stringify(metaValue));

      // add progression name itself to the master All list
      allNamesSet.add(p.name);

      // add component exercise names to the master All list
      if (Array.isArray(p.components)) {
        p.components.forEach((c) => {
          if (c && c.component) allNamesSet.add(c.component);
        });
      }
    });

    // Also create metadata entries for each component exercise (so @countOnMe_Push-ups exists)
    (progressions as Progression[]).forEach((p) => {
      if (Array.isArray(p.components)) {
        p.components.forEach((c) => {
          if (c && c.component) {
            const compKey = `@countOnMe_${sanitizeKey(c.component)}`;
            // Only set if not already present (don't overwrite if progression with same name exists)
            if (!desiredMap.has(compKey)) {
              const compMeta = {
                name: c.component,
                workout: c.workout ?? '',
                calories: typeof c.workout === 'number' ? roundAndClamp(c.workout) : null,
                level: null,
                description: c.description ?? '',
              };
              desiredMap.set(compKey, JSON.stringify(compMeta));
            }
          }
        });
      }
    });

    // Build the All group (unique exercises from progression names + components)
    const allArray: GroupWorkoutItem[] = Array.from(allNamesSet).map((n, i) => ({ orderId: i + 1, name: n }));
    desiredMap.set(`@countOnMe_group_All`, JSON.stringify({ name: 'All', workouts: allArray }));

    // Build per-progression groups: list the components required for that progression
    (progressions as Progression[]).forEach((p) => {
      const groupKey = `@countOnMe_group_${sanitizeKey(p.name)}`;
      const workouts: GroupWorkoutItem[] = [];
      if (Array.isArray(p.components) && p.components.length > 0) {
        p.components.forEach((c, idx) => {
          workouts.push({ orderId: idx + 1, name: c.component, workout: c.workout ?? '', description: c.description ?? '' });
        });
      } else {
        // fallback to include the progression name itself
        workouts.push({ orderId: 1, name: p.name, workout: p.workout ?? '' });
      }
      desiredMap.set(groupKey, JSON.stringify({ name: p.name, workouts }));
    });

    // Determine which keys already exist in AsyncStorage
    const keys = Array.from(desiredMap.keys());
    const existing = await AsyncStorage.multiGet(keys);

    const toWrite: Array<[string, string]> = [];
    const skipped: string[] = [];
    const force = !!(options && options.force);

    existing.forEach(([key, value]) => {
      if (value === null && desiredMap.has(key)) {
        // missing -> write
        toWrite.push([key, desiredMap.get(key)!]);
      } else if (value !== null && !force) {
        // already present and we are not forcing -> skip
        skipped.push(key);
      } else if (value !== null && force) {
        // present but force requested -> overwrite
        toWrite.push([key, desiredMap.get(key)!]);
      }
    });

    // Some defensive behavior: if multiGet returned fewer items (shouldn't), ensure any missing keys are scheduled
    if (existing.length < keys.length) {
      keys.forEach((k) => {
        if (!existing.find((e) => e[0] === k)) {
          toWrite.push([k, desiredMap.get(k)!]);
        }
      });
    }

    if (toWrite.length > 0) {
      await AsyncStorage.multiSet(toWrite);
    }

    return { success: true, written: toWrite.map(([k]) => k), skipped };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

/**
 * Remove the seeded progression keys from AsyncStorage (useful for tests or reset flows)
 */
export async function clearSeededProgressions(): Promise<{ success: boolean; removedKeys?: string[]; error?: string }>{
  try {
    const keys: string[] = [`@countOnMe_group_All`];
    (progressions as Progression[]).forEach((p) => {
      keys.push(`@countOnMe_${sanitizeKey(p.name)}`);
      keys.push(`@countOnMe_group_${sanitizeKey(p.name)}`);
    });
    await AsyncStorage.multiRemove(keys);
    return { success: true, removedKeys: keys };
  } catch (err: any) {
    return { success: false, error: String(err) };
  }
}

/**
 * Helper: read a group or progression from storage and parse JSON
 */
export async function getStoredItem(key: string): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('getStoredItem parse error', err);
    return null;
  }
}

export default {
  seedProgressionGroupsToStorage,
  clearSeededProgressions,
  getStoredItem,
};
