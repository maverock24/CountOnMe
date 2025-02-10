import React, { useState } from 'react';
import { StyleSheet, TextInput, Text, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { View } from '@/components/Themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StoredItem, useData } from '@/components/data.provider';

type Inputs = {
  example: string
  exampleRequired: string
}

type Item = {
  key: string
  value: string
}

const dataList = [
  { key: 'Seil springen', value: '300,120,300,120,300' },
  { key: 'Yoga', value: '600,120,600,120,600' },
  { key: 'Laufen', value: '600,120,600,120,600' },
  { key: 'Krafttraining', value: '600,120,600,120,600' },
  { key: 'Schwimmen', value: '600,120,600,120,600' },
  { key: 'Radfahren', value: '600,120,600,120,600' },
  { key: 'Tanzen', value: '600,120,600,120,600' },
  { key: 'Klettern', value: '600,120,600,120,600' },
];

export default function TabThreeScreen() {

  const {storedItems, storeItem, deleteItem} = useData();

  const [data, setData] = useState<StoredItem[]>(storedItems);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');

  const formatTimeToMinuteString = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  const addItem = () => { const addItem = () => {
    // use the values from TextInput: name for key and unit for value
    if (!name || !unit) return; // Optionally validate
    const newItem = { key: name, value: unit };
    //add the new item to the data array to the top
    const newData = [newItem, ...data];
    setData(newData);
    // Clear the inputs after adding
    setName('');
    setUnit('');
  }
    if (!name || !unit) return;
    // Use storeItem from DataProvider to store the new item
    storeItem(name, unit);
    setName('');
    setUnit('');
  };

  const deleteSet = (key: string) => {
    // Use deleteItem from DataProvider to delete the item
    deleteItem(key);
  }


  return (
    <View style={styles.container}>
        <TextInput style={styles.input}
          placeholder="name"
          value={name}
          onChangeText={setName}
           />
        <TextInput style={styles.input}
          placeholder="(starting with exercise) in secs: e.g. 120,300,600"
          value={unit}
        onChangeText={setUnit}
        />
        <TouchableOpacity style={styles.button} onPress={() => addItem()}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
        <SafeAreaProvider>
          <SafeAreaView style={styles.flatList}>
          <FlatList
            data={storedItems}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={styles.listItemTitle}>{item.key}</Text>
                <Text style={styles.listItemValue}>{item.value}</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteSet(item.key)}>
                <Ionicons styles={styles.icon} name="trash" size={21} color="gray" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.key}
          />
        </SafeAreaView>
        </SafeAreaProvider>
    </View>
  );
  
}

const styles = StyleSheet.create({
  deleteButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  deleteButton: {
    color: 'black',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  flatList: {
    flex: 1,
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
    height: '20%',
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
    color: 'gray',
  },
  listItemValue: {
    margin: 12,
    fontSize: 12,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'darkgray',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'deepskyblue',
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 20,
    margin: 10,
    color: 'black',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 120,
    color: '#fff',
  },
  input: {
    borderRadius: 10,
    backgroundColor: 'white',
    padding: 10,
    height: 40,
    margin: 12,
    width: '90%',
    borderWidth: 1,
  },
});