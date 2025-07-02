import { useData } from '@/components/data.provider';
import TimerButton from '@/components/TimerButton';
import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import commonStyles from '../styles';

const AnalyzerScreen: React.FC = () => {
  const { t } = useTranslation();
  const trainingGoals = [
    { label: t('strength'), value: 'strength' },
    { label: t('speed'), value: 'speed' },
    { label: t('endurance'), value: 'endurance' },
  ];
  const [weight, setWeight] = useState('');
  const [exercise, setExercise] = useState('');
  const [calories, setCalories] = useState('');
  const [aiResult, setAiResult] = useState<{
    reps: string;
    calories: number;
    explanation: string;
    exercise?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trainingLevel, setTrainingLevel] = useState('beginner');

  const { storeItem } = useData();

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      const body = calories ? { calories } : { weight, exercise, trainingLevel };
      const response = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('failed_to_analyze'));
      setAiResult(data);
      // If user only entered calories, update fields with AI suggestion
      if (calories && data.weight) setWeight(data.weight.toString());
      if (calories && data.exercise) setExercise(data.exercise);
      if (calories && data.trainingLevel) setTrainingLevel(data.trainingLevel);
    } catch (e: any) {
      setError(e.message || t('failed_to_analyze'));
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  // Add AI workout to list
  const handleAddAiWorkout = () => {
    if (!aiResult) return;
    // Use exercise as name, reps as unit (convert to seconds if needed)
    const name = aiResult.exercise || t('ai_workout');
    // Convert reps to seconds string (e.g. "2;3;2" => "120;180;120")
    const unitInSeconds = aiResult.reps
      .split(';')
      .map((time) => (isNaN(Number(time)) ? 0 : parseFloat(time) * 60))
      .join(';');
    storeItem(name, unitInSeconds);
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>{t('ai_workout_analyzer')}</Text>
        <View style={[commonStyles.tile, { justifyContent: 'flex-start' }]}>
          <View style={styles.innerWrapperTopTile}>
            <Text style={styles.label}>{t('weight_kg')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
              placeholder={t('enter_your_weight_placeholder')}
              placeholderTextColor="#999"
              onFocus={() => setError('')}
            />
            {/* No error for weight, but keep spacing consistent */}

            <Text style={styles.label}>{t('exercise')}</Text>
            <TextInput
              style={styles.input}
              value={exercise}
              onChangeText={setExercise}
              placeholder={t('eg_running_push_ups')}
              placeholderTextColor="#999"
              onFocus={() => setError('')}
            />
            {/* No error for exercise, but keep spacing consistent */}

            <Text style={styles.label}>{t('training_level')}</Text>
            <View style={styles.goalRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {[1, 2, 3].map((starCount) => (
                  <Pressable
                    key={starCount}
                    onPress={() => {
                      if (starCount === 1) setTrainingLevel('beginner');
                      else if (starCount === 2) setTrainingLevel('intermediate');
                      else setTrainingLevel('expert');
                    }}
                    style={styles.starButton}
                  >
                    <FontAwesome
                      name={
                        starCount <=
                        (trainingLevel === 'beginner'
                          ? 1
                          : trainingLevel === 'intermediate'
                          ? 2
                          : 3)
                          ? 'star'
                          : 'star-o'
                      }
                      size={30}
                      color="white"
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.trainingLevelLabel}>
                {trainingLevel === 'beginner'
                  ? t('beginner')
                  : trainingLevel === 'intermediate'
                  ? t('intermediate')
                  : t('expert')}
              </Text>
            </View>

            <Text style={styles.label}>{t('calories_optional')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
              placeholder={t('enter_calories_to_burn_optional')}
              placeholderTextColor="#999"
              onFocus={() => setError('')}
            />
          </View>
          <View style={{ alignItems: 'flex-end', width: '100%', marginBottom: 8, marginRight: 20 }}>
            <TimerButton
              text={loading ? t('analyzing') : t('analyze')}
              onPress={handleAnalyze}
              style={styles.analyzeButton}
            />
          </View>
        </View>
        <View style={styles.errorAndLoading}>
          {error ? <Text style={{ color: 'red', width: '90%' }}>{error}</Text> : null}
          {loading && <ActivityIndicator size={80} style={{ marginTop: 10 }} color="#00bcd4" />}
        </View>
        {aiResult && (
          <View style={styles.resultBox}>
            <TimerButton
              text={t('add_to_workouts')}
              onPress={handleAddAiWorkout}
              style={styles.addAiButton}
            />
            <Text style={styles.resultLabel}>{t('repetitions_breaks')}</Text>
            <Text style={styles.resultValue}>{aiResult.reps} min</Text>
            <Text style={styles.resultLabel}>{t('expected_calories_burned')}</Text>
            <Text style={styles.resultValue}>{aiResult.calories} cal</Text>
            <Text style={styles.resultLabel}>{t('explanation')}</Text>
            <Text style={styles.resultExplanation}>{aiResult.explanation}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  innerWrapperTopTile: {
    paddingTop: 10,
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
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
  errorAndLoading: {
    position: 'absolute',
    top: '55%',
    zIndex: -1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '40%',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 0,
    color: 'rgb(231, 234, 241)',
    textAlign: 'left',
    width: '90%',
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
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
    marginTop: 10,
    width: '90%',
    alignItems: 'center',
  },
  starButton: {
    paddingHorizontal: 5,
  },
  trainingLevelLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  goalButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgb(38, 47, 62)',
    alignItems: 'center',
  },
  goalButtonSelected: {
    backgroundColor: '#00bcd4',
  },
  goalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  goalButtonTextSelected: {
    color: '#222',
    fontWeight: 'bold',
  },
  analyzeButton: {
    backgroundColor: '#00bcd4',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    minWidth: 120,
    zIndex: 10,
    // Removed position: 'absolute', bottom, right
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultBox: {
    backgroundColor: 'rgba(0,188,212,0.13)',
    width: '94%',
    borderRadius: 16,
    marginTop: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#00bcd4',
    boxShadow: '0px 4px 12px rgba(0, 188, 212, 0.18)',
    elevation: 8,
    alignItems: 'flex-start',
  } as any, // Temporarily cast to avoid web-specific style warnings
  resultLabel: {
    color: '#00bcd4',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resultValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    marginLeft: 2,
  },
  resultExplanation: {
    color: '#e0f7fa',
    fontSize: 16,
    marginTop: 6,
    lineHeight: 22,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  addAiButton: {
    position: 'absolute',
    left: 260,
  },
  addAiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default AnalyzerScreen;
