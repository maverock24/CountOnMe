import {StoredItem, useData} from '@/components/data.provider';
import {View} from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, {useState} from 'react';
import {
  FlatList,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

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
  const {storedItems, storeItem, deleteItem} = useData();

  const [data, setData] = useState<StoredItem[]>(storedItems);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const noWorkout = storedItems.length === 0 || (storedItems[0].key === 'audioThreshold' && storedItems.length === 1); 

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
      <Text style={styles.label}>Workout time set (e.g. exercise;break;exercise "60;60;60")</Text>
      <TextInput style={styles.input} value={unit} onChangeText={handleUnitChange} />
      <TouchableOpacity style={[commonStyles.button,{width: '90%'}]} onPress={() => addItem()}>
        <Text style={commonStyles.buttonText}>Add</Text>
      </TouchableOpacity>
      </View>
      </View>
      <Text style={commonStyles.tileTitle}>Available Workouts</Text>
      {noWorkout && (
              <View style={commonStyles.tile}>
              <Text style={[commonStyles.buttonText,{padding: 10}]}>No workouts available</Text>
              </View>
            )}
      <SafeAreaProvider>
        <SafeAreaView style={styles.flatList}>
          <FlatList
            data={storedItems}
            renderItem={({item}) => (
              <View style={commonStyles.buttonTile}>
                <Text style={commonStyles.listItemTitle}>{item.key}</Text>
                <Text style={commonStyles.listItemValue}>{item.value}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSet(item.key)}
                >
                  <FontAwesome
                    styles={styles.icon}
                    name='trash'
                    size={18}slider
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
  innerWrapperTopTile :{
    paddingTop:10,
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  deleteButton: {
    color: 'black',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: -20,
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
    backgroundColor: 'rgb(33, 39, 50)',
    padding: 10,
    height: 40,
    marginBottom: 12,
    width: '90%',
    color: '#ECEDEE',
  },
});
