import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Defs, Polygon, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

import { useToast } from '../../components/ToastProvider';
import commonStyles from '../styles';

// Import progression configuration
const progressionConfig = require('../../assets/progression_config.json');

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
  const { showToast } = useToast();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [toastIndex, setToastIndex] = useState(0);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedNodes: ['START'], // Start is always completed
    exerciseHistory: {
      'Wall Push-ups': 5, // Example: user has done 5 wall push-ups
      'Modified Plank': 3, // Example: user has held modified plank 3 times
      'Assisted Squats': 8, // Example: user has done 8 assisted squats
      'Walking': 10,
      'Marching in Place': 5,
    },
    unlockedExercises: ['Basic Warm-up', 'Breathing Exercises'],
  });

  // Calculate node status based on user progress
  const getNodeStatus = (nodeId: string): NodeStatus => {
    const node = progressionConfig.progressionTree[nodeId];
    if (!node) return { id: nodeId, isCompleted: false, isUnlocked: false };

    const isCompleted = userProgress.completedNodes.includes(nodeId);
    
    // Check if node is unlocked
    let isUnlocked = false;
    if (nodeId === 'START') {
      isUnlocked = true; // Start is always unlocked
    } else if (node.unlockConditions && node.unlockConditions.length > 0) {
      // Check if all unlock conditions are met
      isUnlocked = node.unlockConditions.every((condition: any) => {
        if (condition.nodeId) {
          // Check if required node is completed
          return userProgress.completedNodes.includes(condition.nodeId);
        }
        if (condition.exerciseCount) {
          // Check if exercise count requirement is met
          const currentCount = userProgress.exerciseHistory[condition.exerciseCount] || 0;
          return currentCount >= condition.count;
        }
        return true;
      });
    } else {
      isUnlocked = true; // No conditions means unlocked
    }

    // Calculate progress for exercises
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
      unlockText: getUnlockText(nodeId, status)
    };
  };

  const getUnlockText = (nodeId: string, status: NodeStatus) => {
    const node = progressionConfig.progressionTree[nodeId];
    if (status.isCompleted) return 'Completed!';
    if (status.isUnlocked) return 'Available now!';
    
    if (node?.unlockConditions) {
      const requirements = node.unlockConditions.map((condition: any) => {
        if (condition.nodeId) {
          const isCompleted = userProgress.completedNodes.includes(condition.nodeId);
          return `${condition.nodeId}: ${isCompleted ? '✓' : '✗'}`;
        }
        if (condition.exerciseCount) {
          const current = userProgress.exerciseHistory[condition.exerciseCount] || 0;
          return `${condition.exerciseCount}: ${current}/${condition.count}`;
        }
        return '';
      }).filter((req: string) => req).join('\n');
      return `Requirements:\n${requirements}`;
    }
    
    return 'Complete previous steps to unlock';
  };

  const renderHexNode = (nodeId: string) => {
    const nodeInfo = getNodeDisplayInfo(nodeId);
    const status = nodeInfo.status;
    
    // TimerButton-style gradient colors based on status
    const getGradientColors = () => {
      if (status.isCompleted) {
        return { start: '#39ff14', end: '#2dd10f' }; // Green gradient for completed
      } else if (status.isUnlocked) {
        return { start: '#4a9eff', end: '#2d7dd6' }; // Blue gradient for unlocked
      } else {
        return { start: '#6a6a6a', end: '#4a4a4a' }; // Gray gradient for locked
      }
    };

    const { start: gradientStart, end: gradientEnd } = getGradientColors();
    const hexPoints = "40,4 76,22 76,58 40,76 4,58 4,22";

    return (
      <TouchableOpacity
        key={nodeId}
        style={[
          styles.hexNode,
          {
            opacity: !status.isUnlocked ? 0.6 : 1,
          }
        ]}
        onPress={() => {
          setSelectedNode(selectedNode === nodeId ? null : nodeId);
          
          // Show different toast messages based on node status
          if (status.isCompleted) {
            showToast({
              type: 'success',
              message: `✅ ${nodeInfo.name} completed!`,
              duration: 2000,
              position: 'top',
            });
          } else if (status.isUnlocked) {
            showToast({
              type: 'info',
              message: `🎯 ${nodeInfo.name} is ready to start!`,
              duration: 2000,
              position: 'top',
            });
          } else {
            showToast({
              type: 'warning',
              message: `🔒 Complete previous steps to unlock ${nodeInfo.name}`,
              duration: 3000,
              position: 'top',
            });
          }
        }}
      >
        <Svg width="80" height="80">
          <Defs>
            <SvgLinearGradient id={`grad_${nodeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientStart} />
              <Stop offset="100%" stopColor={gradientEnd} />
            </SvgLinearGradient>
          </Defs>
          
          {/* Outer border hexagon with gradient */}
          <Polygon
            points={hexPoints}
            fill={`url(#grad_${nodeId})`}
            stroke="#000"
            strokeWidth="3"
          />
          
          {/* Inner black hexagon (TimerButton style) */}
          <Polygon
            points="40,8 72,24 72,56 40,72 8,56 8,24"
            fill="#000"
            stroke="none"
          />
        </Svg>
        
        <View style={styles.hexContent}>
          <FontAwesome
            name={nodeInfo.icon as any}
            size={16}
            color={status.isCompleted ? '#39ff14' : status.isUnlocked ? '#4a9eff' : '#6a6a6a'}
          />
          <Text
            style={[
              styles.hexText,
              { 
                color: status.isCompleted ? '#39ff14' : status.isUnlocked ? '#4a9eff' : '#6a6a6a'
              }
            ]}
          >
            {nodeInfo.name}
          </Text>
        </View>

        {selectedNode === nodeId && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>{nodeInfo.name}</Text>
            <Text style={styles.tooltipText}>{nodeInfo.description}</Text>
            <Text style={styles.tooltipUnlock}>{nodeInfo.unlockText}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderProgressionTree = () => {
    return (
      <View style={styles.hexTreeContainer}>
        {/* Row 1: START */}
        <View style={styles.nodeRow}>
          {renderHexNode('START')}
        </View>
        
        {/* Row 2: ASSESSMENT */}
        <View style={styles.nodeRow}>
          {renderHexNode('ASSESSMENT')}
        </View>
        
        {/* Row 3: BASIC_STRENGTH and BASIC_CARDIO */}
        <View style={styles.nodeRow}>
          {renderHexNode('BASIC_STRENGTH')}
          <View style={styles.nodeSpacing} />
          {renderHexNode('BASIC_CARDIO')}
        </View>
        
        {/* Row 4: Specific exercises */}
        <View style={styles.nodeRow}>
          {renderHexNode('PUSH_UPS_10')}
          <View style={styles.nodeSpacing} />
          {renderHexNode('PLANK_1MIN')}
          <View style={styles.nodeSpacing} />
          {renderHexNode('SQUATS_10')}
        </View>
        
        {/* Row 5: YOGA_BASICS */}
        <View style={styles.nodeRow}>
          {renderHexNode('YOGA_BASICS')}
        </View>
        
        {/* Row 6: ADVANCED_STRENGTH */}
        <View style={styles.nodeRow}>
          {renderHexNode('ADVANCED_STRENGTH')}
        </View>
      </View>
    );
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>{t('progression')}</Text>
        
        <View style={[commonStyles.tile, styles.headerTile]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Your Fitness Journey</Text>
            <Text style={styles.subtitle}>
              Tap hexagons to see details!
            </Text>
            
            {/* Demo Toast Button */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => {
                const toastTypes = [
                  {
                    type: 'success',
                    message: 'Awesome! You just unlocked a new exercise!',
                    emoji: ''
                  },
                  {
                    type: 'error', 
                    message: 'Oops! Something went wrong. Please try again.',
                    emoji: ''
                  },
                  {
                    type: 'warning',
                    message: 'Next Level Unlocked!',
                    emoji: ''
                  },
                  {
                    type: 'info',
                    message: 'Tip: Stay hydrated during your workout!',
                    emoji: 'ℹ'
                  }
                ] as const;

                const currentToast = toastTypes[toastIndex % toastTypes.length];
                setToastIndex(prev => prev + 1);

                showToast({
                  type: currentToast.type,
                  message: currentToast.message,
                  duration: 4000,
                  position: 'center', // Changed to center to test vertical centering
                  showIcon: true,
                });
              }}
            >
              <FontAwesome name="magic" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Demo Toast</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[commonStyles.tile, styles.treeContainer]}>
          {renderProgressionTree()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTile: {
    width: '100%',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#f0f0f0',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 50,
  },
  treeContainer: {
    position: 'relative',
    height: 500, // Increased height for more nodes
    width: '100%',
    marginBottom: 20,
  },
  node: {
    position: 'absolute',
    width: 80,
    height: 80,
    zIndex: 2,
  },
  hexagonSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  nodeContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  nodeName: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tooltip: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 200,
    backgroundColor: '#2c2f33',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    zIndex: 10,
  },
  tooltipText: {
    color: '#f0f0f0',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  tooltipUnlock: {
    color: '#4a9eff',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nodeSpacing: {
    width: 20,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(64, 191, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#40bfff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  demoButtonText: {
    color: '#40bfff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  testContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  testNode: {
    backgroundColor: '#2c2f33',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#39ff14',
  },
  testText: {
    color: '#f0f0f0',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  hexTreeContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  nodeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  hexNode: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  hexContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  hexText: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});