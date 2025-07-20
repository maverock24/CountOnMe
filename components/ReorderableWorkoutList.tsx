import { faArrowDown, faArrowUp, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useData } from '@/components/data.provider';
import ListTile from '@/components/ListTile';
import TimerButton from '@/components/TimerButton';
import CustomPicker from './CustomPicker';

interface WorkoutItem {
  name: string;
  workout: string;
  group?: string;
}

export interface ReorderableWorkoutListProps {
  workouts: WorkoutItem[];
  selectedGroup: string;
  groupData: { label: string; value: string }[];
  onGroupChange: (groupName: string) => void;
  selectedItem: string | null;
  selectedItems?: Set<string>;
  onWorkoutSelect: (name: string, workout: string) => void;
  currentIndex: number;
  showReorderButton?: boolean;
  onReorderComplete?: () => Promise<void>;
}

const ReorderableWorkoutList: React.FC<ReorderableWorkoutListProps> = ({
  workouts,
  selectedGroup,
  groupData,
  onGroupChange,
  selectedItem,
  selectedItems = new Set(),
  onWorkoutSelect,
  currentIndex,
  showReorderButton = true,
  onReorderComplete,
}) => {
  const { reload } = useData();
  const { t } = useTranslation();
  
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [reorderableWorkouts, setReorderableWorkouts] = useState<WorkoutItem[]>([]);

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
      // Enter reorder mode - copy current workouts to reorderable state
      setReorderableWorkouts([...workouts]);
    } else {
      // Exit reorder mode - save the new order
      await saveReorderedWorkouts();
    }
    setIsReorderMode(!isReorderMode);
  };

  const saveReorderedWorkouts = async () => {
    try {
      if (selectedGroup !== 'All' && selectedGroup !== 'all') {
        // Save the new order for the specific group by updating localStorage directly
        const groupKey = `@countOnMe_group_${selectedGroup}`;
        const existingGroupData = await AsyncStorage.getItem(groupKey);
        
        if (existingGroupData) {
          const groupData = JSON.parse(existingGroupData);
          
          // Update the workouts array with new order
          const updatedWorkouts = reorderableWorkouts.map((workout, index) => ({
            orderId: index + 1,
            name: workout.name
          }));
          
          // Update the group data
          const updatedGroupData = {
            ...groupData,
            workouts: updatedWorkouts
          };
          
          // Save back to localStorage
          await AsyncStorage.setItem(groupKey, JSON.stringify(updatedGroupData));
          
          console.log('Group workout order saved successfully');
        }
      } else {
        // For 'All' workouts, create or update a special "All" group
        const allGroupKey = '@countOnMe_group_All';
        
        // Create the workouts array with new order
        const updatedWorkouts = reorderableWorkouts.map((workout, index) => ({
          orderId: index + 1,
          name: workout.name
        }));
        
        // Create or update the "All" group data
        const allGroupData = {
          name: 'All',
          workouts: updatedWorkouts
        };
        
        // Save to localStorage
        await AsyncStorage.setItem(allGroupKey, JSON.stringify(allGroupData));
        
        console.log('Global workout order saved successfully');
      }
      
      // Reload data provider to reflect changes
      await reload();
      
      // Notify parent component if callback provided
      if (onReorderComplete) {
        onReorderComplete();
      }
    } catch (error) {
      console.error('Error saving workout order:', error);
    }
  };

  // Use reorderable workouts when in reorder mode, otherwise use provided workouts
  const displayWorkouts = isReorderMode ? reorderableWorkouts : workouts;

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
