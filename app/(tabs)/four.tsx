import CustomPicker from '@/components/CustomPicker';
import { useData } from '@/components/data.provider';
import ModalPicker from '@/components/ModalPicker';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/components/ThemeProvider';
import Colors from '@/constants/Colors';
import { language as languageData } from '@/constants/media';
import i18n from '@/i18n';
import { FitnessLevel } from '@/utils/intensity.enum';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import commonStyles from '../styles';

const SettingsScreen: React.FC = () => {
  const { audioEnabled, setAudioEnabled, userWeight, setWeight, setFitness, fitnessLevel, storeItem, getStoredItem } = useData();
  const { theme, themes, setTheme, font, fonts, setFont } = useTheme();
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
        <ThemedText style={commonStyles.tileTitle}>{t('settings')}</ThemedText>
        <View
          style={[
            styles.section,
            {
              backgroundColor: 'rgba(17, 24, 30, 0.8)',
              borderRadius: 10,
              borderColor: '#2A2E33',
              borderWidth: 1,
              ...Platform.select({
                web: {
                  boxShadow: `0px 0px 12px ${Colors.glow}33`,
                },
                default: {
                  shadowColor: Colors.glow,
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                },
              }),
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText weight="bold" style={styles.sectionTitle}>{t('profile')}</ThemedText>
            <ThemedText style={styles.label}>{t('weight')}</ThemedText>
            <TextInput
              style={styles.input}
              placeholder={t('enter_weight')}
              placeholderTextColor="lightgray"
              onChangeText={(text: string) => setWeight(text)}
              value={userWeight?.toString() ?? ''}
            />
            <ThemedText style={styles.label}>{t('fitness_level')}</ThemedText>
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
            <ThemedText weight="bold" style={styles.sectionTitle}>{t('general')}</ThemedText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <ThemedText style={styles.label}>{t('sound_on_off')}</ThemedText>
              <Switch
                style={{ marginRight: 10, marginTop: 10 }}
                trackColor={{ false: 'gray', true: 'white' }}
                thumbColor={audioEnabled ? 'gray' : 'white'}
                onValueChange={setAudioEnabled}
                value={audioEnabled}
              />
            </View>
            <ThemedText weight="bold" style={styles.sectionTitle}>{t('music')}</ThemedText>
            <ModalPicker label={t('workout')} dataKey="workoutMusic" />
            <ModalPicker label={t('break')} dataKey="breakMusic" />
            <ModalPicker label={t('success')} dataKey="successSound" />
            <ThemedText weight="bold" style={styles.sectionTitle}>{t('language')}</ThemedText>
            <ThemedText style={styles.label}>{t('selected_language')}</ThemedText>
            <CustomPicker
              selectedValue={currentLanguage}
              onValueChange={handleLanguageChange}
              items={languageData}
              dropdownIconColor="#fff"
            />

            <ThemedText weight="bold" style={styles.sectionTitle}>{t('appearance') || 'Appearance'}</ThemedText>
            <ThemedText style={styles.label}>{t('theme') || 'Theme'}</ThemedText>
            <CustomPicker
              selectedValue={theme.id}
              onValueChange={(themeId: string) => setTheme(themeId)}
              items={themes.map(t => ({ label: t.name, value: t.id }))}
              dropdownIconColor="#fff"
            />
            <View style={styles.themePreview}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.secondary }]} />
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.borderActive }]} />
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.glow }]} />
            </View>

            <ThemedText style={styles.label}>{t('font') || 'Font'}</ThemedText>
            <CustomPicker
              selectedValue={font.id}
              onValueChange={(fontId: string) => setFont(fontId)}
              items={fonts.map(f => ({ label: f.displayName, value: f.id }))}
              dropdownIconColor="#fff"
            />
            <ThemedText style={styles.fontPreviewText}>{font.description}</ThemedText>
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
    backgroundColor: 'rgba(41, 57, 68, 1)',
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
  themePreview: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 5,
    gap: 8,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fontPreviewText: {
    fontSize: 12,
    color: 'lightgray',
    marginTop: 5,
    fontStyle: 'italic',
  },
});
