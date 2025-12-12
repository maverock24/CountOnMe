import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from './ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper to create glow color variants from a base color
const createGlowVariants = (baseColor: string) => {
  let r = 0, g = 240, b = 255; // default cyan
  if (baseColor.startsWith('#')) {
    const hex = baseColor.slice(1);
    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
  } else if (baseColor.startsWith('rgb')) {
    const match = baseColor.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    }
  }
  return {
    glow: `rgba(${r}, ${g}, ${b}, 0.6)`,
    glowStrong: `rgba(${r}, ${g}, ${b}, 0.8)`,
    glowWeak: `rgba(${r}, ${g}, ${b}, 0.4)`,
  };
};

const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);
const CONTAINER_HEIGHT = 180;
const CHAMFER_SIZE = 24;

const generateChamferedPath = (width: number, height: number, chamfer: number): string => {
  return `
    M ${chamfer} 0
    L ${width - chamfer} 0
    L ${width} ${chamfer}
    L ${width} ${height - chamfer}
    L ${width - chamfer} ${height}
    L ${chamfer} ${height}
    L 0 ${height - chamfer}
    L 0 ${chamfer}
    Z
  `;
};

const CIRCUIT_NODES = [
  { x: CHAMFER_SIZE, y: 0 },
  { x: CONTAINER_WIDTH - CHAMFER_SIZE, y: 0 },
  { x: CONTAINER_WIDTH, y: CHAMFER_SIZE },
  { x: CONTAINER_WIDTH, y: CONTAINER_HEIGHT - CHAMFER_SIZE },
  { x: CONTAINER_WIDTH - CHAMFER_SIZE, y: CONTAINER_HEIGHT },
  { x: CHAMFER_SIZE, y: CONTAINER_HEIGHT },
  { x: 0, y: CONTAINER_HEIGHT - CHAMFER_SIZE },
  { x: 0, y: CHAMFER_SIZE },
];

interface LoadingScreenProps {
  visible: boolean;
  message?: string;
}

