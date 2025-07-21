import { faArrowDown, faArrowUp, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useData } from '@/components/data.provider';
import ListTile from '@/components/ListTile';
import TimerButton from '@/components/TimerButton';
import CustomPicker from './CustomPicker';

export interface WorkoutItem {
  name: string;
  workout: string;
  group?: string;
  orderId?: number;
}

interface ReorderableWorkoutListProps {
  groupData: { label: string; value: string }[];
  selectedGroup: string;
  onGroupChange: (groupName: string) => void;
  selectedItem: string | null;
  selectedItems?: Set<string>;
  onWorkoutSelect: (name: string, workout: string) => void;
  currentIndex: number;
  showReorderButton?: boolean;
  onReorderComplete?: () => Promise<void>;
  onWorkoutsChanged?: (workouts: WorkoutItem[]) => void;
  allWorkouts?: WorkoutItem[]; // Pass all workouts from parent for 'All' group merging
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
  onReorderComplete,
  onWorkoutsChanged,
  allWorkouts,
}) => {
  const { reload } = useData();
  const { t } = useTranslation();
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [reorderableWorkouts, setReorderableWorkouts] = useState<WorkoutItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);

  // Load workouts for selected group from localStorage
  useEffect(() => {
    const loadWorkouts = async () => {
      let groupKey = selectedGroup === 'All' || selectedGroup === 'all'
        ? '@countOnMe_group_All'
        : `@countOnMe_group_${selectedGroup}`;
      try {
        const groupDataStr = await AsyncStorage.getItem(groupKey);
        let loadedWorkouts: WorkoutItem[] = [];
        if (groupDataStr) {
          const groupObj = JSON.parse(groupDataStr);
          if (Array.isArray(groupObj.workouts)) {
            // Hydrate each group workout with full data from allWorkouts
            loadedWorkouts = groupObj.workouts.map((w: any, idx: number) => {
              const full = Array.isArray(allWorkouts) ? allWorkouts.find(aw => aw.name === w.name) : undefined;
              return {
                name: w.name,
                workout: full?.workout || w.workout || '',
                group: selectedGroup,
                orderId: w.orderId || idx + 1,
              };
            });
          }
        }
        // For 'All' group, merge with allWorkouts to ensure all are present
        if ((selectedGroup === 'All' || selectedGroup === 'all') && Array.isArray(allWorkouts)) {
          const existingNames = new Set(loadedWorkouts.map(w => w.name));
          const missingWorkouts = allWorkouts.filter(w => !existingNames.has(w.name));
          loadedWorkouts = [
            ...loadedWorkouts,
            ...missingWorkouts.map((w, idx) => ({
              ...w,
              group: 'All',
              orderId: loadedWorkouts.length + idx + 1,
            }))
          ];
        }
        // Sort by orderId if present
        loadedWorkouts.sort((a, b) => (a.orderId ?? 0) - (b.orderId ?? 0));
        setWorkouts(loadedWorkouts);
        if (onWorkoutsChanged) onWorkoutsChanged(loadedWorkouts);
      } catch (err) {
        setWorkouts([]);
        if (onWorkoutsChanged) onWorkoutsChanged([]);
      }
    };
    loadWorkouts();
  }, [selectedGroup, allWorkouts]);

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

  // Save reordered workouts to localStorage
  const saveReorderedWorkouts = async () => {
    try {
      let groupKey = selectedGroup === 'All' || selectedGroup === 'all'
        ? '@countOnMe_group_All'
        : `@countOnMe_group_${selectedGroup}`;
      const updatedWorkouts = reorderableWorkouts.map((workout, index) => ({
        ...workout,
        orderId: index + 1,
      }));
      const groupObj = {
        name: selectedGroup,
        workouts: updatedWorkouts,
      };
      await AsyncStorage.setItem(groupKey, JSON.stringify(groupObj));
      setWorkouts(updatedWorkouts);
      if (onWorkoutsChanged) onWorkoutsChanged(updatedWorkouts);
      await reload();
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
        <View style={styles.reorderableItem}>
          <View style={styles.reorderControls}>
            <TouchableOpacity 
              onPress={() => moveWorkoutUp(index)}
              disabled={index === 0}
              style={[styles.reorderButton, index === 0 && styles.disabledButton]}
            >
              <FontAwesomeIcon 
                icon={faArrowUp} 
                size={16} 
                color={index === 0 ? '#666' : '#fff'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => moveWorkoutDown(index)}
              disabled={index === displayWorkouts.length - 1}
              style={[styles.reorderButton, index === displayWorkouts.length - 1 && styles.disabledButton]}
            >
              <FontAwesomeIcon 
                icon={faArrowDown} 
                size={16} 
                color={index === displayWorkouts.length - 1 ? '#666' : '#fff'} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.workoutInfo}>
            <ListTile
              isSelected={false}
              title={item.name}
              value={item.workout}
              currentIndex={currentIndex}
              onPressTile={() => {}} // Disabled in reorder mode
            />
          </View>
          <View style={styles.gripHandle}>
            <FontAwesomeIcon icon={faGripVertical} size={20} color="#666" />
          </View>
        </View>
      );
    } else {
      // Multi-select: highlight if item is in selectedItems
      const isSelected = selectedItems.has(item.name);
      return (
        <ListTile
          isSelected={isSelected}
          title={item.name}
          value={item.workout}
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
          containerStyle={{ margin: 2, justifyContent: 'center', width: 150 }}
          style={{ alignSelf: 'center', justifyContent: 'center'}}
          selectedValue={selectedGroup}
          onValueChange={onGroupChange}
          items={groupData}
          dropdownIconColor="#fff"
        />
        {showReorderButton && (
          <TimerButton 
            text={isReorderMode ? t('done') || 'Done' : t('reorder') || 'Reorder'}
            onPress={toggleReorderMode}
            isSelected={isReorderMode}
            style={{ width: 100 }}
          />
        )}
      </View>
      <FlatList
        style={styles.listContainer}
        data={displayWorkouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.name}
        showsVerticalScrollIndicator={false}
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
    backgroundColor: '#1A1E23',
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  reorderControls: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reorderButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 4,
    padding: 6,
    marginVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
  },
  disabledButton: {
    backgroundColor: '#1A1A1A',
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
