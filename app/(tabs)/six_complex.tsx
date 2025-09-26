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
import Svg, { Defs, Line, Polygon, Stop, LinearGradient as SvgLinearGradient, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

import commonStyles from '../styles';

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

const initialTreeData: TreeNode[] = [
    {
      id: "INITIATE",
      name: "Initiate",
      icon: "user-plus",
      description: "Create your profile and initiate the connection.",
      status: "completed",
      children: ["ACCESS_GRID"],
      unlockConditions: [],
    },
    {
      id: "ACCESS_GRID",
      name: "Assessment",
      icon: "clipboard",
      description: "Complete the initial fitness assessment to calibrate your journey.",
      status: "completed",
      children: ["FLEXIBILITY_PATH", "STRENGTH_PATH", "CORE_PATH"],
      unlockConditions: [{ requires: ["INITIATE"] }],
    },
    {
      id: "FLEXIBILITY_PATH",
      name: "Flexibility",
      icon: "users",
      description: "Unlock basic flexibility routines.",
      status: "completed",
      children: ["DYNAMIC_STRETCHING", "STATIC_STRETCHING"],
      unlockConditions: [{ requires: ["ACCESS_GRID"] }],
    },
    {
      id: "STRENGTH_PATH",
      name: "Strength",
      icon: "cog",
      description: "Engage foundational strength exercises.",
      status: "completed",
      children: ["PUSHUPS_10", "SQUATS_10"],
      unlockConditions: [{ requires: ["ACCESS_GRID"] }],
    },
    {
      id: "CORE_PATH",
      name: "Core",
      icon: "fire",
      description: "Activate your core stability.",
      status: "completed",
      children: ["PLANK_30S"],
      unlockConditions: [{ requires: ["ACCESS_GRID"] }],
    },
    {
      id: "DYNAMIC_STRETCHING",
      name: "Dynamic Flow",
      icon: "bolt",
      description: "Complete a 5-minute dynamic stretching routine.",
      status: "completed",
      children: ["YOGA_CORE"],
      unlockConditions: [{ requires: ["FLEXIBILITY_PATH"] }],
    },
    {
      id: "STATIC_STRETCHING",
      name: "Static Hold",
      icon: "pause",
      description: "Hold key stretches for 30 seconds each.",
      status: "unlockable",
      children: [],
      unlockConditions: [{ requires: ["FLEXIBILITY_PATH"] }],
    },
    {
      id: "PUSHUPS_10",
      name: "10 Push-ups",
      icon: "hand-rock-o",
      description: "Complete 10 consecutive push-ups.",
      status: "unlockable",
      children: [],
      unlockConditions: [{ requires: ["STRENGTH_PATH"] }],
    },
    {
      id: "SQUATS_10",
      name: "10 Squats",
      icon: "male",
      description: "Complete 10 bodyweight squats with good form.",
      status: "unlockable",
      children: ["YOGA_CORE"],
      unlockConditions: [{ requires: ["STRENGTH_PATH"] }],
    },
    {
      id: "PLANK_30S",
      name: "30s Plank",
      icon: "minus",
      description: "Hold a plank for 30 seconds.",
      status: "unlockable",
      children: ["YOGA_CORE", "CORE_CIRCUIT"],
      unlockConditions: [{ requires: ["CORE_PATH"] }],
    },
    {
      id: "YOGA_CORE",
      name: "Yoga Core",
      icon: "circle-o",
      description: "Unlock the fundamentals of Yoga, focusing on core engagement.",
      status: "locked",
      children: ["SUN_SALUTATION"],
      unlockConditions: [
        { pathName: "Flexibility Path", requires: ["DYNAMIC_STRETCHING"] },
        { pathName: "Strength & Core Path", requires: ["SQUATS_10", "PLANK_30S"] }
      ],
    },
    {
      id: "CORE_CIRCUIT",
      name: "Core Circuit",
      icon: "refresh",
      description: "Survive the first core burnout circuit.",
      status: "locked",
      children: ["ADVANCED_CORE"],
      unlockConditions: [{ requires: ["PLANK_30S"] }],
    },
    {
      id: "SUN_SALUTATION",
      name: "Sun Salutation",
      icon: "sun-o",
      description: "Master the full Sun Salutation yoga flow.",
      status: "locked",
      children: [],
      unlockConditions: [{ requires: ["YOGA_CORE"] }],
    },
    {
      id: "ADVANCED_CORE",
      name: "Advanced Core",
      icon: "fire",
      description: "Unlock advanced core exercises like L-sits.",
      status: "locked",
      children: [],
      unlockConditions: [{ requires: ["CORE_CIRCUIT"] }],
    }
  ];

const assignLayers = (data: TreeNode[]): { [key: string]: number } => {
  const layers: { [key: string]: number } = {};
  const nodeMap = new Map(data.map(node => [node.id, node]));
  const memo: { [key: string]: number } = {};

  const getLayer = (nodeId: string): number => {
    if (memo[nodeId] !== undefined) {
      return memo[nodeId];
    }

    const node = nodeMap.get(nodeId);
    if (!node || node.unlockConditions.length === 0 || node.unlockConditions[0].requires.length === 0) {
      memo[nodeId] = 0;
      return 0;
    }

    let maxLayer = 0;
    for (const condition of node.unlockConditions) {
      for (const parentId of condition.requires) {
        const parentLayer = getLayer(parentId);
        if (parentLayer + 1 > maxLayer) {
          maxLayer = parentLayer + 1;
        }
      }
    }
    memo[nodeId] = maxLayer;
    return maxLayer;
  };

  for (const node of data) {
    layers[node.id] = getLayer(node.id);
  }

  return layers;
};

const calculateNodePositions = (data: TreeNode[], screenWidth: number): TreeNode[] => {
  const dataWithPositions = [...data];
  const layers = assignLayers(data);
  const nodesByLayer: { [key: number]: string[] } = {};

  for (const nodeId in layers) {
    const layer = layers[nodeId];
    if (!nodesByLayer[layer]) {
      nodesByLayer[layer] = [];
    }
    nodesByLayer[layer].push(nodeId);
  }

  const yOffset = 150;
  const xOffset = 120;

  for (const layer in nodesByLayer) {
    const levelNodes = nodesByLayer[layer];
    const y = parseInt(layer) * yOffset + 100;
    const levelWidth = (levelNodes.length - 1) * xOffset;
    const startX = (screenWidth - levelWidth) / 2;

    levelNodes.forEach((nodeId, index) => {
      const node = dataWithPositions.find(n => n.id === nodeId);
      if (node) {
        node.position = {
          x: startX + index * xOffset,
          y: y,
        };
      }
    });
  }

  return dataWithPositions;
};

export default function ProgressionTreeScreen() {
  const { t } = useTranslation();
  const [treeNodes, setTreeNodes] = useState<Map<string, TreeNode>>(new Map());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    const positionedData = calculateNodePositions(initialTreeData, screenWidth);
    const nodesMap = new Map(positionedData.map(node => [node.id, { ...node }]));
    setTreeNodes(nodesMap);
  }, []);

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
            y1={node.position.y + 40} // Adjusted for NODE_SIZE
            x2={childNode.position.x}
            y2={childNode.position.y - 40} // Adjusted for NODE_SIZE
            stroke={strokeColor}
            strokeWidth="2"
            opacity={0.8}
            strokeLinecap="round"
          />
        );
      });
    });

    return lines;
  };

  const NODE_SIZE = 80;

  const renderNode = (node: TreeNode) => {
    if (!node.position) return null;

    const isLocked = node.status === 'locked';
    const hexPoints = `${NODE_SIZE/2},5 ${NODE_SIZE-5},${NODE_SIZE*0.275} ${NODE_SIZE-5},${NODE_SIZE*0.725} ${NODE_SIZE/2},${NODE_SIZE-5} 5,${NODE_SIZE*0.725} 5,${NODE_SIZE*0.275}`;

    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.node,
          {
            left: node.position.x - NODE_SIZE/2,
            top: node.position.y - NODE_SIZE/2,
            width: NODE_SIZE,
            height: NODE_SIZE,
            opacity: isLocked ? 0.5 : 1,
          }
        ]}
        onPress={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
        disabled={isLocked}
      >
        <Svg width={NODE_SIZE} height={NODE_SIZE}>
          <Polygon
            points={hexPoints}
            fill='rgba(41, 57, 68, 1)'
            stroke={node.status === 'completed' ? '#39ff14' : node.status === 'unlockable' ? '#4a9eff' : '#6a6a6a'}
            strokeWidth={2}
          />
        </Svg>
        
        <View style={styles.nodeContent}>
          <FontAwesome
            name={node.icon as any}
            size={20}
            color="#fff"
          />
          <Text style={styles.nodeName}>{node.name}</Text>
        </View>
        
        {selectedNode === node.id && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>{node.name}</Text>
            <Text style={styles.tooltipText}>{node.description}</Text>
            {node.unlockConditions.length > 0 && (
              <Text style={styles.requirementsText}>
                Requirements: {node.unlockConditions.map(c => c.requires.join(', ')).join(' & ')}
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
              Progress your skills!
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
              {renderConnectionLines()}
            </Svg>
            <View style={{ position: 'absolute', top: 0, left: 0, width: screenWidth, height: 900 }}>
              {Array.from(treeNodes.values()).map(renderNode)}
            </View>
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
    zIndex: 2,
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
    color: '#fff',
    textTransform: 'uppercase',
  },
  tooltip: {
    position: 'absolute',
    top: -90,
    left: -60,
    width: 200,
    backgroundColor: '#2c2f33',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    zIndex: 10,
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
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