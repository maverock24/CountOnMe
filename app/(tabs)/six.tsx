import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import CustomPicker from '@/components/CustomPicker';
import { useTheme } from '@/components/ThemeProvider';
import ThemedText from '@/components/ThemedText';
import commonStyles from '../styles';

// Import progressions list (exercises with their component progressions)
const progressionsList: any[] = require('../../assets/progressions.json');

// Storage key for exercise completion counts
const EXERCISE_COUNTS_KEY = '@countOnMe_exercise_counts';

interface ExerciseProgress {
  [exerciseName: string]: number;
}

// Animated glow border effect for the current step (pulsing glow only, no border width change)
const useGlowBorderAnimation = (isActive: boolean) => {
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!isActive) {
      glowAnim.setValue(0.4);
      return;
    }

    // Pulsing glow opacity animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, [isActive, glowAnim]);

  return { glowAnim };
};

// Animated progress node component
const ProgressNode = ({
  component,
  index,
  isCompleted,
  isCurrentStep,
  isSelected,
  completionCount,
  onPress,
  theme,
  t,
}: {
  component: any;
  index: number;
  isCompleted: boolean;
  isCurrentStep: boolean;
  isSelected: boolean;
  completionCount: number;
  onPress: () => void;
  theme: any;
  t: any;
}) => {
  const { glowAnim } = useGlowBorderAnimation(isCurrentStep);
  const componentName = component.component;

  // Determine node state color
  const getNodeColor = () => {
    if (isCompleted) return theme.colors.success;
    if (isCurrentStep) return theme.colors.primary;
    return theme.colors.textMuted;
  };

  const nodeColor = getNodeColor();

  // Animated glow shadow for current step (pulsing glow border effect)
  const animatedShadowRadius = glowAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [8, 18],
  });

  // Web-specific animated box shadow for glow border effect
  const animatedBoxShadow = glowAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [
      `0px 0px 8px ${theme.colors.glow}60`,
      `0px 0px 18px ${theme.colors.glow}`,
    ],
  });

  return (
    <Animated.View
      style={[
        styles.nodeContainer,
      ]}
    >
      <Animated.View
        style={[
          styles.nodeCard,
          {
            backgroundColor: isSelected
              ? theme.colors.selectedHighlight
              : `${theme.colors.surface}90`,
            borderColor: isCompleted
              ? theme.colors.success
              : isCurrentStep
                ? theme.colors.primary
                : theme.colors.tileBorder,
            borderWidth: isCurrentStep ? 2 : 1,
          },
          // Native shadow for current step
          isCurrentStep && {
            shadowColor: theme.colors.glow,
            shadowOpacity: glowAnim,
            shadowRadius: animatedShadowRadius,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          },
          // Web-specific box shadow
          isCurrentStep && Platform.OS === 'web' && {
            boxShadow: animatedBoxShadow,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.nodeCardInner}
          onPress={onPress}
          activeOpacity={0.7}
        >
        {/* Step number circle */}
        <View style={styles.nodeLeftSection}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: isCompleted
                  ? theme.colors.success
                  : isCurrentStep
                    ? theme.colors.primary
                    : 'transparent',
                borderColor: nodeColor,
                borderWidth: 2,
              },
            ]}
          >
            {isCompleted ? (
              <Text style={styles.stepCheckmark}>✓</Text>
            ) : (
              <Text style={[styles.stepNumber, { color: nodeColor }]}>
                {index + 1}
              </Text>
            )}
          </View>

          {/* Progress indicator */}
          <Svg width="50" height="50" style={styles.progressRing}>
            <Defs>
              <LinearGradient id={`nodeGrad_${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={nodeColor} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={nodeColor} stopOpacity="0.3" />
              </LinearGradient>
            </Defs>
            <Circle
              cx="25"
              cy="25"
              r="22"
              stroke={`${nodeColor}30`}
              strokeWidth="3"
              fill="transparent"
            />
            {isCompleted && (
              <Circle
                cx="25"
                cy="25"
                r="22"
                stroke={`url(#nodeGrad_${index})`}
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            )}
          </Svg>
        </View>

        {/* Content */}
        <View style={styles.nodeContent}>
          <View style={styles.nodeHeader}>
            <Text
              style={[
                styles.nodeName,
                { color: isCompleted ? theme.colors.success : theme.colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {componentName}
            </Text>
            {isCurrentStep && (
              <View style={[styles.currentBadge, { backgroundColor: `${theme.colors.primary}30` }]}>
                <Text style={[styles.currentBadgeText, { color: theme.colors.primary }]}>
                  NEXT
                </Text>
              </View>
            )}
            {isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: `${theme.colors.success}30` }]}>
                <Text style={[styles.completedBadgeText, { color: theme.colors.success }]}>
                  ✓
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[styles.nodeDescription, { color: theme.colors.textMuted }]}
            numberOfLines={isSelected ? undefined : 2}
          >
            {component.description || 'No description available'}
          </Text>

          {isSelected && (
            <View style={styles.expandedInfo}>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.workoutRow}>
                <Text style={[styles.workoutLabel, { color: theme.colors.textMuted }]}>
                  {t('workout') || 'Workout'}:
                </Text>
                <Text style={[styles.workoutValue, { color: theme.colors.primary }]}>
                  {component.workout?.split(';').map((time: string) =>
                    `${Math.round(parseFloat(time) / 60 * 10) / 10}m`
                  ).join(' → ') || 'N/A'}
                </Text>
              </View>
              {completionCount > 0 && (
                <Text style={[styles.completionText, { color: theme.colors.textMuted }]}>
                  Completed {completionCount} time{completionCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}
        </View>

          {/* Arrow indicator for current step */}
          {isCurrentStep && (
            <View style={styles.arrowContainer}>
              <Text style={[styles.arrow, { color: theme.colors.primary }]}>→</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

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
      const completedWorkouts = await AsyncStorage.getItem('@countOnMe_completed');
      if (completedWorkouts) {
        setCompletedExercises(JSON.parse(completedWorkouts));
      }

      const counts = await AsyncStorage.getItem(EXERCISE_COUNTS_KEY);
      if (counts) {
        setExerciseCounts(JSON.parse(counts));
      }
    } catch (error) {
      console.error('Failed to load progress data', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [loadProgressData])
  );

  const isComponentCompleted = (componentName: string): boolean => {
    return completedExercises.includes(componentName);
  };

  const getCompletionCount = (exerciseName: string): number => {
    return exerciseCounts[exerciseName] || 0;
  };

  const getProgressionProgress = (progression: any) => {
    if (!progression?.components?.length) return { completed: 0, total: 0, percentage: 0, currentStepIndex: 0 };

    const total = progression.components.length;
    let completed = 0;
    let currentStepIndex = 0;

    for (let i = 0; i < progression.components.length; i++) {
      if (isComponentCompleted(progression.components[i].component)) {
        completed++;
      } else if (currentStepIndex === 0 || currentStepIndex === completed) {
        currentStepIndex = i;
      }
    }

    // If all completed, set currentStepIndex to last
    if (completed === total) {
      currentStepIndex = total - 1;
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentStepIndex,
    };
  };

  const selectedProgressionData = progressionsList.find((p) => p.name === selectedProgression);
  const progress = selectedProgressionData
    ? getProgressionProgress(selectedProgressionData)
    : { completed: 0, total: 0, percentage: 0, currentStepIndex: 0 };

  const renderProgressionPath = () => {
    if (!selectedProgressionData?.components?.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>
            {t('select_progression') || 'Select a progression to view exercises'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.pathContainer}>
        {selectedProgressionData.components.map((comp: any, index: number) => {
          const componentName = comp.component;
          const isCompleted = isComponentCompleted(componentName);
          const isCurrentStep = index === progress.currentStepIndex && !isCompleted;
          const isSelected = selectedNode === componentName;

          return (
            <View key={`node_${index}`}>
              {/* Connector line */}
              {index > 0 && (
                <View style={styles.connectorContainer}>
                  <View
                    style={[
                      styles.connectorLine,
                      {
                        backgroundColor: isComponentCompleted(
                          selectedProgressionData.components[index - 1].component
                        )
                          ? theme.colors.success
                          : theme.colors.tileBorder,
                      },
                    ]}
                  />
                  {/* Animated dots on connector for current step */}
                  {isCurrentStep && (
                    <View style={styles.connectorDots}>
                      <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                      <View style={[styles.dot, { backgroundColor: theme.colors.primary, opacity: 0.6 }]} />
                      <View style={[styles.dot, { backgroundColor: theme.colors.primary, opacity: 0.3 }]} />
                    </View>
                  )}
                </View>
              )}

              <ProgressNode
                component={comp}
                index={index}
                isCompleted={isCompleted}
                isCurrentStep={isCurrentStep}
                isSelected={isSelected}
                completionCount={getCompletionCount(componentName)}
                onPress={() => setSelectedNode(isSelected ? null : componentName)}
                theme={theme}
                t={t}
              />
            </View>
          );
        })}

        {/* Goal indicator at the end */}
        <View style={styles.goalContainer}>
          <View
            style={[
              styles.goalCircle,
              {
                backgroundColor: progress.percentage === 100
                  ? theme.colors.success
                  : `${theme.colors.primary}20`,
                borderColor: progress.percentage === 100
                  ? theme.colors.success
                  : theme.colors.primary,
              },
            ]}
          >
            <Text style={[styles.goalIcon, { color: progress.percentage === 100 ? '#fff' : theme.colors.primary }]}>
              {progress.percentage === 100 ? '🏆' : '🎯'}
            </Text>
          </View>
          <Text style={[styles.goalText, { color: theme.colors.textMuted }]}>
            {progress.percentage === 100 ? 'Progression Complete!' : selectedProgressionData.name}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.outerContainer]}>
        <ThemedText style={commonStyles.tileTitle}>{t('progress')}</ThemedText>
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.tileBackground,
              borderColor: theme.colors.tileBorder,
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Progression Picker */}
            <ThemedText weight="bold" style={styles.sectionTitle}>
              {t('select_progression') || 'Select Progression'}
            </ThemedText>
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

            {/* Progress Stats */}
            {selectedProgressionData && (
              <View style={styles.statsContainer}>
                <Text style={[styles.progressionDescription, { color: theme.colors.textMuted }]}>
                  {selectedProgressionData.description}
                </Text>

                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.colors.progressTrack }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: theme.colors.progressFill,
                          width: `${progress.percentage}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>
                    {progress.percentage}%
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.colors.success }]}>
                      {progress.completed}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                      {t('completed') || 'Completed'}
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.colors.textMuted }]}>
                      {progress.total - progress.completed}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                      Remaining
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                      {progress.total}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                      Total
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Progression Path */}
            <ThemedText weight="bold" style={[styles.sectionTitle, { marginTop: 20 }]}>
              {t('progression_path') || 'Your Path'}
            </ThemedText>
            {renderProgressionPath()}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    width: '95%',
    alignSelf: 'center',
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 8,
  },
  statsContainer: {
    marginTop: 15,
  },
  progressionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 15,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
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
  pathContainer: {
    paddingTop: 10,
  },
  nodeContainer: {
    marginBottom: 5,
  },
  nodeCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nodeCardInner: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  nodeLeftSection: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  progressRing: {
    position: 'absolute',
  },
  nodeContent: {
    flex: 1,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nodeName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  completedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nodeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  expandedInfo: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  workoutLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  workoutValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  completionText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 6,
  },
  arrowContainer: {
    paddingLeft: 8,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '700',
  },
  connectorContainer: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 37,
  },
  connectorLine: {
    width: 3,
    height: '100%',
    borderRadius: 2,
  },
  connectorDots: {
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  goalContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 15,
  },
  goalCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  goalIcon: {
    fontSize: 28,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
});
