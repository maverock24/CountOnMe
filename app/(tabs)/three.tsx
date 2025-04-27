import { useData } from '@/components/data.provider';
import { View } from '@/components/Themed';
import React, { useState } from 'react';
import { FlatList, Keyboard, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TimerButton from '@/components/TimerButton';
import commonStyles from '../styles';
import ListTile from '@/components/ListTile';

export default function TabThreeScreen() {
  const { workoutItems, storeItem, deleteItem } = useData();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const noWorkout = workoutItems.length === 0;

  const addItem = () => {
    if (!name || !unit) return;
    // Convert unit string that contains minutes seperated by semicolons to seconds string
    const unitInSeconds = unit
      .split(';')
      .map((time) => parseFloat(time) * 60)
      .join(';');

    storeItem(name, unitInSeconds);
    setName('');
    setUnit('');
    //unfocus the input
    Keyboard.dismiss();
  };

  const deleteSet = (key: string) => {
    // Use deleteItem from DataProvider to delete the item
    deleteItem(key);
  };

  const handleUnitChange = (text: string) => {
    setUnit(text);
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>New Workout</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Workout set (in minutes with ; seperator)</Text>
            <TextInput style={styles.input} value={unit} onChangeText={handleUnitChange} />

            <TimerButton text="Add" onPress={addItem} maxWidth />
          </View>
        </View>
        <View style={commonStyles.outerContainer}>
          <Text style={commonStyles.tileTitle}>Available Workouts</Text>
          <View style={[commonStyles.tile, { flex: 1, padding: 5, backgroundColor: '#111719' }]}>
            {noWorkout && (
              <Text style={{ padding: 10, fontSize: 24, marginTop: '50%', color: '#fff' }}>
                No workouts available
              </Text>
            )}
            <SafeAreaProvider style={{ width: '100%' }}>
              <SafeAreaView style={styles.flatList}>
                <FlatList
                  data={workoutItems}
                  renderItem={({ item }) => (
                    <ListTile
                      title={item.key}
                      value={item.value}
                      isSelected={false}
                      onPressBtn={() => deleteSet(item.key)}
                    />
                  )}
                  keyExtractor={(item) => item.key}
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
});
