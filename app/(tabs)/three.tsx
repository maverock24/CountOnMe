import {StoredItem, useData} from '@/components/data.provider';
import {View} from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, {useState} from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {commonStyles} from '../styles';

type Inputs = {
  example: string;
  exampleRequired: string;
};

type Item = {
  key: string;
  value: string;
};

const dataList = [
  {key: 'Seil springen', value: '300,120,300,120,300'},
  {key: 'Yoga', value: '600,120,600,120,600'},
  {key: 'Laufen', value: '600,120,600,120,600'},
  {key: 'Krafttraining', value: '600,120,600,120,600'},
  {key: 'Schwimmen', value: '600,120,600,120,600'},
  {key: 'Radfahren', value: '600,120,600,120,600'},
  {key: 'Tanzen', value: '600,120,600,120,600'},
  {key: 'Klettern', value: '600,120,600,120,600'},
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
  };

  const addItem = () => {
    const addItem = () => {
      // use the values from TextInput: name for key and unit for value
      if (!name || !unit) return; // Optionally validate
      const newItem = {key: name, value: unit};
      //add the new item to the data array to the top
      const newData = [newItem, ...data];
      setData(newData);
      // Clear the inputs after adding
      setName('');
      setUnit('');
    };
    if (!name || !unit) return;
    // Use storeItem from DataProvider to store the new item
    storeItem(name, unit);
    setName('');
    setUnit('');
  };

  const deleteSet = (key: string) => {
    // Use deleteItem from DataProvider to delete the item
    deleteItem(key);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Sets</Text>
      <TextInput style={styles.input} value={unit} onChangeText={setUnit} />
      <TouchableOpacity style={commonStyles.button} onPress={() => addItem()}>
        <Text style={commonStyles.buttonText}>Add</Text>
      </TouchableOpacity>
      <SafeAreaProvider>
        <SafeAreaView style={styles.flatList}>
          <FlatList
            data={storedItems}
            renderItem={({item}) => (
              <View style={commonStyles.listItem}>
                <Text style={commonStyles.listItemTitle}>{item.key}</Text>
                <Text style={commonStyles.listItemValue}>{item.value}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSet(item.key)}
                >
                  <FontAwesome
                    styles={styles.icon}
                    name='trash'
                    size={18}
                    color='white'
                  />
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
  },
  flatList: {
    flex: 1,
    marginTop: 20,
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
    color: 'gray',
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
    marginBottom: -5,
    color: 'darkgray',
    textAlign: 'left',
    width: '90%',
  },
  icon: {
    fontSize: 100,
    color: '#fff',
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    padding: 10,
    height: 40,
    marginBottom: 12,
    width: '90%',
    color: '#ECEDEE',
  },
});
