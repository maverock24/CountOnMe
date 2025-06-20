// src/components/WorkoutAnalyzer.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, ActivityIndicator
} from 'react-native';

const USER_WEIGHT_KG = 70; // Example weight, get this from user profile

type AIAdvice = { advice: string } | { error: string } | null;

const WorkoutAnalyzer: React.FC = () => {
  const [activity, setActivity] = useState<string>('');
  const [plan, setPlan] = useState<string>('5;5;5;5;5');
  
  const [weight, setWeight] = useState('');
  const [exercise, setExercise] = useState('');
  const [trainingLevel, setTrainingLevel] = useState('beginner');
  const [calories, setCalories] = useState('');
  const [aiAdvice, setAiAdvice] = useState<AIAdvice>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAiAdvice(null);
    setAiResult(null);
    setError('');
    try {
      const body: any = {};
      if (calories) {
        body.calories = calories;
      } else {
        body.weight = weight;
        body.exercise = exercise;
        body.trainingLevel = trainingLevel;
      }
      const response = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI error');
      setAiResult(data);
    } catch (error: any) {
      setError(error.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Activity Name (e.g., Running, Yoga)</Text>
      <TextInput style={styles.input} value={activity} onChangeText={setActivity} />

      <Text style={styles.label}>Training Plan (e.g., 5;5;5)</Text>
      <TextInput style={styles.input} value={plan} onChangeText={setPlan} />
      
      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="Enter your weight" />
      <Text style={styles.label}>Exercise</Text>
      <TextInput style={styles.input} value={exercise} onChangeText={setExercise} placeholder="e.g. Running, Push-ups" />
      <Text style={styles.label}>Training Level</Text>
      <View style={styles.goalRow}>
        {['beginner','intermediate','expert'].map((g) => (
          <Button key={g} title={g.charAt(0).toUpperCase()+g.slice(1)} onPress={() => setTrainingLevel(g)} color={trainingLevel===g?"#00bcd4":undefined} />
        ))}
      </View>

      <Text style={styles.label}>Calories (optional)</Text>
      <TextInput style={styles.input} value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="Enter calories to burn (optional)" />
      <Button title={isLoading ? "Analyzing..." : "Analyze Workout"} onPress={handleAnalyze} disabled={isLoading} />

      {isLoading && <ActivityIndicator style={{ marginTop: 60 }} size="large" />}

      {aiAdvice && 'advice' in aiAdvice && (
        <View style={styles.resultContainer}>
          <Text style={styles.adviceTitle}>Friendly Advice from Gemini:</Text>
          <Text style={styles.adviceText}>{aiAdvice.advice}</Text>
        </View>
      )}
      
      {aiAdvice && 'error' in aiAdvice && (
        <View style={styles.resultContainer}>
          <Text style={styles.errorText}>{aiAdvice.error}</Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {aiResult && (
        <View style={styles.resultContainer}>
          {aiResult.reps && <Text style={styles.resultText}>Repetitions/Breaks: <Text style={{ fontWeight: 'bold' }}>{aiResult.reps}</Text></Text>}
          {aiResult.calories && <Text style={styles.resultText}>Expected Calories Burned: <Text style={{ fontWeight: 'bold' }}>{aiResult.calories}</Text></Text>}
          {aiResult.exercise && <Text style={styles.resultText}>Exercise: <Text style={{ fontWeight: 'bold' }}>{aiResult.exercise}</Text></Text>}
          {aiResult.weight && <Text style={styles.resultText}>Weight: <Text style={{ fontWeight: 'bold' }}>{aiResult.weight}</Text></Text>}
          {aiResult.explanation && <Text style={styles.resultText}>Explanation: <Text>{aiResult.explanation}</Text></Text>}
        </View>
      )}
    </View>
  );
};

// Add your styles here...
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 16, fontWeight: '500', marginTop: 15, marginBottom: 5, color: 'lightgray' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, backgroundColor: 'rgb(45, 55, 73)', color: '#fff' },
    resultContainer: { marginTop: 20, padding: 15, backgroundColor: 'rgb(45, 55, 73)', borderRadius: 8, borderWidth: 1, borderColor: '#444' },
    resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
    resultText: { fontSize: 16, marginBottom: 5, color: '#eee' },
    adviceTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 5, marginBottom: 10, color: '#81C784' },
    adviceText: { fontSize: 16, fontStyle: 'italic', lineHeight: 22, color: '#eee' },
    errorText: { color: '#EF9A9A', fontSize: 16 },
    goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }
});

export default WorkoutAnalyzer;