export default function LoadingScreen({ visible, message = 'INITIALIZING SYSTEM' }: LoadingScreenProps) {
  const { theme } = useTheme();
  const [isRendered, setIsRendered] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Dynamic colors based on theme
  const COLORS = useMemo(() => {
    const glowVariants = createGlowVariants(theme.colors.glow);
    return {
      void: theme.colors.void,
      surface: theme.colors.surface,
      surfaceAlpha: `${theme.colors.surface}DD`,
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      highlight: theme.colors.textPrimary,
      ...glowVariants,
    };
  }, [theme]);
  const animValues = useRef({
    opacity: new Animated.Value(1),
    scale: new Animated.Value(1),
    borderGlow: new Animated.Value(0.3),
    scanLineY: new Animated.Value(-20),
    nodePulse: new Animated.Value(0.3),
    gaugeRotation: new Animated.Value(0),
    textOpacity: new Animated.Value(0.5),
    progressWidth: new Animated.Value(0),
    glowIntensity: new Animated.Value(0.4),
  }).current;

  const loopAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (visible) {
      // Reset animation values to initial state
      animValues.opacity.setValue(1);
      animValues.borderGlow.setValue(0.3);
      animValues.scanLineY.setValue(-20);
      animValues.nodePulse.setValue(0.3);
      animValues.gaugeRotation.setValue(0);
      animValues.textOpacity.setValue(0.5);
      animValues.progressWidth.setValue(0);
      animValues.glowIntensity.setValue(0.4);

      // Wait for next frame to ensure animations are reset before showing
      requestAnimationFrame(() => {
        setIsRendered(true);
        setIsReady(true);
        startAnimations();
      });
    } else {
      // Fade out
      Animated.timing(animValues.opacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        stopAnimations();
        setIsRendered(false);
        setIsReady(false);
      });
    }

    return () => {
      stopAnimations();
    };
  }, [visible]);

  const startAnimations = () => {
    // Border glow pulsing
    const borderGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.borderGlow, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(animValues.borderGlow, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );

    // Scan line sweep
    const scanLineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.scanLineY, { toValue: CONTAINER_HEIGHT + 20, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(animValues.scanLineY, { toValue: -20, duration: 0, useNativeDriver: true }),
      ])
    );

    // Gauge rotation
    const gaugeLoop = Animated.loop(
      Animated.timing(animValues.gaugeRotation, { toValue: 360, duration: 2500, easing: Easing.linear, useNativeDriver: true })
    );

    // Node pulse
    const nodePulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.nodePulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(animValues.nodePulse, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );

    // Text opacity pulse
    const textPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(animValues.textOpacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ])
    );

    // Progress bar animation (indeterminate)
    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.progressWidth, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(animValues.progressWidth, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );

    // Glow intensity
    const glowPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.glowIntensity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(animValues.glowIntensity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );

    loopAnimationsRef.current = [
      borderGlowLoop,
      scanLineLoop,
      gaugeLoop,
      nodePulseLoop,
      textPulseLoop,
      progressLoop,
      glowPulseLoop,
    ];

    borderGlowLoop.start();
    setTimeout(() => scanLineLoop.start(), 100);
    gaugeLoop.start();
    nodePulseLoop.start();
    textPulseLoop.start();
    progressLoop.start();
    setTimeout(() => glowPulseLoop.start(), 150);
  };

  const stopAnimations = () => {
    loopAnimationsRef.current.forEach(anim => anim.stop());
    loopAnimationsRef.current = [];
  };

  if (!isRendered || !isReady) {
    return null;
  }

  const chamferedPath = generateChamferedPath(CONTAINER_WIDTH, CONTAINER_HEIGHT, CHAMFER_SIZE);

  return (
    <Animated.View style={[styles.overlay, { opacity: animValues.opacity, backgroundColor: COLORS.void }]}>
      <View style={styles.container}>
        {/* Main loading card */}
        <View style={[styles.cardWrapper, { shadowColor: COLORS.primary }]}>
          {/* Background with glass effect */}
          <Svg width={CONTAINER_WIDTH} height={CONTAINER_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="loadingBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={COLORS.surface} stopOpacity="0.95" />
                <Stop offset="50%" stopColor={COLORS.void} stopOpacity="0.98" />
                <Stop offset="100%" stopColor={COLORS.surface} stopOpacity="0.95" />
              </LinearGradient>
              <LinearGradient id="loadingBorderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={COLORS.secondary} stopOpacity="0.5" />
                <Stop offset="50%" stopColor={COLORS.primary} stopOpacity="1" />
                <Stop offset="100%" stopColor={COLORS.secondary} stopOpacity="0.5" />
              </LinearGradient>
            </Defs>
            <Path d={chamferedPath} fill="url(#loadingBgGradient)" />
            <Path d={chamferedPath} fill="none" stroke="url(#loadingBorderGradient)" strokeWidth="1" />
          </Svg>

          {/* Circuit nodes */}
          <Svg width={CONTAINER_WIDTH} height={CONTAINER_HEIGHT} style={StyleSheet.absoluteFill}>
            <G>
              {CIRCUIT_NODES.map((node, index) => (
                <Circle
                  key={index}
                  cx={node.x}
                  cy={node.y}
                  r={3}
                  fill={COLORS.primary}
                  opacity={0.8}
                />
              ))}
            </G>
          </Svg>

          {/* Animated glow layer */}
          <Animated.View
            style={[
              styles.glowLayer,
              {
                backgroundColor: COLORS.glow,
                opacity: animValues.glowIntensity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.2],
                }),
              },
            ]}
          />

          {/* Animated border glow */}
          <Animated.View
            style={[
              styles.borderGlowContainer,
              { opacity: animValues.borderGlow, shadowColor: COLORS.primary },
            ]}
          >
            <Svg width={CONTAINER_WIDTH} height={CONTAINER_HEIGHT}>
              <Path d={chamferedPath} fill="none" stroke={COLORS.primary} strokeWidth="2" />
            </Svg>
          </Animated.View>

          {/* Scan line effect */}
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: animValues.scanLineY }], backgroundColor: COLORS.primary },
            ]}
            pointerEvents="none"
          />

          {/* Corner gauges */}
          <View style={[styles.cornerGauge, styles.cornerGaugeLeft]}>
            <Animated.View
              style={{
                transform: [{
                  rotate: animValues.gaugeRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              }}
            >
              <Svg width={36} height={36}>
                <Circle cx={18} cy={18} r={15} fill="none" stroke={COLORS.secondary} strokeWidth={2} />
                <Circle cx={18} cy={18} r={15} fill="none" stroke={COLORS.primary} strokeWidth={2} strokeDasharray="30 64" strokeLinecap="round" />
                <Circle cx={18} cy={18} r={5} fill={COLORS.primary} />
              </Svg>
            </Animated.View>
          </View>

          <View style={[styles.cornerGauge, styles.cornerGaugeRight]}>
            <Animated.View
              style={{
                transform: [{
                  rotate: animValues.gaugeRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['360deg', '0deg'],
                  }),
                }],
              }}
            >
              <Svg width={36} height={36}>
                <Circle cx={18} cy={18} r={15} fill="none" stroke={COLORS.secondary} strokeWidth={2} />
                <Circle cx={18} cy={18} r={15} fill="none" stroke={COLORS.primary} strokeWidth={2} strokeDasharray="45 49" strokeLinecap="round" />
                <Circle cx={18} cy={18} r={5} fill={COLORS.primary} />
              </Svg>
            </Animated.View>
          </View>

          {/* Top label */}
          <View style={styles.topLabel}>
            <View style={[styles.labelLine, { backgroundColor: COLORS.secondary }]} />
            <Animated.Text style={[styles.labelText, { opacity: animValues.textOpacity, color: COLORS.primary }]}>
              SYSTEM STATUS
            </Animated.Text>
            <View style={[styles.labelLine, { backgroundColor: COLORS.secondary }]} />
          </View>

          {/* Main content */}
          <View style={styles.content}>
            {/* Loading spinner */}
            <Animated.View
              style={{
                transform: [{
                  rotate: animValues.gaugeRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              }}
            >
              <Svg width={50} height={50}>
                <Circle cx={25} cy={25} r={20} fill="none" stroke={COLORS.secondary} strokeWidth={3} />
                <Circle cx={25} cy={25} r={20} fill="none" stroke={COLORS.primary} strokeWidth={3} strokeDasharray="40 86" strokeLinecap="round" />
              </Svg>
            </Animated.View>

            {/* Message */}
            <Animated.Text style={[styles.messageText, { opacity: animValues.textOpacity, color: COLORS.highlight }]}>
              {message}
            </Animated.Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: COLORS.secondary }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: COLORS.primary,
                      width: animValues.progressWidth.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Bottom status */}
          <View style={styles.bottomStatus}>
            <Animated.Text style={[styles.statusText, { opacity: animValues.textOpacity, color: COLORS.primary }]}>
              {'>>>'} LOADING {'<<<'}
            </Animated.Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  borderGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.5,
  },
  cornerGauge: {
    position: 'absolute',
  },
  cornerGaugeLeft: {
    left: 8,
    top: '50%',
    marginTop: -18,
  },
  cornerGaugeRight: {
    right: 8,
    top: '50%',
    marginTop: -18,
  },
  topLabel: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: CHAMFER_SIZE + 10,
  },
  labelLine: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 8,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 12,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  progressContainer: {
    width: CONTAINER_WIDTH * 0.6,
    marginTop: 15,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottomStatus: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
});
