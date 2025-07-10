import { useData } from '@/components/data.provider';
import { View } from '@/components/Themed';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CustomPicker from '@/components/CustomPicker';
import ListTile from '@/components/ListTile';
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
    reorderWorkoutsInGroup
  } = useData();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  
  // Group management state
  const [groupName, setGroupName] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewingGroup, setViewingGroup] = useState<string>('all'); // Default to 'all'

  const [nameError, setNameError] = useState<string | null>(null);
  const [unitError, setUnitError] = useState<string | null>(null);

  const noWorkout = workoutItems.length === 0;

  const { t } = useTranslation();

  const validateName = (name: string) => {
    if (name === '') {
      setNameError(t('name_cannot_be_empty'));
      return false;
    }
    const isNameValid = workoutItems.every((item) => item.name !== name);
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
  const addItem = () => {
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

    storeWorkout(newWorkout);
    setName('');
    setUnit('');
    //unfocus the input
    Keyboard.dismiss();
  };

  const deleteItemHandler = (key: string) => {
    if (key) {
      deleteWorkout(key);
      setSelectedItem(null);
      setNameError(null);
      setUnitError(null);
    }
  };

  const handleUnitChange = (text: string) => {
    setUnit(text);
  };

  const toggleSelectSet = (name: string) => {
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
  };

  const handleAddGroup = async () => {
    if (!groupName.trim() || selectedItems.size === 0) {
      return;
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

  const handleOnFocus = () => {
    setNameError(null);
    setUnitError(null);
  };

  const handleGroupViewSelection = (groupName: string) => {
    setViewingGroup(groupName);
    if (groupName && groupName !== 'all') {
      // Get ordered workouts for the group and select them
      const groupWorkouts = getOrderedWorkoutsForGroup(groupName);
      const groupWorkoutNames = new Set(groupWorkouts.map(w => w.name));
      setSelectedItems(groupWorkoutNames);
    } else {
      // Clear selection if 'all' is selected or no group is selected
      setSelectedItems(new Set());
    }
  };

  // Create filtered workout list: show only group workouts when a group is selected, all workouts when 'all' is selected
  const getOrderedWorkoutList = () => {
    if (!viewingGroup || viewingGroup === 'all') {
      return workoutItems;
    }

    // Return only workouts belonging to the selected group, in order
    const groupWorkouts = getOrderedWorkoutsForGroup(viewingGroup);
    return groupWorkouts;
  };

  const orderedWorkoutItems = getOrderedWorkoutList();

  const handleDragEnd = async (data: any[]) => {
    if (viewingGroup && viewingGroup !== 'all') {
      // Extract workout names in the new order
      const workoutNames = data.map(item => item.name);
      await reorderWorkoutsInGroup(viewingGroup, workoutNames);
    }
  };

  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<any>) => (
    <ListTile
      isSelected={selectedItems.has(item.name) || selectedItem === item.name}
      title={item.name}
      value={item.workout}
      onPressTile={() => toggleSelectSet(item.name)}
      onLongPress={drag}
      style={[
        isActive && { backgroundColor: '#333' }
      ]}
    />
  );

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>{t('workout_and_group_management')}</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
            <Text style={styles.label}>{t('name')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              onFocus={handleOnFocus}
            />
            {nameError && <Text style={{ color: 'red', width: '90%' }}>{nameError}</Text>}

            <Text style={styles.label}>{t('workout_set')}</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={handleUnitChange}
              placeholder={t('workout_set_placeholder')}
              placeholderTextColor="#999"
              onFocus={handleOnFocus}
            />
            {unitError && <Text style={{ color: 'red', width: '90%' }}>{unitError}</Text>}
            
            {/* Group Viewing Section */}
            <Text style={styles.label}>{t('view_group')}</Text>
            <CustomPicker
              containerStyle={{ width: '90%' }}
              style={{ width: '90%' }}
              selectedValue={viewingGroup}
              onValueChange={handleGroupViewSelection}
              items={[
                { label: t('all'), value: 'all' },
                ...groupItems.map(group => ({ label: group.name, value: group.name }))
              ]}
              dropdownIconColor="#fff"
              placeholder={t('select_group_to_view')}
            />
            
            {/* Group Management Section */}
            <Text style={styles.label}>{t('group_management')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enter_group_name')}
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
            />

            {/* All buttons in one row */}
            <View style={styles.buttonRow}>
              <TimerButton
                text={t('clear_selection')}
                onPress={() => {
                  setSelectedItems(new Set());
                }}
                style={[{ backgroundColor: '#ff4444' }]}
                small
              />
              <TimerButton
                text={t('add_group')}
                onPress={handleAddGroup}
                disabled={selectedItems.size === 0 || !groupName.trim()}
                small
                style={[{ 
                  backgroundColor: '#4CAF50', 
                  opacity: (selectedItems.size === 0 || !groupName.trim()) ? 0.5 : 1 
                }]}
              />
              <TimerButton
                disabled={selectedItem ? false : true}
                text={t('delete')}
                onPress={() => deleteItemHandler(selectedItem!)}
                style={[styles.actionButton, { backgroundColor: '#ff6b6b' }]}
                small
              />
              <TimerButton
                disabled={unit !== '' && name !== '' ? false : true}
                text={t('add')}
                onPress={addItem}
                style={[ { backgroundColor: '#4CAF50' }]}
                small
              />
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
            {viewingGroup && viewingGroup !== 'all' && (
              <Text style={styles.dragHint}>
                {t('drag_to_reorder')}
              </Text>
            )}
            <SafeAreaProvider style={{ width: '100%' }}>
              <SafeAreaView style={styles.flatList}>
                {viewingGroup && viewingGroup !== 'all' ? (
                  <DraggableFlatList
                    data={orderedWorkoutItems}
                    renderItem={renderDraggableItem}
                    keyExtractor={(item) => item.name}
                    onDragEnd={({ data }) => handleDragEnd(data)}
                  />
                ) : (
                  <FlatList
                    data={orderedWorkoutItems}
                    renderItem={({ item }) => (
                      <ListTile
                        isSelected={selectedItems.has(item.name) || selectedItem === item.name}
                        title={item.name}
                        value={item.workout}
                        onPressTile={() => toggleSelectSet(item.name)}
                      />
                    )}
                    keyExtractor={(item) => item.name}
                  />
                )}
              </SafeAreaView>
            </SafeAreaProvider>
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
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  groupViewingIndicator: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#888',
  },
  dragHint: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 5,
  },
});
