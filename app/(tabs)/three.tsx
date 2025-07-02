import { useData } from '@/components/data.provider';
import { View } from '@/components/Themed';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ListTile from '@/components/ListTile';
import TimerButton from '@/components/TimerButton';
import commonStyles from '../styles';

export default function TabThreeScreen() {
  const { workoutItems, storeItem, deleteItem } = useData();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');

  const [nameError, setNameError] = useState<string | null>(null);
  const [unitError, setUnitError] = useState<string | null>(null);

  const noWorkout = workoutItems.length === 0;

  const { t } = useTranslation();

  const validateName = (name: string) => {
    if (name === '') {
      setNameError(t('name_cannot_be_empty'));
      return false;
    }
    const isNameValid = workoutItems.every((item) => item.key !== name);
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

    storeItem(name, unitInSeconds);
    setName('');
    setUnit('');
    //unfocus the input
    Keyboard.dismiss();
  };

  const deleteItemHandler = (key: string) => {
    if (key) {
      deleteItem(key);
      setSelectedItem(null);
      setNameError(null);
      setUnitError(null);
    }
  };

  const handleUnitChange = (text: string) => {
    setUnit(text);
  };

  const toggleSelectSet = (key: string) => {
    if (selectedItem === key) {
      setSelectedItem(null);
    } else {
      setSelectedItem(key);
    }
  };
  const handleOnFocus = () => {
    setNameError(null);
    setUnitError(null);
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>{t('new_workout')}</Text>
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
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                width: '100%',
                paddingRight: 15,
              }}
            >
              <TimerButton
                disabled={selectedItem ? false : true}
                text={t('delete')}
                onPress={() => deleteItemHandler(selectedItem!)}
              />
              <TimerButton
                disabled={unit !== '' && name !== '' ? false : true}
                text={t('add')}
                onPress={addItem}
                style={{ width: 107 }}
              />
            </View>
          </View>
        </View>
        <View style={commonStyles.outerContainer}>
          <Text style={commonStyles.tileTitle}>{t('available_workouts')}</Text>
          <View style={[commonStyles.tile, { flex: 1, padding: 5 }]}>
            {noWorkout && (
              <Text style={{ padding: 10, fontSize: 24, marginTop: '50%', color: '#fff' }}>
                {t('no_workouts_available')}
              </Text>
            )}
            <SafeAreaProvider style={{ width: '100%' }}>
              <SafeAreaView style={styles.flatList}>
                <FlatList
                  data={workoutItems}
                  renderItem={({ item }) => (
                    <ListTile
                      isSelected={selectedItem === item.key?.toString()}
                      title={item.key}
                      value={item.value}
                      onPressTile={() => toggleSelectSet(item.key?.toString() || '')}
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
