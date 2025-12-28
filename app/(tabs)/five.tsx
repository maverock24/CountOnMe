import { prefixKey, useData } from '@/components/data.provider';
import { WorkoutItem } from '@/components/data/types';
import { Text } from '@/components/Themed';
import { useTheme } from '@/components/ThemeProvider';
import TimerButton from '@/components/TimerButton';
import { generateExercisePlan } from '@/utils/generateExercisePlan';
import { FitnessLevel, IntensityLevel } from '@/utils/intensity.enum';
import { roundToDecimals } from '@/utils/numberUtils';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, FlatList, Keyboard, Platform, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import exercisesDe from '../../assets/exercises_de.json';
import exercisesEn from '../../assets/exercises_en.json';
import { PROFILE_FITNESS_LEVEL_KEY, PROFILE_WEIGHT_KEY } from '../_layout';
import commonStyles from '../styles';

const AnalyzerScreen: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { theme } = useTheme();
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
  const [blurTimeout, setBlurTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [workoutAdded, setWorkoutAdded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const { storeWorkout, syncAllGroup } = useData();

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

    // Cleanup timeout on unmount
    return () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
    };
  }, []);

  const handleAnalyze = async () => {
    // Prevent multiple concurrent analyses
    if (loading) return;
    
    setLoading(true);
    setError('');
    setAiResult(null);
    
    try {
      // Use local generateExercisePlan instead of API
      const weightKg = parseFloat(weight);
      const targetCalories = calories ? parseFloat(calories) : undefined;
      let intensityKey: 'low' | 'medium' | 'high' = 'low';
      if (intensity === IntensityLevel.Moderate) intensityKey = 'medium';
      else if (intensity === IntensityLevel.Hard) intensityKey = 'high';
      
      // Only call if valid
      if (!isNaN(weightKg) && exercise && fitnessLevel && intensity) {
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
            calories: typeof plan.estimatedCalories === 'number' ? roundToDecimals(plan.estimatedCalories, 1) : plan.estimatedCalories,
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
  const handleAddAiWorkout = async () => {
    if (!aiResult || isAddingWorkout) return;
    
    setIsAddingWorkout(true);
    setWorkoutAdded(false);
    
    try {
      // Use exercise as name, reps as unit (convert to seconds if needed)
      const name = aiResult.exercise || t('ai_workout');
      // Convert reps to seconds string (e.g. "2;3;2" => "120;180;120")
      const unitInSeconds = aiResult.reps
        .split(';')
        .map((time) => (isNaN(Number(time)) ? 0 : parseFloat(time) * 60))
        .join(';');
      
      // Create a proper WorkoutItem object with calories and level info
      const newWorkout: WorkoutItem = {
        name: name,
        workout: unitInSeconds,
        group: undefined,
        calories: typeof aiResult.calories === 'number' ? roundToDecimals(aiResult.calories, 1) : aiResult.calories,
        level: `${fitnessLevel}-${intensity}`
      };
      
      await storeWorkout(newWorkout);
      // Sync the "All" group to include the new workout
      await syncAllGroup();
      
      // Show success feedback
      setWorkoutAdded(true);
      
      // Reset form after successful addition (except weight and fitness level)
      setExercise('');
      setCalories('');
      setAiResult(null);
      setError('');
      setIntensity(IntensityLevel.Light);
      
      // Animate fade-in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto-hide success message after 2 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setWorkoutAdded(false);
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error adding workout:', error);
      // You could add error state here if needed
    } finally {
      setIsAddingWorkout(false);
    }
  };

  // Validation for showing analyze button
  const isAnalyzeDisabled = loading || !weight || !exercise || !fitnessLevel || !intensity;

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
                  if (blurTimeout) {
                    clearTimeout(blurTimeout);
                    setBlurTimeout(null);
                  }
                  setExercise(text);
                  setShowExerciseSuggestions(true);
                  setError('');
                }}
                placeholder={t('eg_running_push_ups')}
                placeholderTextColor="#999"
                onFocus={() => {
                  if (blurTimeout) {
                    clearTimeout(blurTimeout);
                    setBlurTimeout(null);
                  }
                  setShowExerciseSuggestions(true);
                }}
                onBlur={() => {
                  const timeout = setTimeout(() => {
                    setShowExerciseSuggestions(false);
                  }, 500);
                  setBlurTimeout(timeout);
                }}
              />
              {showExerciseSuggestions && filteredExerciseObjects.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 50,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(17, 24, 30, 0.95)',
                  borderRadius: 10,
                  maxHeight: 400,
                  minHeight: 200,
                  zIndex: 99999,
                  elevation: 100,
                  borderWidth: 1,
                  borderColor: '#2A2E33',
                  ...Platform.select({
                    web: {
                      boxShadow: '0px 4px 12px rgba(42, 199, 207, 0.2)',
                    },
                    default: {
                      shadowColor: 'rgb(42, 199, 207)',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    },
                  }),
                }}>
                  <FlatList
                    data={filteredExerciseObjects}
                    keyExtractor={(item) => item.name}
                    getItemLayout={(data, index) => ({
                      length: 44,
                      offset: 44 * index,
                      index,
                    })}
                    windowSize={8}
                    maxToRenderPerBatch={8}
                    removeClippedSubviews={true}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          if (blurTimeout) {
                            clearTimeout(blurTimeout);
                            setBlurTimeout(null);
                          }
                          setExercise(item.name);
                          setShowExerciseSuggestions(false);
                          setError(''); // Clear any previous errors
                        }}
                        onPressIn={() => {
                          // Cancel any pending blur timeout when pressing
                          if (blurTimeout) {
                            clearTimeout(blurTimeout);
                            setBlurTimeout(null);
                          }
                        }}
                        style={{ 
                          padding: 15, 
                          borderBottomColor: '#2A2E33', 
                          borderBottomWidth: 1,
                          backgroundColor: 'transparent'
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#EFF0F0', fontSize: 16, fontWeight: '500' }}>{item.name}</Text>
                        <Text style={{ color: 'rgb(176, 224, 230)', fontSize: 13, marginTop: 3, lineHeight: 18 }}>{item.description}</Text>
                      </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    indicatorStyle="white"
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
                      color={starCount <=
                        (fitnessLevel === FitnessLevel.Beginner
                          ? 1
                          : fitnessLevel === FitnessLevel.Intermediate
                          ? 2
                          : 3)
                          ? theme.colors.glow
                          : theme.colors.textMuted}
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
                      color={starCount <=
                        (intensity === IntensityLevel.Light
                          ? 1
                          : intensity === IntensityLevel.Moderate
                          ? 2
                          : 3)
                          ? theme.colors.glow
                          : theme.colors.textMuted}
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
          <View style={{ alignItems: 'flex-end', width: '100%', marginBottom: 8, marginRight: 20, zIndex: showExerciseSuggestions && filteredExerciseObjects.length > 0 ? -1 : 10 }}>
            <TimerButton
              text={loading ? t('analyzing') : t('analyze')}
              onPress={handleAnalyze}
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
                  text={isAddingWorkout ? t('adding') : workoutAdded ? t('added') : t('add_to_workouts')}
                  onPress={handleAddAiWorkout}
                  style={{ 
                    marginTop: 0, 
                    minWidth: 150, 
                    marginRight: -5,
                    backgroundColor: workoutAdded ? '#4CAF50' : (isAddingWorkout ? '#666' : undefined)
                  }}
                  disabled={isAddingWorkout}
                />
                {isAddingWorkout && (
                  <ActivityIndicator 
                    size="small" 
                    color="#00bcd4" 
                    style={{ position: 'absolute', right: 15, top: 15 }}
                  />
                )}
              </View>
            </View>
            <View>
            <Text style={styles.resultLabel}>{aiResult.exercise}</Text>
            <Text style={styles.resultValue}>{aiResult.explanation}</Text>
            </View>
          </View>
        )}
        {workoutAdded && (
          <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
            <FontAwesome name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.successText}>{t('workout_added_successfully')}</Text>
          </Animated.View>
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
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    width: '94%',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AnalyzerScreen;
