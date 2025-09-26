import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { FontAwesome } from '@expo/vector-icons';

import commonStyles from '../styles';

// Data from six_complex.tsx
const { width: screenWidth } = Dimensions.get('window');

interface TreeNode {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'locked' | 'unlockable' | 'completed';
  children: string[];
  unlockConditions: Array<{ 
    requires: string[];
    pathName?: string;
  }>;
  position?: { x: number; y: number };
}

// Mock user stats - in a real app this would come from user data
const userStats = {
    totalWorkouts: 5, // Mock value for demonstration
    totalCalories: 1200, // Mock value
    hasProfile: true,
};

// Tree data structure with centered positioning
const centerX = screenWidth * 0.5;
const treeData: TreeNode[] = [
    {
      id: "INITIATE",
      name: "Initiate",
      icon: "user-plus",
      description: "Create your profile and initiate the connection.",
      status: userStats.hasProfile ? "completed" : "unlockable",
      children: ["ACCESS_GRID"],
      unlockConditions: [],
      position: { x: centerX, y: 120 }
    },
    {
      id: "ACCESS_GRID",
      name: "Assessment",
      icon: "clipboard",
      description: "Complete the initial fitness assessment to calibrate your journey.",
      status: userStats.totalWorkouts > 0 ? "completed" : "unlockable",
      children: ["FLEXIBILITY_PATH", "STRENGTH_PATH", "CORE_PATH"],
      unlockConditions: [{ requires: ["INITIATE"] }],
      position: { x: centerX, y: 250 }
    },
    {
      id: "FLEXIBILITY_PATH",
      name: "Flexibility",
      icon: "users",
      description: "Unlock basic flexibility routines.",
      status: userStats.totalWorkouts >= 2 ? "completed" : userStats.totalWorkouts > 0 ? "unlockable" : "locked",
      children: ["DYNAMIC_STRETCHING", "STATIC_STRETCHING"],
      unlockConditions: [{ requires: ["ACCESS_GRID"] }],
      position: { x: centerX - 120, y: 380 }
    },
    {
      id: "STRENGTH_PATH",
      name: "Strength",
      icon: "cog",
      description: "Engage foundational strength exercises.",
      status: userStats.totalWorkouts >= 3 ? "completed" : userStats.totalWorkouts > 0 ? "unlockable" : "locked",
      children: ["PUSHUPS_10", "SQUATS_10", "PULLUP_ASSIST"],
      unlockConditions: [{ requires: ["ACCESS_GRID"] }],
      position: { x: centerX, y: 380 }
    },
    {
      id: "CORE_PATH",
      name: "Core",
      icon: "fire",
      description: "Activate your core stability.",
      status: userStats.totalWorkouts >= 4 ? "completed" : userStats.totalWorkouts > 0 ? "unlockable" : "locked",
      children: ["PLANK_30S", "LEG_RAISES"],
      unlockConditions: [{ requires: ["ACCESS_GRID"] }],
      position: { x: centerX + 120, y: 380 }
    },
    {
      id: "DYNAMIC_STRETCHING",
      name: "Dynamic Flow",
      icon: "bolt",
      description: "Complete a 5-minute dynamic stretching routine.",
      status: userStats.totalWorkouts >= 5 ? "completed" : userStats.totalWorkouts >= 2 ? "unlockable" : "locked",
      children: ["YOGA_CORE"],
      unlockConditions: [{ requires: ["FLEXIBILITY_PATH"] }],
      position: { x: centerX - 150, y: 510 }
    },
    {
      id: "STATIC_STRETCHING",
      name: "Static Hold",
      icon: "pause",
      description: "Hold key stretches for 30 seconds each.",
      status: userStats.totalWorkouts >= 6 ? "completed" : userStats.totalWorkouts >= 2 ? "unlockable" : "locked",
      children: ["DEEP_STRETCH"],
      unlockConditions: [{ requires: ["FLEXIBILITY_PATH"] }],
      position: { x: centerX - 90, y: 510 }
    },
    {
      id: "PUSHUPS_10",
      name: "10 Push-ups",
      icon: "hand-rock-o",
      description: "Complete 10 consecutive push-ups.",
      status: userStats.totalWorkouts >= 7 ? "completed" : userStats.totalWorkouts >= 3 ? "unlockable" : "locked",
      children: ["PUSHUPS_25"],
      unlockConditions: [{ requires: ["STRENGTH_PATH"] }],
      position: { x: centerX - 30, y: 510 }
    },
    {
      id: "SQUATS_10",
      name: "10 Squats",
      icon: "male",
      description: "Complete 10 bodyweight squats with good form.",
      status: userStats.totalWorkouts >= 8 ? "completed" : userStats.totalWorkouts >= 3 ? "unlockable" : "locked",
      children: ["YOGA_CORE", "SQUATS_30"],
      unlockConditions: [{ requires: ["STRENGTH_PATH"] }],
      position: { x: centerX + 30, y: 510 }
    },
    {
      id: "PLANK_30S",
      name: "30s Plank",
      icon: "minus",
      description: "Hold a plank for 30 seconds.",
      status: userStats.totalWorkouts >= 9 ? "completed" : userStats.totalWorkouts >= 4 ? "unlockable" : "locked",
      children: ["YOGA_CORE", "CORE_CIRCUIT"],
      unlockConditions: [{ requires: ["CORE_PATH"] }],
      position: { x: centerX + 90, y: 510 }
    },
    {
      id: "YOGA_CORE",
      name: "Yoga Core",
      icon: "circle-o",
      description: "Unlock the fundamentals of Yoga, focusing on core engagement.",
      status: userStats.totalWorkouts >= 12 ? "completed" : userStats.totalWorkouts >= 8 ? "unlockable" : "locked",
      children: ["SUN_SALUTATION"],
      unlockConditions: [
        { pathName: "Flexibility Path", requires: ["DYNAMIC_STRETCHING"] },
        { pathName: "Strength & Core Path", requires: ["SQUATS_10", "PLANK_30S"] }
      ],
      position: { x: centerX - 60, y: 640 }
    },
    {
      id: "CORE_CIRCUIT",
      name: "Core Circuit",
      icon: "refresh",
      description: "Survive the first core burnout circuit.",
      status: userStats.totalWorkouts >= 15 ? "completed" : userStats.totalWorkouts >= 9 ? "unlockable" : "locked",
      children: ["ADVANCED_CORE"],
      unlockConditions: [{ requires: ["PLANK_30S"] }],
      position: { x: centerX + 120, y: 640 }
    },
    {
      id: "SUN_SALUTATION",
      name: "Sun Salutation",
      icon: "sun-o",
      description: "Master the full Sun Salutation yoga flow.",
      status: userStats.totalWorkouts >= 20 ? "completed" : userStats.totalWorkouts >= 15 ? "unlockable" : "locked",
      children: ["ADVANCED_YOGA"],
      unlockConditions: [{ requires: ["YOGA_CORE"] }],
      position: { x: centerX - 30, y: 770 }
    },
    {
      id: "ADVANCED_CORE",
      name: "Advanced Core",
      icon: "fire",
      description: "Unlock advanced core exercises like L-sits.",
      status: userStats.totalWorkouts >= 25 ? "completed" : userStats.totalWorkouts >= 20 ? "unlockable" : "locked",
      children: [],
      unlockConditions: [{ requires: ["CORE_CIRCUIT"] }],
      position: { x: centerX + 90, y: 770 }
    }
  ];

