import { useData } from '@/components/data.provider';
import { View } from '@/components/Themed';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
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
    getOrderedWorkoutsForGroup
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
  const [removeGroupDisabled, setRemoveGroupDisabled] = useState<boolean>(false);

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
      setRemoveGroupDisabled(false);
      const groupWorkouts = getOrderedWorkoutsForGroup(groupName);
      const groupWorkoutNames = new Set(groupWorkouts.map(w => w.name));
      setSelectedItems(groupWorkoutNames);
    } else {
      // Clear selection if 'all' is selected or no group is selected
      setSelectedItems(new Set());
      setRemoveGroupDisabled(true);
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
                disabled={selectedItem ? false : true}
                text={t('delete')}
                onPress={() => deleteItemHandler(selectedItem!)}
              />
              <TimerButton
                disabled={unit !== '' && name !== '' ? false : true}
                text={t('add')}
                onPress={addItem}
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
                items={[
                  { label: t('all'), value: 'all' },
                  ...groupItems.map(group => ({ label: group.name, value: group.name }))
                ]}
                dropdownIconColor="#fff"
                placeholder={t('select_group_to_view')}
              />
              
              </View>
              <View style={{ flexDirection: 'column', width: '30%', marginTop: 4 }}>
              
                <TimerButton
                text={t('add_group')}
                onPress={handleAddGroup}
                disabled={selectedItems.size === 0 || !groupName.trim()}
              />
              <TimerButton
                disabled={removeGroupDisabled}
                text={t('delete_workout_group')}
                onPress={() => handleGroupViewSelection(viewingGroup)}
                
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
            <SafeAreaProvider style={{ width: '100%' }}>
              <SafeAreaView style={styles.flatList}>
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
                  showsVerticalScrollIndicator={false}
                />
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
  groupViewingIndicator: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#888',
  },
});
