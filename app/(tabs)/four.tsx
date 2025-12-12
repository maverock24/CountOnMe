import CustomPicker from '@/components/CustomPicker';
import { useData } from '@/components/data.provider';
import ModalPicker from '@/components/ModalPicker';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/components/ThemeProvider';
import TimerButton from '@/components/TimerButton';
import { language as languageData } from '@/constants/media';
import i18n from '@/i18n';
import { FitnessLevel } from '@/utils/intensity.enum';
import { clearSeededProgressions, seedProgressionGroupsToStorage } from '@/utils/progressionStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import commonStyles from '../styles';

const SettingsScreen: React.FC = () => {
  const { audioEnabled, setAudioEnabled, userWeight, setWeight, setFitness, fitnessLevel, storeItem, getStoredItem, reload } = useData();
  const { theme, themes, setTheme, font, fonts, setFont } = useTheme();
  const { t } = useTranslation();

  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);
  const [isResetting, setIsResetting] = React.useState(false);

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

  const handleResetApp = async () => {
    // Confirm reset
    const confirmReset = () => {
      if (Platform.OS === 'web') {
        return window.confirm(t('reset_confirm') || 'Are you sure you want to reset all progress? This will clear all workout data and re-seed progressions.');
      }
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          t('reset_app') || 'Reset App',
          t('reset_confirm') || 'Are you sure you want to reset all progress? This will clear all workout data and re-seed progressions.',
          [
            { text: t('cancel') || 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: t('reset') || 'Reset', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
    };

    const confirmed = await confirmReset();
    if (!confirmed) return;

    setIsResetting(true);
    try {
      // Clear completed exercises
      await AsyncStorage.removeItem('@countOnMe_completed');
      // Clear exercise counts
      await AsyncStorage.removeItem('@countOnMe_exercise_counts');
      // Clear all workout items
      const allKeys = await AsyncStorage.getAllKeys();
      const workoutKeys = allKeys.filter(key =>
        key.startsWith('@countOnMe_') &&
        !key.includes('language') &&
        !key.includes('theme') &&
        !key.includes('font') &&
        !key.includes('audio') &&
        !key.includes('weight') &&
        !key.includes('fitness')
      );
      if (workoutKeys.length > 0) {
        await AsyncStorage.multiRemove(workoutKeys);
      }
      // Clear seeded progressions and re-seed
      await clearSeededProgressions();
      await seedProgressionGroupsToStorage({ force: true });
      // Reload data
      await reload();

      if (Platform.OS === 'web') {
        window.alert(t('reset_success') || 'App has been reset successfully!');
      } else {
        Alert.alert(t('success') || 'Success', t('reset_success') || 'App has been reset successfully!');
      }
    } catch (error) {
      console.error('Error resetting app:', error);
      if (Platform.OS === 'web') {
        window.alert(t('reset_error') || 'Failed to reset app. Please try again.');
      } else {
        Alert.alert(t('error') || 'Error', t('reset_error') || 'Failed to reset app. Please try again.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.outerContainer]}>
        <ThemedText style={[commonStyles.tileTitle, { color: theme.colors.textPrimary }]}>{t('settings')}</ThemedText>
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.tileBackground,
              borderRadius: 10,
              borderColor: theme.colors.tileBorder,
              borderWidth: 1,
              ...Platform.select({
                web: {
                  boxShadow: `0px 0px 12px ${theme.colors.glow}33`,
                },
                default: {
                  shadowColor: theme.colors.glow,
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                },
              }),
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText weight="bold" style={[styles.sectionTitle, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}>{t('profile')}</ThemedText>
            <ThemedText style={[styles.label, { color: theme.colors.textMuted }]}>{t('weight')}</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.inputBorder, borderWidth: 1 }]}
              placeholder={t('enter_weight')}
              placeholderTextColor={theme.colors.textMuted}
              onChangeText={(text: string) => setWeight(text)}
              value={userWeight?.toString() ?? ''}
            />
            <ThemedText style={[styles.label, { color: theme.colors.textMuted }]}>{t('fitness_level')}</ThemedText>
            <CustomPicker
              selectedValue={fitnessLevel || FitnessLevel.Beginner}
              onValueChange={(itemValue: string) => setFitness(itemValue as FitnessLevel)}
              items={[
                { label: t('beginner'), value: FitnessLevel.Beginner },
                { label: t('intermediate'), value: FitnessLevel.Intermediate },
                { label: t('expert'), value: FitnessLevel.Expert },
              ]}
              dropdownIconColor={theme.colors.textPrimary}
            />
            <ThemedText weight="bold" style={[styles.sectionTitle, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}>{t('general')}</ThemedText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <ThemedText style={[styles.label, { color: theme.colors.textMuted }]}>{t('sound_on_off')}</ThemedText>
              <Switch
                style={{ marginRight: 10, marginTop: 10 }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={audioEnabled ? theme.colors.textPrimary : theme.colors.textMuted}
                onValueChange={setAudioEnabled}
                value={audioEnabled}
              />
            </View>
            <ThemedText weight="bold" style={[styles.sectionTitle, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}>{t('music')}</ThemedText>
            <ModalPicker label={t('workout')} dataKey="workoutMusic" />
            <ModalPicker label={t('break')} dataKey="breakMusic" />
            <ModalPicker label={t('success')} dataKey="successSound" />
            <ThemedText weight="bold" style={[styles.sectionTitle, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}>{t('language')}</ThemedText>
            <ThemedText style={[styles.label, { color: theme.colors.textMuted }]}>{t('selected_language')}</ThemedText>
            <CustomPicker
              selectedValue={currentLanguage}
              onValueChange={handleLanguageChange}
              items={languageData}
              dropdownIconColor={theme.colors.textPrimary}
            />

            <ThemedText weight="bold" style={[styles.sectionTitle, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}>{t('appearance') || 'Appearance'}</ThemedText>
            <ThemedText style={[styles.label, { color: theme.colors.textMuted }]}>{t('theme') || 'Theme'}</ThemedText>
            <CustomPicker
              selectedValue={theme.id}
              onValueChange={(themeId: string) => setTheme(themeId)}
              items={themes.map(th => ({ label: th.name, value: th.id }))}
              dropdownIconColor={theme.colors.textPrimary}
            />
            <View style={styles.themePreview}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary, borderColor: theme.colors.border }]} />
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.border }]} />
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.borderActive, borderColor: theme.colors.border }]} />
              <View style={[styles.colorSwatch, { backgroundColor: theme.colors.glow, borderColor: theme.colors.border }]} />
            </View>

            <ThemedText style={[styles.label, { color: theme.colors.textMuted }]}>{t('font') || 'Font'}</ThemedText>
            <CustomPicker
              selectedValue={font.id}
              onValueChange={(fontId: string) => setFont(fontId)}
              items={fonts.map(f => ({ label: f.displayName, value: f.id }))}
              dropdownIconColor={theme.colors.textPrimary}
            />
            <ThemedText style={[styles.fontPreviewText, { color: theme.colors.textMuted }]}>{font.description}</ThemedText>

            <ThemedText weight="bold" style={[styles.sectionTitle, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}>{t('data') || 'Data'}</ThemedText>
            <ThemedText style={[styles.label, { color: theme.colors.textMuted }]}>{t('reset_description') || 'Clear all workout progress and re-seed exercise progressions'}</ThemedText>
            <View style={styles.resetButtonContainer}>
              <TimerButton
                text={isResetting ? (t('resetting') || 'Resetting...') : (t('reset_app') || 'Reset App')}
                onPress={handleResetApp}
                disabled={isResetting}
                style={styles.resetButton}
              />
            </View>
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
  },
  fontPreviewText: {
    fontSize: 12,
    color: 'lightgray',
    marginTop: 5,
    fontStyle: 'italic',
  },
  resetButtonContainer: {
    marginTop: 15,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  resetButton: {
    backgroundColor: '#8B0000',
  },
});
