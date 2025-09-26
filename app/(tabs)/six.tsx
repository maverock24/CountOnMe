import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import CustomPicker from '@/components/CustomPicker';
import { useToast } from '../../components/ToastProvider';
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

const glowColor = '#40bfff'; // Use your preferred glow color

export default function ProgressionTreeScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedProgression, setSelectedProgression] = useState<string>(progressionsList?.[0]?.name ?? '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  
    // Inner hexagon, radius ~70 (almost touching outer edges)
    const innerHexPoints = "70,10 122,46 122,94 70,130 18,94 18,46";

    return (
      <TouchableOpacity
        key={nodeId}
        style={[
          styles.hexNode,
          {
            opacity: !status.isUnlocked ? 0.6 : 1,
          }
        ]}
      
      >
        <Svg width="140" height="140">
          
          {/* Inner black hexagon (TimerButton style) */}
          <Polygon
            points={innerHexPoints}
            fill='rgba(41, 57, 68, 1)'
            stroke="#00bcd4"
            strokeWidth={2}
          />
        </Svg>
        
        <View style={styles.hexContent}>
          <Text
            style={[
              styles.hexText,
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
    // If a progression is selected from the dropdown, render its components as nodes
    const chosen = selectedProgression ? progressionsList.find((p) => p.name === selectedProgression) : null;

    if (chosen && Array.isArray(chosen.components) && chosen.components.length > 0) {
      // Group components into rows of 4
      const cols = 4;
      const rows: any[] = [];
      for (let i = 0; i < chosen.components.length; i += cols) {
        rows.push(chosen.components.slice(i, i + cols));
      }
      return (
        <View style={styles.hexTreeContainer}>
          {rows.map((row, rIdx) => (
            <View key={`row_${rIdx}`} style={styles.nodeRow}>
              {row.map((comp: any, cIdx: number) => (
                <View style={{ flexDirection: 'row' }} key={`col_${cIdx}`}>
                  <View key={`${rIdx}_node_${cIdx}`} style={{ marginHorizontal: 8, marginVertical:-5 }}>
                    {renderHexNode(comp.component)}
                  </View>
                  <View key={`${rIdx}_text_${cIdx}`} style={{ marginHorizontal: -10, marginTop: 0, width: 220, height: 160 }}>
                    <Text style={{ color: '#fff', fontSize: 14, textAlign: 'left', justifyContent: 'flex-start', marginTop: 4 }}>
                      {getNodeDisplayInfo(comp.component).description || comp.description || ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.outerContainer, { maxHeight: 200 }]}>
        <Text style={commonStyles.tileTitle}>{t('Selected Progression')}</Text>
        {/* Progression selector dropdown - now uses ModalPicker */}
       <View style={[commonStyles.tile, { flex: 1, padding: 10 }]}> 
          <CustomPicker
            items={progressionsList.map((p) => ({ label: p.name, value: p.name }))}
            selectedValue={selectedProgression}
            onValueChange={(itemValue) => setSelectedProgression(itemValue)}
               dropdownIconColor="#fff"
            style={{ width: '95%', height: 40 }}
          />
           <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', padding: 10 }}>
          <Text style={{ color: 'white' }}>{progressionsList.find((p) => p.name === selectedProgression)?.description}</Text>
        </View>
        </View>

      </View>
      

            {/* Demo Toast Button */}
            {/* <TouchableOpacity
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
                });
              }}
            >
              <FontAwesome name="magic" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Demo Toast</Text>
            </TouchableOpacity> */}

        {/* Add ScrollView for progression tree */}
        <View style={[commonStyles.tile, { flex: 1, padding: 5 }]}> 
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {renderProgressionTree()}
          </ScrollView>
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
    paddingBottom: 10,
  },
  treeContainer: {
    width: '100%',
    marginBottom: 0,
    zIndex: 0,
  },
  hexTreeContainer: {
    flex: 1,
    marginLeft: -25,
    alignItems: 'flex-start',
  },
  nodeRow: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: 8,
  },
  hexNode: {
    position: 'relative',
    width: 140,
    height: 140,
  },
  hexContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
  },
  hexText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 110,
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
  dropdownToggle: {
    width: '90%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2E33',
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#EFF0F0',
    fontSize: 14,
  },
  dropdownList: {
    position: 'absolute',
    marginTop: 8,
    width: '90%',
    maxHeight: 220,
    backgroundColor: 'rgba(17,24,30,0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2E33',
    zIndex: 9999,
    alignItems: 'center', // Center items horizontally
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2E33',
    backgroundColor: 'rgba(17,24,30,0.95)',
  },
  dropdownItemHover: {
    backgroundColor: '#40bfff',
  },
  dropdownItemText: {
    color: '#EFF0F0',
    fontSize: 14,
  },
  dropdownItemTextHover: {
    color: '#fff',
    fontWeight: 'bold',
  },
});