import CustomPicker from '@/components/CustomPicker';
import { useData } from '@/components/data.provider';
import ModalPicker from '@/components/ModalPicker';
import Colors from '@/constants/Colors';
import { language as languageData } from '@/constants/media';
import i18n from '@/i18n';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import commonStyles from '../styles';
import { FitnessLevel } from '../utils/intensity.enum';

const SettingsScreen: React.FC = () => {
  const { audioEnabled, setAudioEnabled, userWeight, setWeight, setFitness, fitnessLevel, storeItem, getStoredItem } = useData();
  const { t } = useTranslation();
  
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);

  React.useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await getStoredItem('language');
        if (storedLanguage) {
          setCurrentLanguage(storedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await storeItem('language', languageCode);
      setCurrentLanguage(languageCode);
      i18n.changeLanguage(languageCode);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };
  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.outerContainer]}>
        <Text style={commonStyles.tileTitle}>{t('settings')}</Text>
        <View
          style={[
            styles.section,
            {
              backgroundColor: 'rgba(17, 24, 30, 0.8)',
              borderRadius: 10,
              borderColor: '#2A2E33',
              borderWidth: 1,
              shadowColor: Colors.glow,
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>{t('profile')}</Text>
            <Text style={styles.label}>{t('weight')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enter_weight')}
              placeholderTextColor="lightgray"
              onChangeText={(text: string) => setWeight(text)}
              value={userWeight?.toString()}
            />
            <Text style={styles.label}>{t('fitness_level')}</Text>
            <CustomPicker
              selectedValue={fitnessLevel || FitnessLevel.Beginner}
              onValueChange={(itemValue: string) => setFitness(itemValue as FitnessLevel)}
              items={[
                { label: t('beginner'), value: FitnessLevel.Beginner },
                { label: t('intermediate'), value: FitnessLevel.Intermediate },
                { label: t('expert'), value: FitnessLevel.Expert },
              ]}
              dropdownIconColor="#fff"
            />
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
            <Text style={styles.label}>{t('selected_language')}</Text>
            <CustomPicker
              selectedValue={currentLanguage}
              onValueChange={handleLanguageChange}
              items={languageData}
              dropdownIconColor="#fff"
            />
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
    fontSize: 16,
    backgroundColor: 'rgba(31, 39, 44, 0.8)',
    borderRadius: 5,
    marginBottom: 10,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 8,
    color: '#fff',
    paddingVertical: 8,
  },
  saveButton: {
    marginTop: 20,
    width: '90%',
    alignSelf: 'center',
  },
});