export default function ProgressionTreeScreen() {
  const { t } = useTranslation();
  const [treeNodes, setTreeNodes] = useState<Map<string, TreeNode>>(new Map());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    // Update node statuses based on unlock conditions
    const nodesMap = new Map(treeData.map(node => [node.id, { ...node }]));
    
    let changed = true;
    while (changed) {
      changed = false;
      for (const [nodeId, node] of nodesMap) {
        if (node.status === 'completed') continue;
        
        const canUnlock = node.unlockConditions.some(condition =>
          condition.requires.every(reqId => nodesMap.get(reqId)?.status === 'completed')
        );
        
        if (node.status === 'locked' || node.status === 'unlockable') {
          const newStatus = canUnlock ? 'unlockable' : 'locked';
          if (node.status !== newStatus) {
            node.status = newStatus as 'locked' | 'unlockable' | 'completed';
            changed = true;
          }
        }
      }
    }
    
    setTreeNodes(nodesMap);
  }, [userStats.totalWorkouts]);

  const getUnlockText = (node: TreeNode) => {
    if (node.status === 'completed') return 'Completed!';
    if (node.status === 'unlockable') return 'Available now!';
    
    if (node.unlockConditions) {
      const requirements = node.unlockConditions.map((condition) => {
        if (condition.requires) {
          return condition.requires.map(reqId => {
            const requiredNode = treeNodes.get(reqId);
            return `${requiredNode?.name || reqId}: ${requiredNode?.status === 'completed' ? '✓' : '✗'}`;
          }).join('\n');
        }
        return '';
      }).filter((req: string) => req).join('\n');
      return `Requirements:\n${requirements}`;
    }
    
    return 'Complete previous steps to unlock';
  };

  const renderHexNode = (node: TreeNode) => {
    const isLocked = node.status === 'locked';
  
    // Inner hexagon, radius ~70 (almost touching outer edges)
    const innerHexPoints = "70,10 122,46 122,94 70,130 18,94 18,46";

    return (
      <TouchableOpacity
        key={node.id}
        style={[ 
          styles.hexNode,
          { 
            opacity: isLocked ? 0.6 : 1,
          }
        ]}
        onPress={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
        disabled={isLocked}
      >
        <Svg width="140" height="140">
          
          {/* Inner black hexagon (TimerButton style) */}
          <Polygon
            points={innerHexPoints}
            fill='rgba(41, 57, 68, 1)'
            stroke={node.status === 'completed' ? '#39ff14' : node.status === 'unlockable' ? '#4a9eff' : '#6a6a6a'}
            strokeWidth={2}
          />
        </Svg>
        
        <View style={styles.hexContent}>
          <FontAwesome
            name={node.icon as any}
            size={24}
            color="#fff"
          />
          <Text
            style={[ 
              styles.hexText,
            ]}
          >
            {node.name}
          </Text>
        </View>

        {selectedNode === node.id && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>{node.name}</Text>
            <Text style={styles.tooltipText}>{node.description}</Text>
            <Text style={styles.tooltipUnlock}>{getUnlockText(node)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderProgressionTree = () => {
    const nodes = Array.from(treeNodes.values());
    if (nodes.length > 0) {
      // Group components into rows of 2
      const cols = 2;
      const rows: any[] = [];
      for (let i = 0; i < nodes.length; i += cols) {
        rows.push(nodes.slice(i, i + cols));
      }
      return (
        <View style={styles.hexTreeContainer}>
          {rows.map((row, rIdx) => (
            <View key={`row_${rIdx}`} style={styles.nodeRow}>
              {row.map((node: TreeNode, cIdx: number) => (
                <View key={`${rIdx}_node_${cIdx}`} style={{ marginHorizontal: 8, marginVertical:-5 }}>
                  {renderHexNode(node)}
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.outerContainer, { maxHeight: 200 }]}>
        <Text style={commonStyles.tileTitle}>{t('progression')}</Text>
        <View style={[commonStyles.tile, styles.headerTile]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Your Fitness Journey</Text>
            <Text style={styles.subtitle}>
              Total Workouts: {userStats.totalWorkouts} | Progress your skills!
            </Text>
          </View>
        </View>
      </View>
      
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
    alignItems: 'center',
  },
  nodeRow: {
    flexDirection: 'row',
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
});
