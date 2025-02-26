import { StoredItem, useData } from '@/components/data.provider';
import { View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import {
  FlatList,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import commonStyles from '../styles';

type Inputs = {
  example: string;
  exampleRequired: string;
};

type Item = {
  key: string;
  value: string;
};

export default function TabThreeScreen() {
  const { storedItems, storeItem, deleteItem } = useData();

  const [data, setData] = useState<StoredItem[]>(storedItems);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const noWorkout =
    storedItems.length === 0 ||
    (storedItems[0].key === 'audioThreshold' && storedItems.length === 1);

  const addItem = () => {
    if (!name || !unit) return;
    // Convert unit string that contains minutes seperated by semicolons to seconds string
    const unitInSeconds = unit
      .split(';')
      .map((time) => parseInt(time) * 60)
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
    // Allow only numbers and semicolons
    const regex = /^[0-9;]*$/;
    if (regex.test(text)) {
      setUnit(text);
    }
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.tileTitle}>New Workout</Text>
      <View style={commonStyles.tile}>
        <View style={styles.innerWrapperTopTile}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Workout set (in minutes with ; seperator)</Text>
          <TextInput style={styles.input} value={unit} onChangeText={handleUnitChange} />
          <TouchableOpacity
            style={[commonStyles.button, { width: '90%' }]}
            onPress={() => addItem()}
          >
            <Text style={commonStyles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={commonStyles.tileTitle}>Available Workouts</Text>
      {noWorkout && (
        <View style={commonStyles.tile}>
          <Text style={[commonStyles.buttonText, { padding: 10 }]}>No workouts available</Text>
        </View>
      )}
      <SafeAreaProvider>
        <SafeAreaView style={styles.flatList}>
          <FlatList
            data={storedItems}
            renderItem={({ item }) =>
              item.key === 'breakMusic' ||
              item.key === 'workoutMusic' ||
              item.key === 'audioThreshold' ? null : (
                <View style={commonStyles.buttonTile}>
                  <Text style={commonStyles.listItemTitle}>{item.key}</Text>
                  <Text style={commonStyles.listItemValue}>
                    {item.value
                      ?.split(';')
                      .map((time) => parseInt(time) / 60)
                      .join(' | ')}
                  </Text>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteSet(item.key)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )
            }
            keyExtractor={(item) => item.key}
          />
        </SafeAreaView>
      </SafeAreaProvider>
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
    backgroundColor: '#101418',
  },
  listItem: {
    flexDirection: 'row', // align children horizontally
    justifyContent: 'space-between', // push delete button to right
    padding: 0,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 50,
    width: '90%',
  },
  listItemTitle: {
    margin: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgb(192, 205, 236)',
  },
  listItemValue: {
    margin: 12,
    fontSize: 12,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101418',
  },
  label: {
    fontSize: 12,
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
    borderBottomColor: 'rgb(81, 84, 90)',
    borderBottomWidth: 1,
    padding: 10,
    height: 40,
    marginBottom: 12,
    width: '90%',
    color: '#ECEDEE',
  },
});
