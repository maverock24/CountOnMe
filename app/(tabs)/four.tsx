import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import commonStyles from '../styles';
import ModalPicker from '@/components/ModalPicker';

const SettingsScreen: React.FC = () => {
  const [language, setLanguage] = useState('en'); // default language English

  return (
    <View style={commonStyles.container}>
      <View style={[styles.section, { height: '100%' }]}>
        <Text style={styles.sectionTitle}>Music</Text>

        <ModalPicker label="Workout" dataKey="workoutMusic" />
        <ModalPicker label="Break" dataKey="breakMusic" />
        <ModalPicker label="Success" dataKey="successSound" />

        <Text style={styles.sectionTitle}>Language</Text>
        <ModalPicker label="Selected Language" dataKey="language" />
      </View>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  section: {
    width: '95%',
    alignSelf: 'center',
    backgroundColor: 'rgb(28, 35, 46)',
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  label: {
    marginTop: 15,
    fontSize: 14,
    color: 'lightgray',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'rgb(45, 55, 73)',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: 'rgb(45, 55, 73)',
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    backgroundColor: 'rgb(45, 55, 73)',
    color: '#fff',
  },
  saveButton: {
    marginTop: 20,
    width: '90%',
    alignSelf: 'center',
  },
});
