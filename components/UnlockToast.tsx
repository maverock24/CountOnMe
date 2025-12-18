import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from './ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface UnlockToastConfig {
  exerciseName: string;
  duration?: number;
  onDismiss?: () => void;
}

interface UnlockToastProps extends UnlockToastConfig {
  visible: boolean;
  onHide: () => void;
}

// Node dimensions - matching progression tree style
const NODE_WIDTH = 280;
const NODE_HEIGHT = 70;
const NODE_BORDER_RADIUS = 12;

// Container dimensions
const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH * 0.92, 380);
const CONTAINER_HEIGHT = 180;

export default function UnlockToast({
  visible,
  exerciseName,
  duration = 6000, // Longer duration for unlock toast
  onHide,
}: UnlockToastProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Animation values
  const animValues = useRef({
    // Container animations
    containerOpacity: new Animated.Value(0),
    containerScale: new Animated.Value(0.8),
    containerTranslateY: new Animated.Value(-50),

    // Node unlock transition animations
    nodeOpacity: new Animated.Value(0),
    nodeBorderColor: new Animated.Value(0), // 0 = grey/locked, 1 = glow/unlocked
    nodeGlow: new Animated.Value(0),
    nodeGlowPulse: new Animated.Value(0),
    nodeScale: new Animated.Value(0.9),

    // Lock icon animations
    lockOpacity: new Animated.Value(1),
    lockScale: new Animated.Value(1),
    lockRotate: new Animated.Value(0),

    // Unlock icon animations
    unlockOpacity: new Animated.Value(0),
    unlockScale: new Animated.Value(0.5),

    // Text animations
    textOpacity: new Animated.Value(0),
    exerciseNameOpacity: new Animated.Value(0),
    exerciseNameScale: new Animated.Value(0.8),

    // Celebration effects
    ringScale: new Animated.Value(0.5),
    ringOpacity: new Animated.Value(0),
    ring2Scale: new Animated.Value(0.5),
    ring2Opacity: new Animated.Value(0),
    shimmerX: new Animated.Value(-NODE_WIDTH),

    // Background flash
    flashOpacity: new Animated.Value(0),
  }).current;

  // Store continuous animation references
  const loopAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);

  const resetAnimations = useCallback(() => {
    loopAnimationsRef.current.forEach(anim => anim.stop());
    loopAnimationsRef.current = [];

    animValues.containerOpacity.setValue(0);
    animValues.containerScale.setValue(0.8);
    animValues.containerTranslateY.setValue(-50);
    animValues.nodeOpacity.setValue(0);
    animValues.nodeBorderColor.setValue(0);
    animValues.nodeGlow.setValue(0);
    animValues.nodeGlowPulse.setValue(0);
    animValues.nodeScale.setValue(0.9);
    animValues.lockOpacity.setValue(1);
    animValues.lockScale.setValue(1);
    animValues.lockRotate.setValue(0);
    animValues.unlockOpacity.setValue(0);
    animValues.unlockScale.setValue(0.5);
    animValues.textOpacity.setValue(0);
    animValues.exerciseNameOpacity.setValue(0);
    animValues.exerciseNameScale.setValue(0.8);
    animValues.ringScale.setValue(0.5);
    animValues.ringOpacity.setValue(0);
    animValues.ring2Scale.setValue(0.5);
    animValues.ring2Opacity.setValue(0);
    animValues.shimmerX.setValue(-NODE_WIDTH);
    animValues.flashOpacity.setValue(0);
  }, [animValues]);

  const createEntranceAnimation = useCallback((): Animated.CompositeAnimation => {
    return Animated.parallel([
      // Container entrance
      Animated.sequence([
        Animated.parallel([
          Animated.timing(animValues.containerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(animValues.containerScale, { toValue: 1, tension: 200, friction: 12, useNativeDriver: true }),
          Animated.spring(animValues.containerTranslateY, { toValue: 0, tension: 180, friction: 12, useNativeDriver: true }),
        ]),
      ]),

      // "New Exercise Unlocked" title text
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(animValues.textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),

      // Node appears in locked state
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(animValues.nodeOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(animValues.nodeScale, { toValue: 1, tension: 250, friction: 10, useNativeDriver: true }),
        ]),
      ]),

      // Lock icon shakes then unlocks
      Animated.sequence([
        Animated.delay(900),
        // Shake the lock
        Animated.sequence([
          Animated.timing(animValues.lockRotate, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(animValues.lockRotate, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(animValues.lockRotate, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(animValues.lockRotate, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(animValues.lockRotate, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
        Animated.delay(200),
        // Lock disappears with pop
        Animated.parallel([
          Animated.timing(animValues.lockOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(animValues.lockScale, { toValue: 1.5, duration: 200, useNativeDriver: true }),
        ]),
      ]),

      // Flash on unlock
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(animValues.flashOpacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
        Animated.timing(animValues.flashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),

      // Node transitions from grey to glowing - THE KEY MOMENT
      Animated.sequence([
        Animated.delay(1400),
        Animated.parallel([
          // Border color transitions from grey to glow
          Animated.timing(animValues.nodeBorderColor, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          // Glow intensifies
          Animated.timing(animValues.nodeGlow, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          // Node slightly pulses
          Animated.sequence([
            Animated.timing(animValues.nodeScale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
            Animated.spring(animValues.nodeScale, { toValue: 1, tension: 300, friction: 8, useNativeDriver: true }),
          ]),
        ]),
      ]),

      // Unlock icon appears
      Animated.sequence([
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(animValues.unlockOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(animValues.unlockScale, { toValue: 1, tension: 350, friction: 8, useNativeDriver: true }),
        ]),
      ]),

      // Exercise name reveals with emphasis
      Animated.sequence([
        Animated.delay(1600),
        Animated.parallel([
          Animated.timing(animValues.exerciseNameOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(animValues.exerciseNameScale, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }),
        ]),
      ]),

      // Celebration rings expand outward
      Animated.sequence([
        Animated.delay(1450),
        Animated.parallel([
          Animated.timing(animValues.ringOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(animValues.ringScale, { toValue: 3, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(animValues.ringOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(1550),
        Animated.parallel([
          Animated.timing(animValues.ring2Opacity, { toValue: 0.7, duration: 100, useNativeDriver: true }),
          Animated.timing(animValues.ring2Scale, { toValue: 4, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(animValues.ring2Opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]);
  }, [animValues]);

  const startContinuousAnimations = useCallback(() => {
    // Continuous glow pulse on the unlocked node
    const glowPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.nodeGlowPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(animValues.nodeGlowPulse, { toValue: 0.5, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    // Shimmer effect across the node
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.shimmerX, { toValue: NODE_WIDTH * 2, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(animValues.shimmerX, { toValue: -NODE_WIDTH, duration: 0, useNativeDriver: true }),
      ])
    );

    loopAnimationsRef.current = [glowPulseLoop, shimmerLoop];

    // Start loops after unlock animation completes
    setTimeout(() => {
      glowPulseLoop.start();
      shimmerLoop.start();
    }, 2000);
  }, [animValues]);

  const stopContinuousAnimations = useCallback(() => {
    loopAnimationsRef.current.forEach(anim => anim.stop());
    loopAnimationsRef.current = [];
  }, []);

  const createExitAnimation = useCallback((): Animated.CompositeAnimation => {
    return Animated.parallel([
      Animated.timing(animValues.containerOpacity, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(animValues.containerScale, { toValue: 0.9, duration: 400, useNativeDriver: true }),
      Animated.timing(animValues.containerTranslateY, { toValue: -30, duration: 400, useNativeDriver: true }),
    ]);
  }, [animValues]);

  useEffect(() => {
    if (visible) {
      resetAnimations();
      requestAnimationFrame(() => {
        setIsVisible(true);
        setIsReady(true);

        const entranceAnim = createEntranceAnimation();
        entranceAnim.start();
        startContinuousAnimations();
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          stopContinuousAnimations();
          const exitAnim = createExitAnimation();
          exitAnim.start(() => {
            setIsVisible(false);
            setIsReady(false);
            onHide();
          });
        }, duration);
        return () => {
          clearTimeout(timer);
          stopContinuousAnimations();
        };
      }
    } else if (isVisible) {
      stopContinuousAnimations();
      const exitAnim = createExitAnimation();
      exitAnim.start(() => {
        setIsVisible(false);
        setIsReady(false);
        onHide();
      });
    }
  }, [visible, duration, createEntranceAnimation, createExitAnimation, resetAnimations, onHide, isVisible, startContinuousAnimations, stopContinuousAnimations]);

  // Colors
  const COLORS = useMemo(() => ({
    locked: {
      border: `${theme.colors.tileBorder}40`,
      background: `${theme.colors.surface}30`,
      text: theme.colors.textMuted,
    },
    unlocked: {
      border: theme.colors.primary,
      glow: theme.colors.glow,
      background: `${theme.colors.surface}80`,
      text: theme.colors.textPrimary,
    },
    void: theme.colors.void,
    surface: theme.colors.surface,
    primary: theme.colors.primary,
    textPrimary: theme.colors.textPrimary,
  }), [theme]);

  // Interpolated border color
  const borderColor = animValues.nodeBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.locked.border, COLORS.unlocked.border],
  });

  const backgroundColor = animValues.nodeBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.locked.background, COLORS.unlocked.background],
  });

  if (!isVisible || !isReady) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Full screen flash */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            backgroundColor: COLORS.primary,
            opacity: animValues.flashOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Celebration rings */}
      <Animated.View
        style={[
          styles.ringContainer,
          {
            opacity: animValues.ringOpacity,
            transform: [{ scale: animValues.ringScale }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.ring, { borderColor: COLORS.primary }]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.ringContainer,
          {
            opacity: animValues.ring2Opacity,
            transform: [{ scale: animValues.ring2Scale }],
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.ring, styles.ringSecondary, { borderColor: COLORS.unlocked.glow }]} />
      </Animated.View>

      {/* Main container */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: animValues.containerOpacity,
            transform: [
              { scale: animValues.containerScale },
              { translateY: animValues.containerTranslateY },
            ],
          },
        ]}
      >
        {/* Background */}
        <View style={[styles.background, { backgroundColor: `${COLORS.void}F0` }]}>
          <Svg width={CONTAINER_WIDTH} height={CONTAINER_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={COLORS.surface} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={COLORS.void} stopOpacity="0.95" />
              </LinearGradient>
            </Defs>
            <Path
              d={`M 0 0 L ${CONTAINER_WIDTH} 0 L ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT} L 0 ${CONTAINER_HEIGHT} Z`}
              fill="url(#bgGrad)"
            />
          </Svg>
        </View>

        {/* Title: "New Exercise Unlocked!" */}
        <Animated.Text
          style={[
            styles.title,
            {
              color: COLORS.unlocked.glow,
              opacity: animValues.textOpacity,
            },
          ]}
        >
          NEW EXERCISE UNLOCKED!
        </Animated.Text>

        {/* The progression node that transitions from locked to unlocked */}
        <Animated.View
          style={[
            styles.nodeWrapper,
            {
              opacity: animValues.nodeOpacity,
              transform: [{ scale: animValues.nodeScale }],
            },
          ]}
        >
          {/* Glow layer behind the node */}
          <Animated.View
            style={[
              styles.nodeGlowLayer,
              {
                opacity: Animated.multiply(animValues.nodeGlow, animValues.nodeGlowPulse),
                ...Platform.select({
                  web: {
                    boxShadow: `0px 0px 25px 8px ${COLORS.unlocked.glow}`,
                  },
                  default: {
                    shadowColor: COLORS.unlocked.glow,
                    shadowOpacity: 1,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 15,
                  },
                }),
              },
            ]}
          />

          {/* The node card */}
          <Animated.View
            style={[
              styles.nodeCard,
              {
                backgroundColor: backgroundColor,
                borderColor: borderColor,
              },
            ]}
          >
            {/* Shimmer effect */}
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: animValues.shimmerX }],
                  backgroundColor: COLORS.unlocked.glow,
                },
              ]}
              pointerEvents="none"
            />

            {/* Lock icon (visible initially) */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  opacity: animValues.lockOpacity,
                  transform: [
                    { scale: animValues.lockScale },
                    { rotate: animValues.lockRotate.interpolate({
                      inputRange: [-10, 0, 10],
                      outputRange: ['-10deg', '0deg', '10deg'],
                    })},
                  ],
                },
              ]}
            >
              <Animated.Text style={[styles.lockIcon, { color: COLORS.locked.text }]}>
                🔒
              </Animated.Text>
            </Animated.View>

            {/* Unlock icon (appears after unlock) */}
            <Animated.View
              style={[
                styles.iconContainer,
                styles.unlockIconContainer,
                {
                  opacity: animValues.unlockOpacity,
                  transform: [{ scale: animValues.unlockScale }],
                },
              ]}
            >
              <Animated.Text style={styles.unlockIcon}>
                🔓
              </Animated.Text>
            </Animated.View>

            {/* Exercise name */}
            <Animated.View
              style={[
                styles.exerciseNameContainer,
                {
                  opacity: animValues.exerciseNameOpacity,
                  transform: [{ scale: animValues.exerciseNameScale }],
                },
              ]}
            >
              <Animated.Text
                style={[
                  styles.exerciseName,
                  { color: COLORS.textPrimary },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {exerciseName}
              </Animated.Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              color: COLORS.unlocked.glow,
              opacity: animValues.exerciseNameOpacity,
            },
          ]}
        >
          Added to your progression!
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001, // Higher than motivational toast
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
  },
  ringContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  ringSecondary: {
    borderWidth: 2,
    opacity: 0.6,
  },
  container: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  nodeWrapper: {
    position: 'relative',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeGlowLayer: {
    position: 'absolute',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    borderRadius: NODE_BORDER_RADIUS,
    backgroundColor: 'transparent',
  },
  nodeCard: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    borderRadius: NODE_BORDER_RADIUS,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    width: 60,
    height: '300%',
    opacity: 0.15,
    transform: [{ rotate: '20deg' }],
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockIconContainer: {
    position: 'absolute',
    left: 16,
  },
  lockIcon: {
    fontSize: 24,
  },
  unlockIcon: {
    fontSize: 24,
  },
  exerciseNameContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 12,
    opacity: 0.8,
  },
});
