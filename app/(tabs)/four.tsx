import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import commonStyles from '../styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen: React.FC = () => {
  const [workoutMusic, setWorkoutMusic] = useState('defaultWorkout.mp3');
  const [breakMusic, setBreakMusic] = useState('defaultBreak.mp3');
  const [language, setLanguage] = useState('en'); // default language English

  useEffect(() => {
    // Load workout music setting from async storage
    const loadWorkoutMusic = async () => {
      try {
        const value = await AsyncStorage.getItem('workoutMusic');
        if (value !== null) {
          setWorkoutMusic(value);
        }
      } catch (e) {
        console.error('Error loading workout music setting:', e);
      }
    };
    loadWorkoutMusic();

    // Load break music setting from async storage
    const loadBreakMusic = async () => {
      try {
        const value = await AsyncStorage.getItem('breakMusic');
        if (value !== null) {
          setBreakMusic(value);
        }
      } catch (e) {
        console.error('Error loading break music setting:', e);
      }
    };
    loadBreakMusic();
  }
  , []);
  

 //save workout music setting to async storage
  const saveWorkoutMusic = async (value: string) => {
    try {
      // Save workout music setting to async storage
      await AsyncStorage.setItem('workoutMusic', value);
    } catch (e) {
      console.error('Error saving workout music setting:', e);
    }
  };

  //save break music setting to async storage
  const saveBreakMusic = async (value: string) => {
    try {
      // Save break music setting to async storage
      await AsyncStorage.setItem('breakMusic', value);
    } catch (e) {
      console.error('Error saving break music setting:', e);
    }
  };

  return (
    <View style={commonStyles.container}>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Music Settings</Text>
        <Text style={styles.label}>Workout Music</Text>
      
        <Picker
            selectedValue={workoutMusic}
            style={styles.picker}
            onValueChange={(itemValue) => saveWorkoutMusic(itemValue)}
            mode="dialog"
            dropdownIconColor="grey"
            itemStyle={{fontSize: 10}}
          >
            <Picker.Item label="Upbeat" value="upbeat" />
            <Picker.Item label="Bollywood" value="bollywood" />
            <Picker.Item label="Happy Rock" value="happy_rock" />
            <Picker.Item label="Chill" value="chill" />
            <Picker.Item label="Wandering" value="wandering" />
            <Picker.Item label="Starlit Serenity" value="starlit_serenity" />
            <Picker.Item label="Peaceful Indian" value="peaceful_music_indian" />
            <Picker.Item label="Mystical" value="mystical" />
            {/* Add more languages as needed */}
          </Picker>
         
        <Text style={styles.label}>Break Music</Text>
        <Picker
            selectedValue={breakMusic}
            style={styles.picker}
            onValueChange={(itemValue) => saveBreakMusic(itemValue)}
            mode="dialog"
            dropdownIconColor="grey"
          >
            <Picker.Item label="Chill" value="chill" />
            <Picker.Item label="Wandering" value="wandering" />
            <Picker.Item label="Starlit Serenity" value="starlit_serenity" />
            <Picker.Item label="Peaceful Indian" value="peaceful_music_indian" />
            <Picker.Item label="Mystical" value="mystical" />
            {/* Add more languages as needed */}
          </Picker>
          <Text style={styles.sectionTitle}>Language Settings</Text>
          <Text style={styles.label}>Selected language</Text>
          <View style={styles.pickerContainer}>
          
          <Picker
            selectedValue={language}
            style={[styles.picker]}
            onValueChange={(itemValue) => setLanguage(itemValue)}
            mode="dialog"
            dropdownIconColor="grey"
          >
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Español" value="es" />
            <Picker.Item label="Français" value="fr" />
            <Picker.Item label="Deutsch" value="de" />
            {/* Add more languages as needed */}
          </Picker>
        </View>
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