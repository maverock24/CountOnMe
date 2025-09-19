import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Defs, Line, LinearGradient as SvgLinearGradient, Polygon, Stop } from 'react-native-svg';

import Colors from '@/constants/Colors';
import commonStyles from '../styles';

// Import achievement system
let useAchievements: any = null;
try {
  const achievementModule = require('@/components/achievements/provider');
  useAchievements = achievementModule.useAchievements;
} catch (error) {
  console.log('Achievement system not available in progression tree');
}

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

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressionTreeScreen() {
  const { t } = useTranslation();
  const [treeNodes, setTreeNodes] = useState<Map<string, TreeNode>>(new Map());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Optional achievement tracking
  let achievementTracker: any = null;
  try {
    if (useAchievements) {
      achievementTracker = useAchievements();
    }
  } catch (error) {
    console.log('Achievement tracking not available');
  }

  useEffect(() => {
    // Track progression tree visit
    if (achievementTracker?.trackFeatureUsage) {
      achievementTracker.trackFeatureUsage('progression_tree').catch((error: any) => 
        console.log('Achievement tracking error:', error)
      );
    }
  }, [achievementTracker]);

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

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'completed': return '#39ff14'; // Neon green
      case 'unlockable': return '#ffffff'; // White
      case 'locked': return '#6a6a6a'; // Gray
      default: return '#6a6a6a';
    }
  };

  const getNodeBackground = (status: string): [string, string] => {
    switch (status) {
      case 'completed': return ['#39ff14', '#2ecc71'];
      case 'unlockable': return ['#ffffff', '#ecf0f1'];
      case 'locked': return ['#2c2f33', '#34495e'];
      default: return ['#2c2f33', '#34495e'];
    }
  };

  const renderConnectionLines = () => {
    const lines: JSX.Element[] = [];
    let lineKey = 0;

    treeNodes.forEach((node) => {
      if (node.children.length === 0) return;

      node.children.forEach((childId) => {
        const childNode = treeNodes.get(childId);
        if (!childNode || !node.position || !childNode.position) return;

        const parentCompleted = node.status === 'completed';
        const strokeColor = parentCompleted ? '#39ff14' : '#4a4a4a';

        lines.push(
          <Line
            key={`line-${lineKey++}`}
            x1={node.position.x}
            y1={node.position.y + 35}
            x2={childNode.position.x}
            y2={childNode.position.y - 35}
            stroke={strokeColor}
            strokeWidth="3"
            opacity={0.8}
          />
        );
      });
    });

    return lines;
  };

  const renderNode = (node: TreeNode) => {
    if (!node.position) return null;

    const nodeColors = getNodeBackground(node.status);
    const isLocked = node.status === 'locked';

    // Hexagon points for a 100x100 hexagon
    const hexPoints = "50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5";

    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.node,
          {
            left: node.position.x - 50,
            top: node.position.y - 50,
            opacity: isLocked ? 0.5 : 1,
          }
        ]}
        onPress={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
        disabled={isLocked}
      >
        <Svg width="100" height="100" style={styles.hexagonSvg}>
          <Defs>
            <SvgLinearGradient id={`hexGrad-${node.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={nodeColors[0]} stopOpacity="1" />
              <Stop offset="100%" stopColor={nodeColors[1]} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Polygon
            points={hexPoints}
            fill={`url(#hexGrad-${node.id})`}
            stroke={node.status === 'completed' ? '#39ff14' : node.status === 'unlockable' ? '#ffffff' : '#6a6a6a'}
            strokeWidth="2"
          />
        </Svg>
        
        <View style={styles.nodeContent}>
          <FontAwesome
            name={node.icon as any}
            size={18}
            color={node.status === 'completed' ? '#1a1d21' : node.status === 'unlockable' ? '#1a1d21' : '#ffffff'}
          />
          <Text
            style={[
              styles.nodeName,
              {
                color: node.status === 'completed' ? '#1a1d21' : node.status === 'unlockable' ? '#1a1d21' : '#ffffff'
              }
            ]}
          >
            {node.name}
          </Text>
        </View>
        
        {selectedNode === node.id && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{node.description}</Text>
            {node.unlockConditions.length > 0 && (
              <Text style={styles.requirementsText}>
                Requirements: {node.unlockConditions[0].requires.join(', ')}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
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
              Total Workouts: {userStats.totalWorkouts} | Progress your skills!
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.treeContainer}>
            <Svg style={styles.svgOverlay} width={screenWidth} height={900}>
              <Defs>
                <SvgLinearGradient id="connectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#39ff14" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              {renderConnectionLines()}
            </Svg>
            
            {Array.from(treeNodes.values()).map(renderNode)}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d21',
  },
  headerTile: {
    width: '100%',
    marginBottom: 10,
  },
  headerContent: {
    alignItems: 'center',
    padding: 15,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    fontSize: 12,
    color: '#f0f0f0',
    opacity: 0.8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  treeContainer: {
    position: 'relative',
    height: 900,
    width: '100%',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  node: {
    position: 'absolute',
    width: 100,
    height: 100,
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
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tooltip: {
    position: 'absolute',
    top: -90,
    left: -50,
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
    marginBottom: 4,
  },
  requirementsText: {
    color: '#6a6a6a',
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});