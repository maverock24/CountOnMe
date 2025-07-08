import { prefixKey, useData } from '@/components/data.provider';
import TimerButton from '@/components/TimerButton';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import exercisesDe from '../../assets/exercises_de.json';
import exercisesEn from '../../assets/exercises_en.json';
import { PROFILE_FITNESS_LEVEL_KEY, PROFILE_WEIGHT_KEY } from '../_layout';
import commonStyles from '../styles';
import { generateExercisePlan } from '../utils/generateExercisePlan';
import { FitnessLevel, IntensityLevel } from '../utils/intensity.enum';

const AnalyzerScreen: React.FC = () => {
  const { i18n, t } = useTranslation();
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
    intensity?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [intensity, setIntensity] = useState<IntensityLevel>(IntensityLevel.Light);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(FitnessLevel.Beginner);
  const [showExerciseSuggestions, setShowExerciseSuggestions] = useState(false);

  const { storeItem } = useData();

  // Choose exercise list based on language
  const exerciseList = i18n.language === 'de' ? exercisesDe : exercisesEn;
  // Memoized list of exercise names
  const exerciseNames = useMemo(() => exerciseList.map((ex: any) => ex.name), [exerciseList]);

  // Filtered suggestions based on input
  const filteredExerciseObjects = useMemo(
    () =>
      exercise.length > 0
        ? exerciseList.filter((ex: any) =>
            ex.name.toLowerCase().includes(exercise.toLowerCase()) ||
            (ex.description && ex.description.toLowerCase().includes(exercise.toLowerCase()))
          )
        : [],
    [exercise, exerciseList]
  );

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedWeight = await AsyncStorage.getItem(`${prefixKey}${PROFILE_WEIGHT_KEY}`);
        const storedFitness = await AsyncStorage.getItem(`${prefixKey}${PROFILE_FITNESS_LEVEL_KEY}`);
        if (storedWeight) setWeight(storedWeight);
        if (storedFitness) setFitnessLevel(storedFitness as FitnessLevel);
      } catch (e) {
        // Optionally handle error
      }
    };
    loadProfile();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      // const body = calories ? { calories } : { weight, exercise, intensity };
      // const response = await fetch('/.netlify/functions/analyze', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(body),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.error || t('failed_to_analyze'));
      // setAiResult(data);
      // // If user only entered calories, update fields with AI suggestion
      // if (calories && data.weight) setWeight(data.weight.toString());
      // if (calories && data.exercise) setExercise(data.exercise);
      // if (calories && data.intensity) setIntensity(data.intensity as IntensityLevel);

      // Use local generateExercisePlan instead of API
      const weightKg = parseFloat(weight);
      const targetCalories = calories ? parseFloat(calories) : undefined;
      let intensityKey: 'low' | 'medium' | 'high' = 'low';
      if (intensity === IntensityLevel.Moderate) intensityKey = 'medium';
      else if (intensity === IntensityLevel.Hard) intensityKey = 'high';
      // Only call if valid
      if (!isNaN(weightKg) && exercise) {
        // Map exerciseList to correct ExerciseData type
        const mappedExerciseList = exerciseList.map((ex: any) => ({
          ...ex,
          type: ex.type as 'legs' | 'upper_body_push' | 'upper_body_back' | 'core' | 'full_body_plyo' | 'flexibility_mobility',
        }));
        const plan = generateExercisePlan({
          weightKg,
          exerciseName: exercise,
          fitnessLevel: fitnessLevel as FitnessLevel,
          intensity: intensityKey,
          targetCalories,
        }, mappedExerciseList);
        if (plan) {
          setAiResult({
            reps: plan.reps,
            calories: plan.estimatedCalories,
            explanation: plan.notes,
            exercise: plan.exercise,
          });
        } else {
          setError(t('failed_to_analyze'));
        }
      } else {
        setError(t('failed_to_analyze'));
      }
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
    let unitInMinutes = aiResult.reps
      .split(';')
      .map((time) => (isNaN(Number(time)) ? 0 : parseFloat(time) * 60))
      .join(';');
    // Use aiResult.intensity if present, otherwise fallback to current intensity state
    const intensityString = aiResult.intensity ||
      (intensity === IntensityLevel.Light ? 'low' : intensity === IntensityLevel.Moderate ? 'medium' : 'high');
    unitInMinutes = unitInMinutes + '|' + intensityString + '|' + aiResult.calories; // Append calories for reference
    storeItem(name, unitInMinutes);
  };

  // Validation for enabling Analyze button
  const isAnalyzeDisabled =
    !weight ||
    !exercise ||
    !fitnessLevel ||
    !intensity;

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
            <View style={{ width: '100%', alignItems: 'center', position: 'relative', zIndex: 100 }}>
              <TextInput
                style={styles.input}
                value={exercise}
                onChangeText={(text) => {
                  setExercise(text);
                  setShowExerciseSuggestions(true);
                  setError('');
                }}
                placeholder={t('eg_running_push_ups')}
                placeholderTextColor="#999"
                onFocus={() => setShowExerciseSuggestions(true)}
                onBlur={() => setTimeout(() => setShowExerciseSuggestions(false), 150)}
              />
              {showExerciseSuggestions && filteredExerciseObjects.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 50,
                  left: '5%',
                  width: '90%',
                  backgroundColor: 'rgb(17, 24, 30)',
                  borderRadius: 8,
                  maxHeight: 180,
                  zIndex: 99999,
                  elevation: 100,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}>
                  <FlatList
                    data={filteredExerciseObjects}
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setExercise(item.name);
                          setShowExerciseSuggestions(false);
                        }}
                        style={{ padding: 10, borderBottomColor: '#444', borderBottomWidth: 1 }}
                      >
                        <Text style={{ color: '#fff', fontSize: 16 }}>{item.name}</Text>
                        <Text style={{ color: '#bbb', fontSize: 12, marginTop: 2 }}>{item.description}</Text>
                      </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="handled"
                  />
                </View>
              )}
            </View>
            {/* No error for exercise, but keep spacing consistent */}

            <Text style={styles.label}>{t('fitness_level')}</Text>
            <View style={styles.goalRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {[1, 2, 3].map((starCount) => (
                  <Pressable
                    key={starCount}
                    onPress={() => {
                      if (starCount === 1) setFitnessLevel(FitnessLevel.Beginner);
                      else if (starCount === 2) setFitnessLevel(FitnessLevel.Intermediate);
                      else setFitnessLevel(FitnessLevel.Expert);
                    }}
                    style={styles.starButton}
                  >
                    <FontAwesome
                      name={
                        starCount <=
                        (fitnessLevel === FitnessLevel.Beginner
                          ? 1
                          : fitnessLevel === FitnessLevel.Intermediate
                          ? 2
                          : 3)
                          ? 'star'
                          : 'star-o'
                      }
                      size={30}
                      color="#00bcd4"
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.trainingLevelLabel}>
                {fitnessLevel === FitnessLevel.Beginner
                  ? t('beginner')
                  : fitnessLevel === FitnessLevel.Intermediate
                  ? t('intermediate')
                  : t('expert')}
              </Text>
            </View>

            <Text style={styles.label}>{t('intensity')}</Text>
            <View style={styles.goalRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {[1, 2, 3].map((starCount) => (
                  <Pressable
                    key={starCount}
                    onPress={() => {
                      if (starCount === 1) setIntensity(IntensityLevel.Light);
                      else if (starCount === 2) setIntensity(IntensityLevel.Moderate);
                      else setIntensity(IntensityLevel.Hard);
                    }}
                    style={styles.starButton}
                  >
                    <FontAwesome
                      name={
                        starCount <=
                        (intensity === IntensityLevel.Light
                          ? 1
                          : intensity === IntensityLevel.Moderate
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
                {intensity === IntensityLevel.Light
                  ? t('low')
                  : intensity === IntensityLevel.Moderate
                  ? t('medium')
                  : t('high')}
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
          <View style={{ alignItems: 'flex-end', width: '100%', marginBottom: 8, marginRight: 20, zIndex: showExerciseSuggestions && filteredExerciseObjects.length > 0 ? 0 : 10 }}>
            <TimerButton
              text={loading ? t('analyzing') : t('analyze')}
              onPress={handleAnalyze}
              style={styles.analyzeButton}
              disabled={isAnalyzeDisabled}
            />
          </View>
        </View>
        <View style={styles.errorAndLoading}>
          {error ? <Text style={{ color: 'red', width: '90%' }}>{error}</Text> : null}
          {loading && <ActivityIndicator size={80} style={{ marginTop: 10 }} color="#00bcd4" />}
        </View>
        {aiResult && (
          <View style={styles.resultBox}>
            <View style={{ flexDirection: 'row', width: '100%'}}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultLabel}>{t('repetitions_breaks')}</Text>
                <Text style={styles.resultValue}>{aiResult.reps} min</Text>
                <Text style={styles.resultLabel}>{t('expected_calories_burned')}</Text>
                <Text style={styles.resultValue}>{aiResult.calories} cal</Text>
                {/* <Text style={styles.resultLabel}>{t('explanation')}</Text>
                <Text style={styles.resultExplanation}>{aiResult.explanation}</Text> */}
              </View>
              <View style={{ alignItems: 'flex-end', flex: 0 }}>
                <TimerButton
                  text={t('add_to_workouts')}
                  onPress={handleAddAiWorkout}
                  style={{ marginTop: 0, minWidth: 150, marginRight: -5 }}
                />
              </View>
            </View>
            <View>
            <Text style={styles.resultLabel}>{aiResult.exercise}</Text>
            <Text style={styles.resultValue}>{aiResult.explanation}</Text>
            </View>
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
    zIndex: 0,
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
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 2,
    letterSpacing: 0.5,
  
  },
  resultValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    marginLeft: 2,
  },
  resultExplanation: {
    color: '#e0f7fa',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 22,
    width: 220,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // addAiButton: {
  //   position: 'absolute',
  //   left: 300,
  // },
  addAiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default AnalyzerScreen;
