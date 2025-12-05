import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
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
import Colors from '@/constants/Colors';
import commonStyles from '../styles';

// Import progression configuration and progressions list
const progressionConfig = require('../../assets/progression_config.json');
const progressionsList: any[] = require('../../assets/progressions.json');


interface NodeStatus {
  id: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  progress?: {
    [exercise: string]: number;
  };
}

interface UserProgress {
  completedNodes: string[];
  exerciseHistory: {
    [exercise: string]: number;
  };
  unlockedExercises: string[];
}

export default function ProgressionTreeScreen() {
  const { t } = useTranslation();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedProgression, setSelectedProgression] = useState<string>(
    progressionsList?.[0]?.name ?? ''
  );
  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedNodes: ['START'],
    exerciseHistory: {
      'Wall Push-ups': 5,
      'Modified Plank': 3,
      'Assisted Squats': 8,
      Walking: 10,
      'Marching in Place': 5,
    },
    unlockedExercises: ['Basic Warm-up', 'Breathing Exercises'],
  });

  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      try {
        const completedWorkouts = await AsyncStorage.getItem('@countOnMe_completed');
        if (completedWorkouts) {
          const completedWorkoutsArray = JSON.parse(completedWorkouts);
          setUserProgress((prevProgress) => ({
            ...prevProgress,
            completedNodes: [...new Set([...prevProgress.completedNodes, ...completedWorkoutsArray])],
          }));
        }
      } catch (error) {
        console.error('Failed to load completed workouts', error);
      }
    };

    loadCompletedWorkouts();
  }, []);

  const getNodeStatus = (nodeId: string): NodeStatus => {
    const node = progressionConfig.progressionTree[nodeId];
    if (!node) return { id: nodeId, isCompleted: false, isUnlocked: false };

    const isCompleted = userProgress.completedNodes.includes(nodeId);

    let isUnlocked = false;
    if (nodeId === 'START') {
      isUnlocked = true;
    } else if (node.unlockConditions && node.unlockConditions.length > 0) {
      isUnlocked = node.unlockConditions.every((condition: any) => {
        if (condition.nodeId) {
          return userProgress.completedNodes.includes(condition.nodeId);
        }
        if (condition.exerciseCount) {
          const currentCount = userProgress.exerciseHistory[condition.exerciseCount] || 0;
          return currentCount >= condition.count;
        }
        return true;
      });
    } else {
      isUnlocked = true;
    }

    const progress: { [exercise: string]: number } = {};
    if (node.unlockConditions) {
      node.unlockConditions.forEach((condition: any) => {
        if (condition.exerciseCount) {
          const currentCount = userProgress.exerciseHistory[condition.exerciseCount] || 0;
          progress[condition.exerciseCount] = Math.min(currentCount / condition.count, 1);
        }
      });
    }

    return { id: nodeId, isCompleted, isUnlocked, progress };
  };

  const getNodeDisplayInfo = (nodeId: string) => {
    const node = progressionConfig.progressionTree[nodeId];
    const status = getNodeStatus(nodeId);

    return {
      id: nodeId,
      name: node?.name || nodeId,
      icon: node?.icon || 'circle',
      description: node?.description || '',
      status,
      unlockText: getUnlockText(nodeId, status),
    };
  };

  const getUnlockText = (nodeId: string, status: NodeStatus) => {
    const node = progressionConfig.progressionTree[nodeId];
    if (status.isCompleted) return 'Completed!';
    if (status.isUnlocked) return 'Available now!';

    if (node?.unlockConditions) {
      const requirements = node.unlockConditions
        .map((condition: any) => {
          if (condition.nodeId) {
            const isCompleted = userProgress.completedNodes.includes(condition.nodeId);
            return `${condition.nodeId}: ${isCompleted ? '✓' : '✗'}`;
          }
          if (condition.exerciseCount) {
            const current = userProgress.exerciseHistory[condition.exerciseCount] || 0;
            return `${condition.exerciseCount}: ${current}/${condition.count}`;
          }
          return '';
        })
        .filter((req: string) => req)
        .join('\n');
      return `Requirements:\n${requirements}`;
    }

    return 'Complete previous steps to unlock';
  };

  const renderStepNumber = (index: number, isCompleted: boolean) => {
    return (
      <View style={[styles.stepNumber, isCompleted && styles.stepNumberCompleted]}>
        {isCompleted ? (
          <Text style={styles.stepNumberText}>✓</Text>
        ) : (
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        )}
      </View>
    );
  };

  const renderHexNode = (nodeId: string, index: number) => {
    const nodeInfo = getNodeDisplayInfo(nodeId);
    const status = nodeInfo.status;
    const isSelected = selectedNode === nodeId;

    const hexPoints = '50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5';

    return (
      <TouchableOpacity
        key={nodeId}
        style={[styles.nodeCard, isSelected && styles.nodeCardSelected]}
        onPress={() => setSelectedNode(isSelected ? null : nodeId)}
        activeOpacity={0.7}
      >
        {/* Left side: Step indicator and Hexagon */}
        <View style={styles.nodeLeftSection}>
          {renderStepNumber(index, status.isCompleted)}

          <View style={styles.hexWrapper}>
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id={`grad_${nodeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop
                    offset="0%"
                    stopColor={status.isCompleted ? '#00c853' : Colors.glow}
                    stopOpacity="0.3"
                  />
                  <Stop
                    offset="100%"
                    stopColor={status.isCompleted ? '#00e676' : '#00bcd4'}
                    stopOpacity="0.1"
                  />
                </LinearGradient>
              </Defs>

              {/* Background hex */}
              <Polygon
                points={hexPoints}
                fill={`url(#grad_${nodeId})`}
                stroke={status.isCompleted ? '#00c853' : status.isUnlocked ? Colors.glow : '#3a3f47'}
                strokeWidth={status.isCompleted ? 2.5 : 1.5}
                opacity={!status.isUnlocked ? 0.5 : 1}
              />

              {/* Inner glow for completed */}
              {status.isCompleted && (
                <Circle cx="50" cy="50" r="25" fill="rgba(0,200,83,0.15)" />
              )}
            </Svg>

            {/* Hex content overlay */}
            <View style={styles.hexContent}>
              <Text
                style={[
                  styles.hexText,
                  status.isCompleted && styles.hexTextCompleted,
                  !status.isUnlocked && styles.hexTextLocked,
                ]}
                numberOfLines={2}
              >
                {nodeInfo.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Right side: Description */}
        <View style={styles.nodeRightSection}>
          <View style={styles.nodeHeader}>
            <Text style={[styles.nodeName, !status.isUnlocked && styles.nodeNameLocked]}>
              {nodeInfo.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                status.isCompleted
                  ? styles.statusCompleted
                  : status.isUnlocked
                    ? styles.statusUnlocked
                    : styles.statusLocked,
              ]}
            >
              <Text style={styles.statusText}>
                {status.isCompleted ? '✓ Done' : status.isUnlocked ? 'Ready' : 'Locked'}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.nodeDescription, !status.isUnlocked && styles.nodeDescriptionLocked]}
            numberOfLines={isSelected ? undefined : 3}
          >
            {nodeInfo.description || 'No description available'}
          </Text>

          {isSelected && (
            <View style={styles.expandedInfo}>
              <View style={styles.divider} />
              <Text style={styles.statusLabel}>{nodeInfo.unlockText}</Text>
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
          <View style={styles.connectorLine} />

          {chosen.components.map((comp: any, index: number) => (
            <View key={`node_${index}`} style={styles.nodeWrapper}>
              {renderHexNode(comp.component, index)}
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Select a progression to view exercises</Text>
      </View>
    );
  };

  const selectedProgressionData = progressionsList.find((p) => p.name === selectedProgression);

  return (
    <View style={commonStyles.container}>
      {/* Header Section */}
      <View style={[commonStyles.outerContainer, { flex: 0, maxHeight: 180 }]}>
        <Text style={commonStyles.tileTitle}>{t('progress')}</Text>
        <View style={[commonStyles.tile, { padding: 12, paddingTop: 16 }]}>
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
              <Text style={styles.progressionDescription} numberOfLines={2}>
                {selectedProgressionData.description}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedProgressionData.components?.length || 0}</Text>
                  <Text style={styles.statLabel}>Exercises</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {userProgress.completedNodes.filter((node) =>
                      selectedProgressionData.components?.some((c: any) => c.component === node)
                    ).length}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Progression Tree Section */}
      <View style={[commonStyles.outerContainer, { flex: 1 }]}>
        <Text style={commonStyles.tileTitle}>Exercises</Text>
        <View style={[commonStyles.tile, { flex: 1, padding: 0, overflow: 'hidden' }]}>
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 199, 207, 0.08)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    color: Colors.glow,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(42, 199, 207, 0.2)',
    borderRadius: 1,
  },
  nodeWrapper: {
    marginBottom: 12,
  },
  nodeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 40, 50, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nodeCardSelected: {
    backgroundColor: 'rgba(42, 199, 207, 0.08)',
    borderColor: 'rgba(42, 199, 207, 0.3)',
  },
  nodeLeftSection: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberCompleted: {
    backgroundColor: 'rgba(0, 200, 83, 0.2)',
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
  hexTextCompleted: {
    color: '#00e676',
  },
  hexTextLocked: {
    color: 'rgba(255,255,255,0.4)',
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
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  nodeNameLocked: {
    color: 'rgba(255,255,255,0.5)',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusCompleted: {
    backgroundColor: 'rgba(0, 200, 83, 0.2)',
  },
  statusUnlocked: {
    backgroundColor: 'rgba(42, 199, 207, 0.2)',
  },
  statusLocked: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nodeDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 17,
  },
  nodeDescriptionLocked: {
    color: 'rgba(255,255,255,0.35)',
  },
  expandedInfo: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  statusLabel: {
    color: Colors.glow,
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
});
