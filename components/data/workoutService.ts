import AsyncStorage from '@react-native-async-storage/async-storage';
import { GROUP_NAMES, RESERVED_KEYS } from './constants';
import { StorageService } from './storage';
import { GroupItem, WorkoutItem } from './types';

/**
 * Business logic for workout and group operations
 */
export class WorkoutService {
  /**
   * Add a workout to a specific group
   */
  static async addWorkoutToGroup(
    groupItems: GroupItem[],
    groupName: string, 
    workoutName: string
  ): Promise<void> {
    const group = groupItems.find(g => g.name === groupName);
    if (!group) throw new Error(`Group "${groupName}" not found`);

    const maxOrderId = group.workouts.length > 0 
      ? Math.max(...group.workouts.map(w => w.orderId)) 
      : 0;

    const updatedGroup = {
      ...group,
      workouts: [...group.workouts, { orderId: maxOrderId + 1, name: workoutName }]
    };

    await StorageService.storeGroup(updatedGroup);
  }

  /**
   * Remove a workout from a specific group
   */
  static async removeWorkoutFromGroup(
    groupItems: GroupItem[],
    groupName: string, 
    workoutName: string
  ): Promise<void> {
    const group = groupItems.find(g => g.name === groupName);
    if (!group) throw new Error(`Group "${groupName}" not found`);

    const updatedGroup = {
      ...group,
      workouts: group.workouts.filter(w => w.name !== workoutName)
    };

    await StorageService.storeGroup(updatedGroup);
  }

  /**
   * Reorder a single workout within a group
   */
  static async reorderWorkoutInGroup(
    groupItems: GroupItem[],
    groupName: string, 
    workoutName: string, 
    newOrderId: number
  ): Promise<void> {
    const group = groupItems.find(g => g.name === groupName);
    if (!group) throw new Error(`Group "${groupName}" not found`);

    const updatedWorkouts = group.workouts.map(w => {
      if (w.name === workoutName) {
        return { ...w, orderId: newOrderId };
      }
      return w;
    });

    // Re-sort by orderId and reassign sequential orderIds to prevent duplicates
    updatedWorkouts.sort((a, b) => a.orderId - b.orderId);
    const finalWorkouts = updatedWorkouts.map((w, index) => ({
      ...w,
      orderId: index + 1
    }));

    const updatedGroup = {
      ...group,
      workouts: finalWorkouts
    };

    await StorageService.storeGroup(updatedGroup);
  }

  /**
   * Reorder entire group with new workout order
   */
  static async reorderEntireGroup(
    groupName: string, 
    orderedWorkoutNames: string[]
  ): Promise<void> {
    // Handle "All" group specially
    if (groupName === GROUP_NAMES.ALL || groupName === 'all') {
      // Filter out reserved keys to ensure only actual workout items are included
      const filteredWorkoutNames = orderedWorkoutNames.filter(name => 
        !RESERVED_KEYS.includes(name)
      );
      
      const reorderedWorkouts = filteredWorkoutNames.map((workoutName, index) => ({
        name: workoutName,
        orderId: index + 1
      }));

      const allGroup = {
        name: GROUP_NAMES.ALL,
        workouts: reorderedWorkouts
      };

      await StorageService.storeGroup(allGroup);
      return;
    }

    // Handle regular groups - we need the current group items to find the group
    // This method will need to be called with the current group state
    throw new Error('reorderEntireGroup for regular groups requires group context');
  }

  /**
   * Reorder entire group with group context
   */
  static async reorderEntireGroupWithContext(
    groupItems: GroupItem[],
    groupName: string, 
    orderedWorkoutNames: string[]
  ): Promise<void> {
    // Handle "All" group specially
    if (groupName === GROUP_NAMES.ALL || groupName === 'all') {
      await this.reorderEntireGroup(groupName, orderedWorkoutNames);
      return;
    }

    // Handle regular groups
    const group = groupItems.find(g => g.name === groupName);
    if (!group) throw new Error(`Group "${groupName}" not found`);

    const reorderedWorkouts = orderedWorkoutNames.map((workoutName, index) => ({
      name: workoutName,
      orderId: index + 1
    }));

    const updatedGroup = {
      ...group,
      workouts: reorderedWorkouts
    };

    await StorageService.storeGroup(updatedGroup);
  }

