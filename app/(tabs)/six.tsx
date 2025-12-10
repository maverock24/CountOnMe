import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';

import CustomPicker from '@/components/CustomPicker';
import { useTheme } from '@/components/ThemeProvider';
import ThemedText from '@/components/ThemedText';
import commonStyles from '../styles';

// Import progressions list (exercises with their component progressions)
const progressionsList: any[] = require('../../assets/progressions.json');

// Storage key for exercise completion counts
const EXERCISE_COUNTS_KEY = '@countOnMe_exercise_counts';

interface ExerciseProgress {
  [exerciseName: string]: number; // count of completions
}

export default function ProgressionTreeScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedProgression, setSelectedProgression] = useState<string>(
    progressionsList?.[0]?.name ?? ''
  );
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<ExerciseProgress>({});

  // Load completed workouts and exercise counts from storage
  const loadProgressData = useCallback(async () => {
    try {
      // Load list of completed exercises (at least once)
      const completedWorkouts = await AsyncStorage.getItem('@countOnMe_completed');
      if (completedWorkouts) {
        const completedArray = JSON.parse(completedWorkouts);
        setCompletedExercises(completedArray);
      }

      // Load exercise completion counts
      const counts = await AsyncStorage.getItem(EXERCISE_COUNTS_KEY);
      if (counts) {
        setExerciseCounts(JSON.parse(counts));
      }
    } catch (error) {
      console.error('Failed to load progress data', error);
    }
  }, []);

  // Reload progress data when screen is focused (e.g., after completing a workout)
  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [loadProgressData])
  );

  // Check if an exercise component is completed
  const isComponentCompleted = (componentName: string): boolean => {
    return completedExercises.includes(componentName);
  };

  // Get completion count for an exercise
  const getCompletionCount = (exerciseName: string): number => {
    return exerciseCounts[exerciseName] || 0;
  };

  // Calculate progress for a progression (how many components completed)
  const getProgressionProgress = (progression: any) => {
    if (!progression?.components?.length) return { completed: 0, total: 0, percentage: 0 };

    const total = progression.components.length;
    const completed = progression.components.filter((comp: any) =>
      isComponentCompleted(comp.component)
    ).length;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const renderStepNumber = (index: number, isCompleted: boolean) => {
    return (
      <View style={[
        styles.stepNumber,
        isCompleted && styles.stepNumberCompleted,
        { backgroundColor: isCompleted ? `${theme.colors.success}30` : 'rgba(255,255,255,0.1)' }
      ]}>
        {isCompleted ? (
          <Text style={[styles.stepNumberText, { color: theme.colors.success }]}>✓</Text>
        ) : (
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        )}
      </View>
    );
  };

  const renderHexNode = (component: any, index: number) => {
    const componentName = component.component;
    const isCompleted = isComponentCompleted(componentName);
    const completionCount = getCompletionCount(componentName);
    const isSelected = selectedNode === componentName;

    const hexPoints = '50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5';

    return (
      <TouchableOpacity
        key={`${componentName}_${index}`}
        style={[
          styles.nodeCard,
          isSelected && styles.nodeCardSelected,
          {
            backgroundColor: isSelected
              ? `${theme.colors.primary}15`
              : theme.colors.listTileBackground,
            borderColor: isSelected
              ? `${theme.colors.primary}50`
              : theme.colors.tileBorder
          }
        ]}
        onPress={() => setSelectedNode(isSelected ? null : componentName)}
        activeOpacity={0.7}
      >
        {/* Left side: Step indicator and Hexagon */}
        <View style={styles.nodeLeftSection}>
          {renderStepNumber(index, isCompleted)}

          <View style={styles.hexWrapper}>
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id={`grad_${componentName}_${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop
                    offset="0%"
                    stopColor={isCompleted ? theme.colors.success : theme.colors.glow}
                    stopOpacity="0.3"
                  />
                  <Stop
                    offset="100%"
                    stopColor={isCompleted ? theme.colors.success : theme.colors.primary}
                    stopOpacity="0.1"
                  />
                </LinearGradient>
              </Defs>

              {/* Background hex */}
              <Polygon
                points={hexPoints}
                fill={`url(#grad_${componentName}_${index})`}
                stroke={isCompleted ? theme.colors.success : theme.colors.glow}
                strokeWidth={isCompleted ? 2.5 : 1.5}
                opacity={1}
              />

              {/* Inner glow for completed */}
              {isCompleted && (
                <Circle cx="50" cy="50" r="25" fill={`${theme.colors.success}25`} />
              )}
            </Svg>

            {/* Hex content overlay */}
            <View style={styles.hexContent}>
              <Text
                style={[
                  styles.hexText,
                  isCompleted && { color: theme.colors.success },
                ]}
                numberOfLines={2}
              >
                {componentName}
              </Text>
            </View>
          </View>
        </View>

        {/* Right side: Description */}
        <View style={styles.nodeRightSection}>
          <View style={styles.nodeHeader}>
            <Text style={[styles.nodeName, { color: theme.colors.textPrimary }]}>
              {componentName}
            </Text>
            <View
              style={[
                styles.statusBadge,
                isCompleted
                  ? { backgroundColor: `${theme.colors.success}30` }
                  : { backgroundColor: `${theme.colors.primary}30` },
              ]}
            >
              <Text style={[styles.statusText, { color: isCompleted ? theme.colors.success : theme.colors.primary }]}>
                {isCompleted ? '✓ Done' : 'Ready'}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.nodeDescription, { color: theme.colors.textMuted }]}
            numberOfLines={isSelected ? undefined : 3}
          >
            {component.description || 'No description available'}
          </Text>

          {isSelected && (
            <View style={styles.expandedInfo}>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.workoutInfo}>
                <ThemedText style={styles.workoutLabel}>{t('workout') || 'Workout'}:</ThemedText>
                <Text style={[styles.workoutValue, { color: theme.colors.primary }]}>
                  {component.workout?.split(';').map((t: string) => `${Math.round(parseFloat(t) / 60 * 10) / 10}m`).join(' | ') || 'N/A'}
                </Text>
              </View>
              {completionCount > 0 && (
                <ThemedText style={styles.completionCount}>
                  {t('completed_times', { count: completionCount }) || `Completed ${completionCount} time${completionCount !== 1 ? 's' : ''}`}
                </ThemedText>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderProgressionTree = () => {
    const chosen = selectedProgression
      ? progressionsList.find((p) => p.name === selectedProgression)
      : null;

    if (chosen && Array.isArray(chosen.components) && chosen.components.length > 0) {
      return (
        <View style={styles.treeContainer}>
          {/* Vertical connector line */}
          <View style={[styles.connectorLine, { backgroundColor: `${theme.colors.primary}30` }]} />

          {chosen.components.map((comp: any, index: number) => (
            <View key={`node_${index}`} style={styles.nodeWrapper}>
              {renderHexNode(comp, index)}
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>
          {t('select_progression') || 'Select a progression to view exercises'}
        </Text>
      </View>
    );
  };

  const selectedProgressionData = progressionsList.find((p) => p.name === selectedProgression);
  const progress = selectedProgressionData ? getProgressionProgress(selectedProgressionData) : { completed: 0, total: 0, percentage: 0 };

  return (
    <View style={[commonStyles.container, { backgroundColor: theme.colors.void }]}>
      {/* Header Section */}
      <View style={[commonStyles.outerContainer, { flex: 0, maxHeight: 200 }]}>
        <ThemedText style={commonStyles.tileTitle}>{t('progress')}</ThemedText>
        <View style={[commonStyles.tile, { padding: 12, paddingTop: 16, backgroundColor: theme.colors.tileBackground, borderColor: theme.colors.tileBorder }]}>
          <CustomPicker
            items={progressionsList.map((p) => ({ label: p.name, value: p.name }))}
            selectedValue={selectedProgression}
            onValueChange={(itemValue) => {
              setSelectedProgression(itemValue);
              setSelectedNode(null);
            }}
            dropdownIconColor="#fff"
            style={{ width: '100%', height: 44 }}
          />

          {selectedProgressionData && (
            <View style={styles.progressionInfo}>
              <Text style={[styles.progressionDescription, { color: theme.colors.textMuted }]} numberOfLines={2}>
                {selectedProgressionData.description}
              </Text>
              <View style={[styles.statsRow, { backgroundColor: `${theme.colors.primary}15` }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>{progress.total}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('exercises') || 'Exercises'}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.success }]}>{progress.completed}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('completed') || 'Completed'}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>{progress.percentage}%</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('progress_label') || 'Progress'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Progression Tree Section */}
      <View style={[commonStyles.outerContainer, { flex: 1 }]}>
        <ThemedText style={commonStyles.tileTitle}>{t('exercises') || 'Exercises'}</ThemedText>
        <View style={[commonStyles.tile, { flex: 1, padding: 0, overflow: 'hidden', backgroundColor: theme.colors.tileBackground, borderColor: theme.colors.tileBorder }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderProgressionTree()}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  progressionInfo: {
    marginTop: 12,
    width: '100%',
  },
  progressionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  treeContainer: {
    position: 'relative',
    paddingLeft: 20,
  },
  connectorLine: {
    position: 'absolute',
    left: 38,
    top: 50,
    bottom: 50,
    width: 2,
    borderRadius: 1,
  },
  nodeWrapper: {
    marginBottom: 12,
  },
  nodeCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  nodeCardSelected: {
    // Dynamic styles applied inline
  },
  nodeLeftSection: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberCompleted: {
    // Dynamic styles applied inline
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  hexWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  hexContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  hexText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nodeRightSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  nodeName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nodeDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  expandedInfo: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  workoutValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  completionCount: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
});
