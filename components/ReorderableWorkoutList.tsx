import { faArrowDown, faArrowUp, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import exercisesEn from '@/assets/exercises_en.json';
import { useData } from '@/components/data.provider';
import { WorkoutItem } from '@/components/data/types';
import ListTile from '@/components/ListTile';
import TimerButton from '@/components/TimerButton';
import { useTheme } from './ThemeProvider';
import CustomPicker from './CustomPicker';

// Import progressions list to determine which exercises are unlocked
const progressionsList: any[] = require('@/assets/progressions.json');

interface ReorderableWorkoutListProps {
  groupData: { label: string; value: string }[];
  selectedGroup: string;
  onGroupChange: (groupName: string) => void;
  selectedItem: string | null;
  selectedItems?: Set<string>;
  onWorkoutSelect: (name: string, workout: string) => void;
  currentIndex: number;
  showReorderButton?: boolean;
  showSingleSelect?: boolean;
  onReorderComplete?: () => Promise<void>;
  onWorkoutsChanged?: (workouts: WorkoutItem[]) => void;
  // NEW: notify parent when Single/All mode changes
  onSingleSelectChange?: (enabled: boolean) => void;
}

const ReorderableWorkoutList: React.FC<ReorderableWorkoutListProps> = ({
  groupData,
  selectedGroup,
  onGroupChange,
  selectedItem,
  selectedItems = new Set(),
  onWorkoutSelect,
  currentIndex,
  showReorderButton = true,
  showSingleSelect = false,
  onReorderComplete,
  onWorkoutsChanged,
  onSingleSelectChange,
}) => {
  const { workoutItems, groupItems, getOrderedWorkoutsForGroup, reorderWorkoutInGroup, reorderEntireGroup, reload } = useData();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [isSingleSelect, setIsSingleSelect] = useState<boolean>(false);
  const [reorderableWorkouts, setReorderableWorkouts] = useState<WorkoutItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  // Load completed exercises from storage
  useEffect(() => {
    const loadCompletedExercises = async () => {
      try {
        const completed = await AsyncStorage.getItem('@countOnMe_completed');
        if (completed) {
          setCompletedExercises(JSON.parse(completed));
        }
      } catch (error) {
        console.error('Failed to load completed exercises', error);
      }
    };
    loadCompletedExercises();
  }, [selectedGroup]); // Reload when group changes

  // Helper function to check if an exercise is unlocked based on progression order
  const isExerciseUnlocked = (exerciseName: string, completedList: string[]): boolean => {
    // Search through all progressions to find which one contains this exercise
    for (const progression of progressionsList) {
      // Build the full list of exercises in this progression (components + goal)
      const allSteps = [
        ...(progression.components || []).map((c: any) => c.component),
        progression.name, // The goal exercise
      ];

      const exerciseIndex = allSteps.indexOf(exerciseName);
      if (exerciseIndex === -1) continue; // Exercise not in this progression

      // First exercise in a progression is always unlocked
      if (exerciseIndex === 0) {
        return true;
      }

      // Exercise is unlocked if the previous exercise in the progression is completed
      const previousExercise = allSteps[exerciseIndex - 1];
      if (completedList.includes(previousExercise)) {
        return true;
      }

      // Found the exercise but it's locked in this progression
      return false;
    }

    // Exercise not found in any progression - assume it's unlocked (custom exercise)
    return true;
  };

  // Load workouts for selected group from data provider
  useEffect(() => {
    let loadedWorkouts: WorkoutItem[] = [];

    // Always use the data provider's method to get ordered workouts
    // This will handle both regular groups and the "All" group correctly
    loadedWorkouts = getOrderedWorkoutsForGroup(selectedGroup);

    // For "All" group, filter to only show unlocked exercises
    if (selectedGroup.toLowerCase() === 'all') {
      loadedWorkouts = loadedWorkouts.filter(workout =>
        isExerciseUnlocked(workout.name, completedExercises)
      );
    }

    // Add orderId for display purposes if not present
    loadedWorkouts = loadedWorkouts.map((workout, idx) => ({
      ...workout,
      orderId: workout.orderId || idx + 1,
    }));

    setWorkouts(loadedWorkouts);
    if (onWorkoutsChanged) onWorkoutsChanged(loadedWorkouts);
  }, [selectedGroup, workoutItems, groupItems, getOrderedWorkoutsForGroup, completedExercises]);

  // Move workout up/down in reorder mode
  const moveWorkoutUp = (index: number) => {
    if (index > 0) {
      const newWorkouts = [...reorderableWorkouts];
      [newWorkouts[index], newWorkouts[index - 1]] = [newWorkouts[index - 1], newWorkouts[index]];
      setReorderableWorkouts(newWorkouts);
    }
  };
  const moveWorkoutDown = (index: number) => {
    if (index < reorderableWorkouts.length - 1) {
      const newWorkouts = [...reorderableWorkouts];
      [newWorkouts[index], newWorkouts[index + 1]] = [newWorkouts[index + 1], newWorkouts[index]];
      setReorderableWorkouts(newWorkouts);
    }
  };

  const toggleReorderMode = async () => {

    if (!isReorderMode) {
      setReorderableWorkouts([...workouts]);
    } else {
      await saveReorderedWorkouts();
    }
    setIsReorderMode(!isReorderMode);
  };

  const toggleSingleSelect = () => {
    const next = !isSingleSelect;
    setIsSingleSelect(next);
    // Inform parent about the change so it can adjust completion behavior
    onSingleSelectChange?.(next);
  };

  // Save reordered workouts using data provider
  const saveReorderedWorkouts = async () => {
    try {
      // Use the batch reorder function to efficiently update all orderIds at once
      const orderedWorkoutNames = reorderableWorkouts.map(workout => workout.name);
      await reorderEntireGroup(selectedGroup, orderedWorkoutNames);

      // Update local state
      const updatedWorkouts = reorderableWorkouts.map((workout, index) => ({
        ...workout,
        orderId: index + 1,
      }));
      
      setWorkouts(updatedWorkouts);
      if (onWorkoutsChanged) onWorkoutsChanged(updatedWorkouts);
      if (onReorderComplete) onReorderComplete();
    } catch (error) {
      console.error('Error saving workout order:', error);
    }
  };

  // Use reorderable workouts when in reorder mode, otherwise use loaded workouts
  const displayWorkouts = isReorderMode ? reorderableWorkouts : workouts;

  // Render workout item
  const renderWorkoutItem = ({ item, index }: { item: WorkoutItem, index: number }) => {
    if (isReorderMode) {
      return (
        <View style={[styles.reorderableItem, { backgroundColor: theme.colors.listTileBackground, borderColor: theme.colors.tileBorder }]}>
          <View style={styles.reorderControls}>
            <TouchableOpacity
              onPress={() => moveWorkoutUp(index)}
              disabled={index === 0}
              style={[styles.reorderButton, { backgroundColor: theme.colors.surface }, index === 0 && styles.disabledButton]}
            >
              <FontAwesomeIcon
                icon={faArrowUp}
                size={16}
                color={index === 0 ? theme.colors.textMuted : theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => moveWorkoutDown(index)}
              disabled={index === displayWorkouts.length - 1}
              style={[styles.reorderButton, { backgroundColor: theme.colors.surface }, index === displayWorkouts.length - 1 && styles.disabledButton]}
            >
              <FontAwesomeIcon
                icon={faArrowDown}
                size={16}
                color={index === displayWorkouts.length - 1 ? theme.colors.textMuted : theme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.workoutInfo}>
            <ListTile
              isSelected={false}
              title={item.name}
              value={item.workout}
              description={(exercisesEn.find((e: any) => e.name === item.name)?.description) || undefined}
              workoutItem={item}
              currentIndex={currentIndex}
              onPressTile={() => {}} // Disabled in reorder mode
            />
          </View>
          <View style={styles.gripHandle}>
            <FontAwesomeIcon icon={faGripVertical} size={20} color={theme.colors.textMuted} />
          </View>
        </View>
      );
    } else {
      // Multi-select: highlight if item is in selectedItems
      const isSelected = selectedItems.has(item.name);
      const isCompleted = completedExercises.includes(item.name);

      // Determine if this exercise is locked based on progression order
      // Only apply locking for specific progression groups, NOT for "All"
      let isLocked = false;
      if (selectedGroup.toLowerCase() !== 'all') {
        // Find the first uncompleted exercise index
        const firstUncompletedIndex = displayWorkouts.findIndex(
          (w) => !completedExercises.includes(w.name)
        );
        // Exercise is locked if it comes after the first uncompleted exercise
        // (but not if all exercises are completed, i.e., firstUncompletedIndex === -1)
        isLocked = firstUncompletedIndex !== -1 && index > firstUncompletedIndex;
      }

      return (
        <ListTile
          isSelected={isSelected}
          isCompleted={isCompleted}
          isLocked={isLocked}
          title={item.name}
          value={item.workout}
          description={(exercisesEn.find((e: any) => e.name === item.name)?.description) || undefined}
          workoutItem={item}
          currentIndex={currentIndex}
          onPressTile={() => onWorkoutSelect?.(item.name, item.workout)}
        />
      );
    }
  };

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <CustomPicker
          containerStyle={{ margin: 2, justifyContent: 'center' }}
          style={{ alignSelf: 'center', justifyContent: 'center', width: 250}}
          selectedValue={selectedGroup}
          onValueChange={onGroupChange}
          items={groupData}
          dropdownIconColor="#fff"
        />
        {/* {showSingleSelect && (
          <TimerButton 
            text={isSingleSelect ? t('Single') || 'Single' : t('all') || 'All'}
            onPress={toggleSingleSelect}
            isSelected={isSingleSelect}
            style={{ width: 100 }}
          />
        )} */}
        {showReorderButton && selectedGroup.toLowerCase() === 'all' && (
          <TimerButton
            text={isReorderMode ? t('done') || 'Done' : t('reorder') || 'Reorder'}
            onPress={toggleReorderMode}
            isSelected={isReorderMode}
            style={{ width: 100 }}
          />
        )}
      </View>
      <FlatList
        style={[styles.listContainer, { flex: 1 }]}
        data={displayWorkouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.name}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  reorderButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  listContainer: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  reorderableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor and borderColor set dynamically via theme
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  reorderControls: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reorderButton: {
    // backgroundColor set dynamically via theme
    borderRadius: 4,
    padding: 6,
    marginVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
  },
  disabledButton: {
    opacity: 0.5,
  },
  workoutInfo: {
    flex: 1,
    paddingRight: 10,
  },
  gripHandle: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReorderableWorkoutList;
