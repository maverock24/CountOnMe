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

// Slow border glow pulsing effect - opacity pulses between 0.3 and 1
const useBorderGlowPulse = (isActive: boolean) => {
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!isActive) {
      glowAnim.setValue(0.3);
      return;
    }

    // Slow pulsing glow animation (2.5s per direction = 5s full cycle)
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, [isActive, glowAnim]);

  return glowAnim;
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
  isGoal = false,
  entranceAnim,
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
  isGoal?: boolean;
  entranceAnim?: Animated.Value;
}) => {
  const glowAnim = useBorderGlowPulse(isCurrentStep);
  const componentName = component.component;

  // Determine node state color
  const getNodeColor = () => {
    if (isCompleted) return theme.colors.success;
    if (isCurrentStep) return theme.colors.primary;
    return theme.colors.textMuted;
  };

  const nodeColor = getNodeColor();

  // Entrance animation transforms
  const animatedStyle = entranceAnim ? {
    opacity: entranceAnim,
    transform: [
      {
        translateY: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      },
      {
        scale: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  } : {};

  return (
    <Animated.View style={[styles.nodeContainer, animatedStyle]}>
      {/* Animated glow border overlay for current step */}
      {isCurrentStep && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowOverlay,
            {
              borderColor: theme.colors.glow,
              opacity: glowAnim,
              ...Platform.select({
                web: {
                  boxShadow: `0px 0px 12px 2px ${theme.colors.glow}`,
                },
                default: {
                  shadowColor: theme.colors.glow,
                  shadowOpacity: 1,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                },
              }),
            },
          ]}
        />
      )}
      <View
        style={[
          styles.nodeCard,
          {
            // Glass effect - semi-transparent with subtle gradient feel
            backgroundColor: isSelected
              ? `${theme.colors.selectedHighlight}DD`
              : `${theme.colors.surface}60`,
            borderColor: isCompleted
              ? `${theme.colors.success}80`
              : isCurrentStep
                ? `${theme.colors.primary}90`
                : `${theme.colors.tileBorder}70`,
            borderWidth: isCurrentStep ? 2 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.nodeCardInner}
          onPress={onPress}
          activeOpacity={0.7}
        >
        {/* Step number */}
        <View style={styles.nodeLeftSection}>
          {isCompleted ? (
            <Text style={[styles.stepCheckmark, { color: theme.colors.success }]}>{isGoal ? '🏆' : '✓'}</Text>
          ) : isGoal ? (
            <Text style={styles.stepGoalIcon}>🎯</Text>
          ) : (
            <Text style={[styles.stepNumber, { color: nodeColor }]}>
              {index + 1}
            </Text>
          )}
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
            {isGoal && !isCompleted && (
              <View style={[styles.goalBadge, { backgroundColor: `${theme.colors.warning || '#FFD700'}30` }]}>
                <Text style={[styles.goalBadgeText, { color: theme.colors.warning || '#FFD700' }]}>
                  GOAL
                </Text>
              </View>
            )}
            {isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: `${theme.colors.success}30` }]}>
                <Text style={[styles.completedBadgeText, { color: theme.colors.success }]}>
                  {isGoal ? '🏆' : '✓'}
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
      </View>
    </Animated.View>
  );
};

// Maximum number of nodes to animate (for performance)
const MAX_ANIMATED_NODES = 15;

