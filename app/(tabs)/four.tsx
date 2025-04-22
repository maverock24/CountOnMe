import { useData } from '@/components/data.provider';
import ModalPicker from '@/components/ModalPicker';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import commonStyles from '../styles';

const SettingsScreen: React.FC = () => {
  const [language, setLanguage] = useState('en'); // default language English

  const { audioEnabled, setAudioEnabled } = useData();

  return (
    <View style={commonStyles.container}>
      <ScrollView>
        <View style={commonStyles.outerContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                justifyContent: 'space-between',
              }}
            >
              <Text style={styles.label}>Sound on/off</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={false ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setAudioEnabled}
                value={audioEnabled}
              />
            </View>
            <Text style={styles.sectionTitle}>Music</Text>
            <ModalPicker label="Workout" dataKey="workoutMusic" />
            <ModalPicker label="Break" dataKey="breakMusic" />
            <ModalPicker label="Success" dataKey="successSound" />
            <Text style={styles.sectionTitle}>Language</Text>
            <ModalPicker label="Selected Language" dataKey="language" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  section: {
    width: '100%',
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
