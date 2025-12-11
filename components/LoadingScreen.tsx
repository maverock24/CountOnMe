import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Strict Color Palette - Sci-Fi HUD Design System (matching MotivationalToast)
const COLORS = {
  void: '#050810',
  surface: '#0B1221',
  surfaceAlpha: 'rgba(11, 18, 33, 0.85)',
  primary: '#00F0FF',
  secondary: '#005577',
  highlight: '#FFFFFF',
  glow: 'rgba(0, 240, 255, 0.6)',
  glowStrong: 'rgba(0, 240, 255, 0.8)',
  glowWeak: 'rgba(0, 240, 255, 0.4)',
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
  const [isRendered, setIsRendered] = useState(true);
  const animValues = useRef({
    opacity: new Animated.Value(1),
    scale: new Animated.Value(1),
    borderGlow: new Animated.Value(0.3),
    scanLineY: new Animated.Value(-20),
    shimmerX: new Animated.Value(-CONTAINER_WIDTH),
    nodePulse: new Animated.Value(0.3),
    gaugeRotation: new Animated.Value(0),
    textOpacity: new Animated.Value(0.5),
    progressWidth: new Animated.Value(0),
    glowIntensity: new Animated.Value(0.4),
  }).current;

  const loopAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      animValues.opacity.setValue(1);
      startAnimations();
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

    // Shimmer effect
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.shimmerX, { toValue: CONTAINER_WIDTH * 2, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(animValues.shimmerX, { toValue: -CONTAINER_WIDTH, duration: 0, useNativeDriver: true }),
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
      shimmerLoop,
      gaugeLoop,
      nodePulseLoop,
      textPulseLoop,
      progressLoop,
      glowPulseLoop,
    ];

    borderGlowLoop.start();
    setTimeout(() => scanLineLoop.start(), 100);
    setTimeout(() => shimmerLoop.start(), 200);
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

  if (!isRendered) {
    return null;
  }

  const chamferedPath = generateChamferedPath(CONTAINER_WIDTH, CONTAINER_HEIGHT, CHAMFER_SIZE);

  return (
    <Animated.View style={[styles.overlay, { opacity: animValues.opacity }]}>
      <View style={styles.container}>
        {/* Main loading card */}
        <View style={styles.cardWrapper}>
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
              { opacity: animValues.borderGlow },
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
              { transform: [{ translateY: animValues.scanLineY }] },
            ]}
            pointerEvents="none"
          />

          {/* Shimmer effect */}
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: animValues.shimmerX }, { rotate: '20deg' }] },
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
            <View style={styles.labelLine} />
            <Animated.Text style={[styles.labelText, { opacity: animValues.textOpacity }]}>
              SYSTEM STATUS
            </Animated.Text>
            <View style={styles.labelLine} />
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
            <Animated.Text style={[styles.messageText, { opacity: animValues.textOpacity }]}>
              {message}
            </Animated.Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
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
            <Animated.Text style={[styles.statusText, { opacity: animValues.textOpacity }]}>
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
    backgroundColor: COLORS.void,
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.glow,
  },
  borderGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.5,
  },
  shimmer: {
    position: 'absolute',
    width: 50,
    height: '300%',
    backgroundColor: COLORS.highlight,
    opacity: 0.08,
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
    backgroundColor: COLORS.secondary,
    opacity: 0.5,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.primary,
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
    color: COLORS.highlight,
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
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
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
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
});
