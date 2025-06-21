import { useData } from '@/components/data.provider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ModalPicker from '@/components/ModalPicker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import commonStyles from '../styles';

const SettingsScreen: React.FC = () => {
  const [language, setLanguage] = useState('en'); // default language English
  const { audioEnabled, setAudioEnabled } = useData();
  const { t } = useTranslation();

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>{t('settings')}</Text>
        <View style={styles.section}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>{t('general')}</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={styles.label}>{t('sound_on_off')}</Text>
              <Switch
                style={{ marginRight: 10, marginTop: 10 }}
                trackColor={{ false: 'white', true: 'rgb(74, 125, 118)' }}
                thumbColor={audioEnabled ? 'white' : 'grey'}
                onValueChange={setAudioEnabled}
                value={audioEnabled}
              />
            </View>
            <Text style={styles.sectionTitle}>{t('music')}</Text>
            <ModalPicker label={t('workout')} dataKey="workoutMusic" />
            <ModalPicker label={t('break')} dataKey="breakMusic" />
            <ModalPicker label={t('success')} dataKey="successSound" />
            <Text style={styles.sectionTitle}>{t('language')}</Text>
            <LanguageSwitcher />
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  section: {
    flex: 1,
    width: '95%',
    alignSelf: 'center',
    backgroundColor: 'rgb(17, 24, 30)',
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 10,
    height: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },
  scrollContent: {
    paddingBottom: 20,
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
