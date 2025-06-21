import { useData } from '@/components/data.provider';
import TimerButton from '@/components/TimerButton';
import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import commonStyles from '../styles';

const trainingGoals = [
  { label: 'Strength', value: 'strength' },
  { label: 'Speed', value: 'speed' },
  { label: 'Endurance', value: 'endurance' },
];

const AnalyzerScreen: React.FC = () => {
  const { storeItem } = useData();
  const [weight, setWeight] = useState('');
  const [exercise, setExercise] = useState('');
  const [calories, setCalories] = useState('');
  const [aiResult, setAiResult] = useState<{ reps: string; calories: number; explanation: string; exercise?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trainingLevel, setTrainingLevel] = useState('beginner');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      const body = calories
        ? { calories }
        : { weight, exercise, trainingLevel };
      const response = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI error');
      setAiResult(data);
      // If user only entered calories, update fields with AI suggestion
      if (calories && data.weight) setWeight(data.weight.toString());
      if (calories && data.exercise) setExercise(data.exercise);
      if (calories && data.trainingLevel) setTrainingLevel(data.trainingLevel);
    } catch (e: any) {
      setError(e.message || 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  // Add AI workout to list
  const handleAddAiWorkout = () => {
    if (!aiResult) return;
    // Use exercise as name, reps as unit (convert to seconds if needed)
    const name = aiResult.exercise || 'AI Workout';
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
        <Text style={commonStyles.tileTitle}>AI Workout Analyzer</Text>
        <View style={[commonStyles.tile, { justifyContent: 'flex-start' }]}> 
          <View style={styles.innerWrapperTopTile}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
              placeholder="Enter your weight"
              placeholderTextColor="#999"
              onFocus={() => setError('')}
            />
            {/* No error for weight, but keep spacing consistent */}

            <Text style={styles.label}>Exercise</Text>
            <TextInput
              style={styles.input}
              value={exercise}
              onChangeText={setExercise}
              placeholder="e.g. Running, Push-ups"
              placeholderTextColor="#999"
              onFocus={() => setError('')}
            />
            {/* No error for exercise, but keep spacing consistent */}

            <Text style={styles.label}>Training Level</Text>
            <View style={styles.goalRow}>
              {['beginner','intermediate','expert'].map((g) => (
                <TimerButton small key={g} text={g.charAt(0).toUpperCase()+g.slice(1)} onPress={() => setTrainingLevel(g)} isSelected={trainingLevel===g} style={styles.goalButton} />
              ))}
            </View>

            <Text style={styles.label}>Calories (optional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
              placeholder="Enter calories to burn (optional)"
              placeholderTextColor="#999"
              onFocus={() => setError('')}
            />
           
          </View>
          <View style={{ alignItems: 'flex-end', width: '100%', marginBottom: 8, marginRight: 20 }}>
            <TimerButton text={loading ? 'Analyzing...' : 'Analyze'} onPress={handleAnalyze} style={styles.analyzeButton} />
          </View>
           
        </View>
        <View style={styles.errorAndLoading}>
            {error ? <Text style={{ color: 'red', width: '90%' }}>{error}</Text> : null}
            {loading && <ActivityIndicator size={80} style={{ marginTop: 10, }} color="#00bcd4" />}
            </View>
        {aiResult && (
          <View style={styles.resultBox}>
            <TimerButton text="Add to Workouts" onPress={handleAddAiWorkout} style={styles.addAiButton} />
            <Text style={styles.resultLabel}>Repetitions/Breaks</Text>
            <Text style={styles.resultValue}>{aiResult.reps} min</Text>
            <Text style={styles.resultLabel}>Expected Calories Burned</Text>
            <Text style={styles.resultValue}>{aiResult.calories} cal</Text>
            <Text style={styles.resultLabel}>Explanation</Text>
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
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 10,
    width: '90%',
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
    shadowColor: '#00bcd4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'flex-start',
  },
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