export default function ProgressionTreeScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedProgression, setSelectedProgression] = useState<string>(
    progressionsList?.[0]?.name ?? ''
  );
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<ExerciseProgress>({});

  // Entrance animation values for staggered node reveal
  const nodeAnimations = useRef<Animated.Value[]>(
    Array.from({ length: MAX_ANIMATED_NODES }, () => new Animated.Value(0))
  ).current;

  // Run staggered entrance animation when progression changes
  const runEntranceAnimation = useCallback((nodeCount: number) => {
    // Reset all animations
    nodeAnimations.forEach(anim => anim.setValue(0));

    // Create staggered animations for each node
    const animations = nodeAnimations.slice(0, Math.min(nodeCount, MAX_ANIMATED_NODES)).map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100, // 100ms stagger between each node
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    });

    // Run all animations in parallel (stagger is handled by delay)
    Animated.parallel(animations).start();
  }, [nodeAnimations]);

  // Trigger entrance animation when progression changes or on initial load
  useEffect(() => {
    const progression = progressionsList.find((p) => p.name === selectedProgression);
    if (progression) {
      const stepCount = (progression.components?.length || 0) + 1; // +1 for goal
      // Small delay to ensure UI is ready
      setTimeout(() => runEntranceAnimation(stepCount), 50);
    }
  }, [selectedProgression, runEntranceAnimation]);

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

  // Build the full progression steps including the goal exercise as the last item
  const getFullProgressionSteps = (progression: any) => {
    if (!progression) return [];

    const steps: Array<{ component: string; description?: string; workout?: string; isGoal?: boolean }> = [];

    // Add component exercises (preparatory exercises)
    if (Array.isArray(progression.components)) {
      progression.components.forEach((c: any) => {
        steps.push({
          component: c.component,
          description: c.description,
          workout: c.workout,
          isGoal: false,
        });
      });
    }

    // Add the goal exercise (the progression itself) as the LAST item
    steps.push({
      component: progression.name,
      description: progression.description,
      workout: progression.workout,
      isGoal: true,
    });

    return steps;
  };

  const getProgressionProgress = (progression: any) => {
    const steps = getFullProgressionSteps(progression);
    if (steps.length === 0) return { completed: 0, total: 0, percentage: 0, currentStepIndex: 0 };

    const total = steps.length;
    let completed = 0;
    let currentStepIndex = -1; // -1 means not found yet

    for (let i = 0; i < steps.length; i++) {
      if (isComponentCompleted(steps[i].component)) {
        completed++;
      } else if (currentStepIndex === -1) {
        // First uncompleted item is the current step
        currentStepIndex = i;
      }
    }

    // If all completed, set currentStepIndex to last (or 0 if no steps)
    if (currentStepIndex === -1) {
      currentStepIndex = total > 0 ? total - 1 : 0;
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
    const fullSteps = getFullProgressionSteps(selectedProgressionData);

    if (fullSteps.length === 0) {
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
        {fullSteps.map((step: any, index: number) => {
          const componentName = step.component;
          const isCompleted = isComponentCompleted(componentName);
          const isCurrentStep = index === progress.currentStepIndex && !isCompleted;
          const isSelected = selectedNode === componentName;
          const isGoalExercise = step.isGoal === true;
          const entranceAnim = index < MAX_ANIMATED_NODES ? nodeAnimations[index] : undefined;

          // Connector animation style
          const connectorAnimStyle = entranceAnim ? {
            opacity: entranceAnim,
            transform: [{
              scaleY: entranceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            }],
          } : {};

          return (
            <View key={`node_${index}`}>
              {/* Connector line */}
              {index > 0 && (
                <Animated.View style={[styles.connectorContainer, connectorAnimStyle]}>
                  <View
                    style={[
                      styles.connectorLine,
                      {
                        backgroundColor: isComponentCompleted(fullSteps[index - 1].component)
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
                </Animated.View>
              )}

              <ProgressNode
                component={step}
                index={index}
                isCompleted={isCompleted}
                isCurrentStep={isCurrentStep}
                isSelected={isSelected}
                completionCount={getCompletionCount(componentName)}
                onPress={() => setSelectedNode(isSelected ? null : componentName)}
                theme={theme}
                t={t}
                isGoal={isGoalExercise}
                entranceAnim={entranceAnim}
              />
            </View>
          );
        })}
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
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 1,
  },
  nodeCard: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    // Glass effect - frosted glass appearance
    backdropFilter: 'blur(10px)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  nodeCardInner: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  nodeLeftSection: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  stepGoalIcon: {
    fontSize: 18,
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
  goalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  goalBadgeText: {
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
});
