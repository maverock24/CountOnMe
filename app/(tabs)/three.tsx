import { useData } from '@/components/data.provider';
import { View } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, Text, TextInput } from 'react-native';

import CustomPicker from '@/components/CustomPicker';
import type { WorkoutItem } from '@/components/ReorderableWorkoutList';
import ReorderableWorkoutList from '@/components/ReorderableWorkoutList';
import TimerButton from '@/components/TimerButton';
import commonStyles from '../styles';

export default function TabThreeScreen() {
  const { 
    workoutItems, 
    groupItems, 
    storeWorkout, 
    storeGroup, 
    deleteWorkout,
    getOrderedWorkoutsForGroup,
    reload
  } = useData();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  
  // Group management state
  const [groupName, setGroupName] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewingGroup, setViewingGroup] = useState<string>('all'); // For Group section dropdown
  const [filteredGroup, setFilteredGroup] = useState<string>('all'); // For workout list filter dropdown

  const [nameError, setNameError] = useState<string | null>(null);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [removeGroupDisabled, setRemoveGroupDisabled] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingWorkoutName, setEditingWorkoutName] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const noWorkout = workoutItems.length === 0;

  const { t } = useTranslation();

  const validateName = (name: string) => {
    if (name === '') {
      setNameError(t('name_cannot_be_empty'));
      return false;
    }
    
    // Allow same name if we're editing the same workout
    const isEditingSameName = isEditing && name === editingWorkoutName;
    const isNameValid = isEditingSameName || workoutItems.every((item) => item.name !== name);
    
    if (!isNameValid) {
      setNameError(t('name_already_exists'));
      return false;
    }
    setNameError(null);
    return true;
  };
  const validateUnit = (unit: string) => {
    if (unit === '') {
      setUnitError(t('unit_cannot_be_empty'));
      return false;
    }
    const isUnitValid = unit.split(';').every((time) => {
      const parsedTime = parseFloat(time);
      return !isNaN(parsedTime) && parsedTime > 0;
    });
    if (isUnitValid) {
      setUnitError(null);
      return true;
    }
    setUnitError(t('invalid_unit_format'));
    return false;
  };
  const addItem = async () => {
    const isNameValid = validateName(name);
    const isUnitValid = validateUnit(unit);
    if (!isNameValid || !isUnitValid) return;
    const unitInSeconds = unit
      .split(';')
      .map((time) => parseFloat(time) * 60)
      .join(';');

    const newWorkout = {
      name: name,
      workout: unitInSeconds,
      group: undefined
    };

    await storeWorkout(newWorkout);
    await reload();
  await syncAllGroup();

    setName('');
    setUnit('');
    //unfocus the input
    Keyboard.dismiss();
  };

  const deleteItemHandler = async (workoutName?: string) => {
    // Determine which workouts to delete
    const workoutsToDelete = workoutName ? [workoutName] : Array.from(selectedItems);
    
    if (workoutsToDelete.length === 0) return;

    try {
      // Delete each selected workout (data provider will handle group removal automatically)
      for (const workout of workoutsToDelete) {
        await deleteWorkout(workout);
      }

      // Clear selections and editing state after successful deletion
      setSelectedItem(null);
      setSelectedItems(new Set());
      setNameError(null);
      setUnitError(null);
      cancelEdit(); // Clear editing state
      await reload();
      await syncAllGroup();
    } catch (error) {
      console.error('Failed to delete workouts:', error);
    }
  };

  const handleUnitChange = (text: string) => {
    setUnit(text);
  };

  const loadWorkoutForEditing = (workoutName: string) => {
    const workout = workoutItems.find(item => item.name === workoutName);
    if (workout) {
      setName(workoutName);
      // Convert seconds back to minutes for display
      const unitInMinutes = workout.workout
        .split(';')
        .map(time => (parseFloat(time) / 60).toString())
        .join(';');
      setUnit(unitInMinutes);
      setIsEditing(true);
      setEditingWorkoutName(workoutName);
    }
  };

  const saveWorkoutChanges = async () => {
    if (!editingWorkoutName) return;
    
    const isNameValid = validateName(name);
    const isUnitValid = validateUnit(unit);
    
    // Allow same name if we're editing the same workout
    const isEditingSameName = name === editingWorkoutName;
    const nameValidForEdit = isEditingSameName || isNameValid;
    
    if (!nameValidForEdit || !isUnitValid) return;

    try {
      // Convert minutes to seconds
      const unitInSeconds = unit
        .split(';')
        .map((time) => parseFloat(time) * 60)
        .join(';');

      // Always delete the original workout first (this ensures we overwrite, not duplicate)
      await deleteWorkout(editingWorkoutName);

      // Save the updated workout (this will overwrite if name is same, or create new if name changed)
      const updatedWorkout = {
        name: name,
        workout: unitInSeconds,
        group: undefined
      };

      await storeWorkout(updatedWorkout);
      await reload();
      await syncAllGroup();

      // Clear form and editing state
      setName('');
      setUnit('');
      setIsEditing(false);
      setEditingWorkoutName(null);
      setSelectedItem(null);
      setSelectedItems(new Set());
      
      Keyboard.dismiss();
    } catch (error) {
      console.error('Failed to save workout changes:', error);
    }
  };

  const cancelEdit = () => {
    setName('');
    setUnit('');
    setIsEditing(false);
    setEditingWorkoutName(null);
    setNameError(null);
    setUnitError(null);
    setIsAssigning(false); // Clear assignment mode when canceling edit
  };

  const toggleSelectSet = (name: string, workout: string) => {
    // Handle multi-select for group creation
    const newSelectedItems = new Set(selectedItems);
    const isCurrentlySelected = newSelectedItems.has(name);
    
    if (isCurrentlySelected) {
      newSelectedItems.delete(name);
    } else {
      newSelectedItems.add(name);
    }
    setSelectedItems(newSelectedItems);
    
    // Handle single selection for delete functionality
    // Only set single selection if the item is being selected (not deselected)
    if (!isCurrentlySelected) {
      setSelectedItem(name);
    } else if (selectedItem === name) {
      // If we're deselecting the currently selected item, clear single selection
      setSelectedItem(null);
    }

    // Handle edit mode: ALWAYS when exactly one item is selected, load it for editing
    if (newSelectedItems.size === 1) {
      const selectedWorkoutName = Array.from(newSelectedItems)[0];
      loadWorkoutForEditing(selectedWorkoutName);
    } else {
      // Clear editing mode if multiple items are selected or none
      cancelEdit();
    }
  };

  const handleAddGroup = async () => {
    if (!groupName.trim()) {
      return;
    }

    // Prevent creating groups named "All" (case-insensitive)
    if (groupName.trim().toLowerCase() === 'all') {
      return; // Silently prevent creating "All" group
    }

    const newGroup = {
      name: groupName.trim(),
      workouts: Array.from(selectedItems).map((workoutName, index) => ({
        orderId: index + 1,
        name: workoutName
      }))
    };

    try {
      await storeGroup(newGroup);
      setGroupName('');
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  // Assignment flow: supports both (1) select workouts -> assign -> select group, and (2) select group -> select workouts -> assign
  // Assignment now REPLACES the group's workouts with the current selection
  const handleAssignToGroup = async (targetGroupName: string) => {
    if (selectedItems.size === 0 || !targetGroupName || targetGroupName === 'all') {
      // Invalid assignment
      return;
    }
    try {
      const existingGroup = groupItems.find(group => group.name === targetGroupName);
      if (!existingGroup) return;
      // Replace the group's workouts with the current selection, preserving order of selection
      const newWorkouts = Array.from(selectedItems).map((workoutName, index) => ({
        orderId: index + 1,
        name: workoutName
      }));
      const updatedGroup = {
        ...existingGroup,
        workouts: newWorkouts
      };
      await storeGroup(updatedGroup);
      // Clear assignment mode and selections
      setIsAssigning(false);
      setSelectedItems(new Set());
      setViewingGroup(targetGroupName);
    } catch (error) {
      console.error('Failed to assign workouts to group:', error);
    }
  };

  // Handles clicking the Assign button
  const handleAssignButton = () => {
    if (!isAssigning) {
      // Enter assignment mode
      setIsAssigning(true);
      // If a group is already selected and not 'all', and workouts are selected, assign immediately
      if (viewingGroup && viewingGroup !== 'all' && selectedItems.size > 0) {
        handleAssignToGroup(viewingGroup);
      }
      // Otherwise, wait for user to select a group
    } else {
      // Already in assignment mode: if group and workouts are selected, assign
      if (viewingGroup && viewingGroup !== 'all' && selectedItems.size > 0) {
        handleAssignToGroup(viewingGroup);
      }
      // Otherwise, stay in assignment mode and prompt user to select a group
    }
  };

  const handleRemoveFromGroup = async () => {
    if (!viewingGroup || viewingGroup === 'all' || selectedItems.size === 0) {
      return;
    }

    try {
      // Get the existing group
      const existingGroup = groupItems.find(group => group.name === viewingGroup);
      if (!existingGroup) return;

      // Remove selected workouts from the group
      const remainingWorkouts = existingGroup.workouts.filter(workout => 
        !selectedItems.has(workout.name)
      );

      if (remainingWorkouts.length === 0) {
        // If no workouts remain, delete the entire group
        await AsyncStorage.removeItem(`@countOnMe_group_${viewingGroup}`);
        // Switch back to 'all' view since the group is deleted
        setViewingGroup('all');
        setRemoveGroupDisabled(true);
        await reload(); // Immediately reload group list
      } else {
        // Update the group with remaining workouts, maintaining order
        const updatedGroup = {
          ...existingGroup,
          workouts: remainingWorkouts.map((workout, index) => ({
            ...workout,
            orderId: index + 1 // Reorder the remaining workouts
          }))
        };
        await storeGroup(updatedGroup);
        await reload(); // Immediately reload group list
      }

      // Clear selections and reload data
      setSelectedItems(new Set());
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to remove workouts from group:', error);
    }
  };

  const handleOnFocus = () => {
    setNameError(null);
    setUnitError(null);
  };

  const handleReorderComplete = async () => {
    // Refresh the data after reordering is complete
    await reload();
  };

  const handleGroupViewSelection = (groupName: string) => {
    setViewingGroup(groupName);
    cancelEdit(); // Clear editing state when switching views
    // If in assignment mode and a group is selected (not 'all'), and workouts are selected, assign
    if (isAssigning && selectedItems.size > 0 && groupName !== 'all') {
      handleAssignToGroup(groupName);
      return;
    }
    setIsAssigning(false); // Clear assignment mode when switching views (unless in assignment flow)
    if (groupName && groupName !== 'all') {
      setRemoveGroupDisabled(false);
      const groupWorkouts = getOrderedWorkoutsForGroup(groupName);
      const groupWorkoutNames = new Set(groupWorkouts.map(w => w.name));
      setSelectedItems(groupWorkoutNames);
    } else {
      setSelectedItems(new Set());
      setRemoveGroupDisabled(true);
    }
  };

  const handleWorkoutListGroupFilter = (groupName: string) => {
    setFilteredGroup(groupName);
  };

  // Construct groupData for dropdown
  const groupData = [
    { label: t('all'), value: 'all' },
    ...groupItems
      .filter(group => group.name.toLowerCase() !== 'all')
      .map(group => ({ label: group.name, value: group.name }))
  ];

  // Workouts are now loaded and ordered by ReorderableWorkoutList
  const [orderedWorkoutItems, setOrderedWorkoutItems] = useState<WorkoutItem[]>([]);

  // Sync 'All' group in storage with current workoutItems
  const syncAllGroup = async () => {
    const allGroupKey = '@countOnMe_group_All';
    try {
      const keys = await AsyncStorage.getAllKeys();
      const workoutKeys = keys.filter(k => k.startsWith('@countOnMe_') && !k.startsWith('@countOnMe_group_'));
      const workoutEntries = await AsyncStorage.multiGet(workoutKeys);
      const workoutsArr = workoutEntries.map(([key, value], idx) => {
        const name = key.replace('@countOnMe_', '');
        return { orderId: idx + 1, name };
      });
      await AsyncStorage.setItem(allGroupKey, JSON.stringify({ name: 'All', workouts: workoutsArr }));
    } catch (err) {
      console.error('Failed to sync All group:', err);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>{t('workout_and_group_management')}</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
            <View style={{ width: '95%', flexDirection: 'row', justifyContent: 'space-between', borderRadius: 10, borderColor: '#2A2E33', borderWidth: 1, padding: 10 }}>

            <View style={{ flexDirection: 'column', width: '70%' }}>
            <Text style={styles.label}>{t('workout')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              onFocus={handleOnFocus}
            />
          
            {nameError && <Text style={{ color: 'red', width: '90%' }}>{nameError}</Text>}

            <Text style={styles.label}>{t('repetitions_breaks')}</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={handleUnitChange}
              placeholder={t('workout_set_placeholder')}
              placeholderTextColor="#999"
              onFocus={handleOnFocus}
            />
            {unitError && <Text style={{ color: 'red', width: '90%' }}>{unitError}</Text>}
            </View>
            <View style={{ flexDirection: 'column', width: '30%' }}>
            <TimerButton
                disabled={selectedItem === null && selectedItems.size === 0}
                text={selectedItems.size > 1 ? t('delete_selected') || `Delete (${selectedItems.size})` : t('delete')}
                onPress={() => deleteItemHandler()}
              />
              <TimerButton
                disabled={unit === '' || name === '' || isEditing}
                text={t('add')}
                onPress={addItem}
              />
              <TimerButton
                disabled={!isEditing || selectedItems.size !== 1 || unit === '' || name === ''}
                text={t('save') || 'Save'}
                onPress={saveWorkoutChanges}
              />
            </View>
            </View>
            <View style={{ width: '100%', borderTopColor:'white', borderTopWidth:0, margin:10}}/>
            
            <View style={{ width: '95%', flexDirection: 'row', justifyContent: 'space-between', borderRadius: 10, borderColor: '#2A2E33', borderWidth: 1, padding: 10, marginBottom: 10 }}>
              <View style={{ flexDirection: 'column', width: '70%' }}>
              <Text style={styles.label}>{t('group_management')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enter_group_name')}
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
            />
              <CustomPicker
                style={{ width: '90%' }}
                selectedValue={viewingGroup}
                onValueChange={handleGroupViewSelection}
                items={groupData}
                dropdownIconColor="#fff"
                placeholder={t('select_group_to_view')}
              />
              
              </View>
              <View style={{ flexDirection: 'column', width: '30%', marginTop: 4 }}>
              
                <TimerButton
                text={t('add_group')}
                onPress={handleAddGroup}
                disabled={!groupName.trim()}
              />
              <TimerButton
                disabled={removeGroupDisabled || selectedItems.size === 0}
                text={t('remove_from_group') || 'Remove'}
                onPress={handleRemoveFromGroup}
              />
              <TimerButton
                isSelected={isAssigning}
                text={
                  isAssigning
                    ? (viewingGroup === 'all' ? t('select_group_to_assign') || 'Select group to assign' : t('assign') || 'Assign')
                    : t('assign') || 'Assign'
                }
                onPress={handleAssignButton}
                disabled={selectedItems.size === 0}
              />
              </View>
            </View>
      
          </View>
        </View>
        
        <View style={commonStyles.outerContainer}>
          <Text style={commonStyles.tileTitle}>
            {t('available_workouts')}
            {viewingGroup && viewingGroup !== 'all' && (
              <Text style={styles.groupViewingIndicator}> - {t('view_group')}: {viewingGroup}</Text>
            )}
            {viewingGroup === 'all' && (
              <Text style={styles.groupViewingIndicator}> - {t('all')}</Text>
            )}
          </Text>
          <View style={[commonStyles.tile, { flex: 1, padding: 5 }]}>
            {noWorkout && (
              <Text style={{ padding: 10, fontSize: 24, marginTop: '50%', color: '#fff' }}>
                {t('no_workouts_available')}
              </Text>
            )}
            {!noWorkout && (
              <ReorderableWorkoutList
                key={`${filteredGroup}-${groupItems.length}`}
                groupData={groupData}
                selectedGroup={filteredGroup}
                onGroupChange={handleWorkoutListGroupFilter}
                selectedItem={selectedItem}
                selectedItems={selectedItems}
                onWorkoutSelect={toggleSelectSet}
                showReorderButton={true}
                onReorderComplete={handleReorderComplete}
                currentIndex={selectedItem ? orderedWorkoutItems.findIndex(w => w.name === selectedItem) : 0}
                onWorkoutsChanged={setOrderedWorkoutItems}
                allWorkouts={workoutItems}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  innerWrapperTopTile: {
    paddingTop: 10,
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    color: 'black',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgb(34, 41, 58)',
  },
  flatList: {
    flex: 1,
    marginTop: 5,
    marginBottom: 20,
    width: '100%',
    height: '20%',
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101418',
  },
  label: {
    fontSize: 16,
    marginBottom: 0,
    color: 'rgb(231, 234, 241)',
    textAlign: 'left',
    width: '90%',
  },
  icon: {
    fontSize: 100,
    color: '#fff',
  },
  input: {
    fontSize: 16,
    borderBottomColor: 'rgb(81, 84, 90)',
    borderBottomWidth: 1,
    padding: 10,
    height: 40,
    marginBottom: 12,
    width: '90%',
    color: '#ECEDEE',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 10,
    marginBottom: 10,
  },
  groupViewingIndicator: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#888',
  },
});