  /**
   * Delete a workout and remove it from all groups
   */
  static async deleteWorkout(
    groupItems: GroupItem[],
    workoutName: string
  ): Promise<void> {
    // Remove the workout from all groups that contain it
    const groupsToUpdate = groupItems.filter(group => 
      group.workouts.some(w => w.name === workoutName)
    );
    
    for (const group of groupsToUpdate) {
      const updatedWorkouts = group.workouts.filter(w => w.name !== workoutName);
      
      if (updatedWorkouts.length === 0) {
        // If the group becomes empty, delete the entire group
        await StorageService.deleteGroup(group.name);
      } else {
        // Otherwise, update the group with remaining workouts and reorder
        const updatedGroup = {
          ...group,
          workouts: updatedWorkouts.map((workout, index) => ({
            ...workout,
            orderId: index + 1
          }))
        };
        await StorageService.storeGroup(updatedGroup);
      }
    }
    
    // Delete the workout itself
    await StorageService.deleteWorkout(workoutName);
  }

  /**
   * Get ordered workouts for a specific group
   */
  static getOrderedWorkoutsForGroup(
    workoutItems: WorkoutItem[],
    groupItems: GroupItem[],
    groupName: string
  ): WorkoutItem[] {
    // Handle "All" group specially
    if (groupName === GROUP_NAMES.ALL || groupName === 'all') {
      const allGroup = groupItems.find(g => g.name === GROUP_NAMES.ALL);
      if (allGroup) {
        // If "All" group exists, use its ordering
        const sortedGroupWorkouts = [...allGroup.workouts].sort((a, b) => a.orderId - b.orderId);
        return sortedGroupWorkouts
          .map(gw => workoutItems.find(wi => wi.name === gw.name))
          .filter((item): item is WorkoutItem => item !== undefined);
      } else {
        // If "All" group doesn't exist, return all workouts in default order
        return [...workoutItems];
      }
    }

    // Handle regular groups
    const group = groupItems.find(g => g.name === groupName);
    if (!group) return [];

    // Sort by orderId and return corresponding WorkoutItems
    const sortedGroupWorkouts = [...group.workouts].sort((a, b) => a.orderId - b.orderId);
    
    return sortedGroupWorkouts
      .map(gw => workoutItems.find(wi => wi.name === gw.name))
      .filter((item): item is WorkoutItem => item !== undefined);
  }

  /**
   * Get workouts by group (without ordering)
   */
  static getWorkoutsByGroup(
    workoutItems: WorkoutItem[],
    groupItems: GroupItem[],
    groupName: string
  ): WorkoutItem[] {
    const group = groupItems.find(g => g.name === groupName);
    if (!group) return [];

    const groupWorkoutNames = new Set(group.workouts.map(gw => gw.name));
    return workoutItems.filter(wi => groupWorkoutNames.has(wi.name));
  }

  /**
   * Synchronize the "All" group with all available workouts in storage
   * This ensures the "All" group contains all workouts and excludes reserved keys
   */
  static async syncAllGroup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      // Filter for workout keys, excluding groups and reserved keys
      const workoutKeys = keys.filter((k: string) => {
        if (!k.startsWith('@countOnMe_')) return false;
        if (k.startsWith('@countOnMe_group_')) return false;
        
        // Extract the key name without prefix and check if it's reserved
        const keyName = k.replace('@countOnMe_', '');
        return !RESERVED_KEYS.includes(keyName);
      });

      // Get workout entries and create the "All" group
      const workoutEntries = await AsyncStorage.multiGet(workoutKeys);
      const workoutsArr = workoutEntries.map(([key, value]: [string, string | null], idx: number) => {
        const name = key.replace('@countOnMe_', '');
        return { orderId: idx + 1, name };
      });

      const allGroup = {
        name: GROUP_NAMES.ALL,
        workouts: workoutsArr
      };

      await StorageService.storeGroup(allGroup);
    } catch (error) {
      console.error('Failed to sync All group:', error);
      throw error;
    }
  }
}
