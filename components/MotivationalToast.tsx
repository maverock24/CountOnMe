import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// STRICT COLOR PALETTE - Sci-Fi HUD Design System
// ============================================================================
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

export type AnimationVariant =
  | 'lightning_strike'
  | 'explosion_burst'
  | 'champion_reveal'
  | 'sonic_boom'
  | 'fire_rise'
  | 'matrix_decode'
  | 'stadium_roar'
  | 'victory_slam'
  | 'neon_pulse'
  | 'phoenix_ascend';

export interface MotivationalToastConfig {
  message: string;
  subtitle?: string;
  variant?: AnimationVariant;
  duration?: number;
  onDismiss?: () => void;
}

interface MotivationalToastProps extends MotivationalToastConfig {
  visible: boolean;
  onHide: () => void;
}

const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH * 0.92, 380);
const CONTAINER_HEIGHT = 110;
const CHAMFER_SIZE = 20;

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

export default function MotivationalToast({
  visible,
  message,
  subtitle,
  variant = 'lightning_strike',
  duration = 2500,
  onHide,
}: MotivationalToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Store references to continuous loop animations so we can stop them
  const loopAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);

  const animValues = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.3),
    translateY: new Animated.Value(-200),
    translateX: new Animated.Value(0),
    rotateX: new Animated.Value(0),
    rotateY: new Animated.Value(0),
    rotateZ: new Animated.Value(0),
    impactScale: new Animated.Value(1),
    impactFlash: new Animated.Value(0),
    shakeX: new Animated.Value(0),
    shakeY: new Animated.Value(0),
    glowIntensity: new Animated.Value(0),
    glowScale: new Animated.Value(1),
    borderGlow: new Animated.Value(0),
    ringScale: new Animated.Value(0.5),
    ringOpacity: new Animated.Value(0),
    ring2Scale: new Animated.Value(0.5),
    ring2Opacity: new Animated.Value(0),
    textScale: new Animated.Value(0.3),
    textOpacity: new Animated.Value(0),
    textTranslateY: new Animated.Value(15),
    textRotateX: new Animated.Value(-45),
    shimmerX: new Animated.Value(-CONTAINER_WIDTH),
    scanLineY: new Animated.Value(-20),
    layer1Offset: new Animated.Value(0),
    layer2Offset: new Animated.Value(0),
    layer3Offset: new Animated.Value(0),
    nodePulse: new Animated.Value(0.3),
    gaugeRotation: new Animated.Value(0),
  }).current;

  const resetAnimations = useCallback(() => {
    // Stop all running loop animations
    loopAnimationsRef.current.forEach(anim => anim.stop());
    loopAnimationsRef.current = [];

    animValues.opacity.setValue(0);
    animValues.scale.setValue(0.3);
    animValues.translateY.setValue(-200);
    animValues.translateX.setValue(0);
    animValues.rotateX.setValue(0);
    animValues.rotateY.setValue(0);
    animValues.rotateZ.setValue(0);
    animValues.impactScale.setValue(1);
    animValues.impactFlash.setValue(0);
    animValues.shakeX.setValue(0);
    animValues.shakeY.setValue(0);
    animValues.glowIntensity.setValue(0);
    animValues.glowScale.setValue(1);
    animValues.borderGlow.setValue(0);
    animValues.ringScale.setValue(0.5);
    animValues.ringOpacity.setValue(0);
    animValues.ring2Scale.setValue(0.5);
    animValues.ring2Opacity.setValue(0);
    animValues.textScale.setValue(0.3);
    animValues.textOpacity.setValue(0);
    animValues.textTranslateY.setValue(15);
    animValues.textRotateX.setValue(-45);
    animValues.shimmerX.setValue(-CONTAINER_WIDTH);
    animValues.scanLineY.setValue(-20);
    animValues.layer1Offset.setValue(0);
    animValues.layer2Offset.setValue(0);
    animValues.layer3Offset.setValue(0);
    animValues.nodePulse.setValue(0.3);
    animValues.gaugeRotation.setValue(0);
  }, [animValues]);

  const createShakeSequence = useCallback((intensity: number = 1, dur: number = 400) => {
    const shakeFrames = [
      { x: 12 * intensity, y: -8 * intensity },
      { x: -10 * intensity, y: 6 * intensity },
      { x: 8 * intensity, y: -4 * intensity },
      { x: -6 * intensity, y: 3 * intensity },
      { x: 4 * intensity, y: -2 * intensity },
      { x: -2 * intensity, y: 1 * intensity },
      { x: 0, y: 0 },
    ];
    const frameDuration = dur / shakeFrames.length;

    return Animated.sequence(
      shakeFrames.map(({ x, y }) =>
        Animated.parallel([
          Animated.timing(animValues.shakeX, { toValue: x, duration: frameDuration, useNativeDriver: true }),
          Animated.timing(animValues.shakeY, { toValue: y, duration: frameDuration, useNativeDriver: true }),
        ])
      )
    );
  }, [animValues]);

  // Start all continuous loop animations (these run until toast disappears)
  const startContinuousAnimations = useCallback(() => {
    // Border glow pulsing - continuous
    const borderGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.borderGlow, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(animValues.borderGlow, { toValue: 0.3, duration: 150, useNativeDriver: true }),
      ])
    );

    // Scan line sweep - continuous
    const scanLineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.scanLineY, { toValue: CONTAINER_HEIGHT + 20, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(animValues.scanLineY, { toValue: -20, duration: 0, useNativeDriver: true }),
      ])
    );

    // Shimmer effect - continuous
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.shimmerX, { toValue: CONTAINER_WIDTH * 2, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(animValues.shimmerX, { toValue: -CONTAINER_WIDTH, duration: 0, useNativeDriver: true }),
      ])
    );

    // Gauge rotation - continuous
    const gaugeLoop = Animated.loop(
      Animated.timing(animValues.gaugeRotation, { toValue: 360, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );

    // Node pulse - continuous
    const nodePulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.nodePulse, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(animValues.nodePulse, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ])
    );

    // 3D depth breathing - continuous
    const depthPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(animValues.layer1Offset, { toValue: 4, duration: 400, useNativeDriver: true }),
          Animated.timing(animValues.layer2Offset, { toValue: 8, duration: 400, useNativeDriver: true }),
          Animated.timing(animValues.layer3Offset, { toValue: 12, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(animValues.layer1Offset, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(animValues.layer2Offset, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(animValues.layer3Offset, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );

    // Glow intensity pulsing - continuous
    const glowPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValues.glowIntensity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(animValues.glowIntensity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ])
    );

    // Store references and start all loops
    loopAnimationsRef.current = [
      borderGlowLoop,
      scanLineLoop,
      shimmerLoop,
      gaugeLoop,
      nodePulseLoop,
      depthPulseLoop,
      glowPulseLoop,
    ];

    // Start all with slight delays for visual interest
    borderGlowLoop.start();
    setTimeout(() => scanLineLoop.start(), 100);
    setTimeout(() => shimmerLoop.start(), 200);
    setTimeout(() => gaugeLoop.start(), 50);
    nodePulseLoop.start();
    setTimeout(() => depthPulseLoop.start(), 300);
    setTimeout(() => glowPulseLoop.start(), 150);
  }, [animValues]);

  // Stop all continuous animations
  const stopContinuousAnimations = useCallback(() => {
    loopAnimationsRef.current.forEach(anim => anim.stop());
    loopAnimationsRef.current = [];
  }, []);

  // Create entrance animation (one-time effects)
  const createEntranceAnimation = useCallback((): Animated.CompositeAnimation => {
    const { opacity, scale, translateY, translateX, rotateX, rotateY, rotateZ,
      impactScale, impactFlash,
      ringScale, ringOpacity, ring2Scale, ring2Opacity,
      textScale, textOpacity, textTranslateY, textRotateX } = animValues;

    // Base entrance that all variants share
    const baseTextReveal = Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.spring(textRotateX, { toValue: 0, tension: 350, friction: 10, useNativeDriver: true }),
        Animated.spring(textScale, { toValue: 1, tension: 300, friction: 9, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(textTranslateY, { toValue: 0, tension: 280, friction: 10, useNativeDriver: true }),
      ]),
    ]);

    switch (variant) {
      case 'lightning_strike':
        return Animated.parallel([
          // Fast drop with 3D rotation
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateY, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
              Animated.timing(rotateX, { toValue: 15, duration: 180, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1.15, duration: 180, useNativeDriver: true }),
            ]),
            // Impact
            Animated.parallel([
              Animated.timing(impactFlash, { toValue: 1, duration: 50, useNativeDriver: true }),
              Animated.timing(impactScale, { toValue: 1.3, duration: 60, useNativeDriver: true }),
            ]),
            // Settle
            Animated.parallel([
              Animated.spring(scale, { toValue: 1, tension: 400, friction: 8, useNativeDriver: true }),
              Animated.spring(rotateX, { toValue: 0, tension: 300, friction: 10, useNativeDriver: true }),
              Animated.timing(impactFlash, { toValue: 0, duration: 150, useNativeDriver: true }),
              Animated.spring(impactScale, { toValue: 1, tension: 350, friction: 7, useNativeDriver: true }),
            ]),
          ]),
          // Shake
          Animated.sequence([
            Animated.delay(180),
            createShakeSequence(1.5, 350),
          ]),
          // Shockwave rings
          Animated.sequence([
            Animated.delay(200),
            Animated.parallel([
              Animated.timing(ringOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
              Animated.timing(ringScale, { toValue: 3.5, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(ringOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(280),
            Animated.parallel([
              Animated.timing(ring2Opacity, { toValue: 0.7, duration: 50, useNativeDriver: true }),
              Animated.timing(ring2Scale, { toValue: 4, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(ring2Opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          ]),
          baseTextReveal,
        ]);

      case 'explosion_burst':
        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(impactFlash, { toValue: 1, duration: 60, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 0.1, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 40, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.4, duration: 120, easing: Easing.out(Easing.exp), useNativeDriver: true }),
              Animated.timing(rotateZ, { toValue: 8, duration: 120, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(scale, { toValue: 1, tension: 350, friction: 8, useNativeDriver: true }),
              Animated.spring(rotateZ, { toValue: 0, tension: 300, friction: 10, useNativeDriver: true }),
              Animated.timing(impactFlash, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(100),
            createShakeSequence(2, 500),
          ]),
          Animated.sequence([
            Animated.delay(80),
            Animated.parallel([
              Animated.timing(ringOpacity, { toValue: 1, duration: 40, useNativeDriver: true }),
              Animated.timing(ringScale, { toValue: 5, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(ringOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(150),
            Animated.parallel([
              Animated.timing(ring2Opacity, { toValue: 0.8, duration: 40, useNativeDriver: true }),
              Animated.timing(ring2Scale, { toValue: 6, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(ring2Opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(200),
            Animated.parallel([
              Animated.sequence([
                Animated.timing(textScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
                Animated.spring(textScale, { toValue: 1, tension: 400, friction: 8, useNativeDriver: true }),
              ]),
              Animated.timing(textOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
              Animated.spring(textRotateX, { toValue: 0, tension: 300, friction: 10, useNativeDriver: true }),
            ]),
          ]),
        ]);

      case 'champion_reveal':
        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(rotateY, { toValue: -90, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(rotateY, { toValue: 10, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1.1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(rotateY, { toValue: 0, tension: 200, friction: 12, useNativeDriver: true }),
              Animated.spring(scale, { toValue: 1, tension: 180, friction: 10, useNativeDriver: true }),
              Animated.timing(impactFlash, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            ]),
            Animated.timing(impactFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
          Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(350),
            Animated.parallel([
              Animated.spring(textScale, { toValue: 1, tension: 250, friction: 10, useNativeDriver: true }),
              Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.spring(textRotateX, { toValue: 0, tension: 200, friction: 12, useNativeDriver: true }),
            ]),
          ]),
        ]);

      case 'sonic_boom':
        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateX, { toValue: SCREEN_WIDTH * 1.5, duration: 0, useNativeDriver: true }),
              Animated.timing(rotateY, { toValue: -45, duration: 0, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(translateX, { toValue: 0, duration: 200, easing: Easing.out(Easing.exp), useNativeDriver: true }),
              Animated.timing(rotateY, { toValue: 15, duration: 200, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(impactFlash, { toValue: 1, duration: 40, useNativeDriver: true }),
              Animated.timing(impactScale, { toValue: 1.25, duration: 50, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(rotateY, { toValue: 0, tension: 400, friction: 8, useNativeDriver: true }),
              Animated.spring(scale, { toValue: 1, tension: 350, friction: 7, useNativeDriver: true }),
              Animated.spring(impactScale, { toValue: 1, tension: 400, friction: 7, useNativeDriver: true }),
              Animated.timing(impactFlash, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(200),
            createShakeSequence(1.8, 300),
          ]),
          Animated.sequence([
            Animated.delay(220),
            Animated.parallel([
              Animated.timing(ringOpacity, { toValue: 1, duration: 30, useNativeDriver: true }),
              Animated.timing(ringScale, { toValue: 4.5, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(ringOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
          baseTextReveal,
        ]);

      case 'fire_rise':
        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateY, { toValue: 300, duration: 0, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 0.6, duration: 0, useNativeDriver: true }),
              Animated.timing(rotateX, { toValue: 30, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(translateY, { toValue: -20, duration: 500, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1.1, duration: 500, useNativeDriver: true }),
              Animated.timing(rotateX, { toValue: -5, duration: 500, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(translateY, { toValue: 0, tension: 150, friction: 10, useNativeDriver: true }),
              Animated.spring(scale, { toValue: 1, tension: 180, friction: 10, useNativeDriver: true }),
              Animated.spring(rotateX, { toValue: 0, tension: 150, friction: 12, useNativeDriver: true }),
            ]),
          ]),
          Animated.sequence([
            Animated.delay(350),
            Animated.parallel([
              Animated.spring(textScale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
              Animated.timing(textOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
              Animated.spring(textRotateX, { toValue: 0, tension: 180, friction: 12, useNativeDriver: true }),
            ]),
          ]),
        ]);

      case 'matrix_decode':
        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scale, { toValue: 3, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
          // Digital flicker for impact flash
          Animated.sequence([
            Animated.loop(
              Animated.sequence([
                Animated.timing(impactFlash, { toValue: 0.8, duration: 40, useNativeDriver: true }),
                Animated.timing(impactFlash, { toValue: 0.2, duration: 60, useNativeDriver: true }),
              ]),
              { iterations: 5 }
            ),
            Animated.timing(impactFlash, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]),
          // Text decode flicker
          Animated.sequence([
            Animated.delay(200),
            Animated.loop(
              Animated.sequence([
                Animated.timing(textOpacity, { toValue: 1, duration: 40, useNativeDriver: true }),
                Animated.timing(textOpacity, { toValue: 0.3, duration: 50, useNativeDriver: true }),
              ]),
              { iterations: 6 }
            ),
            Animated.timing(textOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(250),
            Animated.spring(textScale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
          ]),
        ]);

      case 'stadium_roar':
        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateX, { toValue: -100, duration: 0, useNativeDriver: true }),
              Animated.timing(rotateY, { toValue: 30, duration: 0, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(translateX, { toValue: 0, duration: 350, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
              Animated.timing(rotateY, { toValue: -5, duration: 350, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1.15, duration: 350, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(impactFlash, { toValue: 1, duration: 60, useNativeDriver: true }),
              Animated.spring(rotateY, { toValue: 0, tension: 250, friction: 10, useNativeDriver: true }),
              Animated.spring(scale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
            ]),
            Animated.timing(impactFlash, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
          Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(300),
            createShakeSequence(1.2, 500),
          ]),
          Animated.sequence([
            Animated.delay(280),
            Animated.parallel([
              Animated.spring(textScale, { toValue: 1, tension: 300, friction: 8, useNativeDriver: true }),
              Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.spring(textRotateX, { toValue: 0, tension: 250, friction: 10, useNativeDriver: true }),
            ]),
          ]),
        ]);

      case 'victory_slam':
        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateY, { toValue: -400, duration: 0, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1.8, duration: 0, useNativeDriver: true }),
              Animated.timing(rotateX, { toValue: -30, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(translateY, { toValue: 15, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true }),
              Animated.timing(rotateX, { toValue: 10, duration: 220, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(impactFlash, { toValue: 1, duration: 40, useNativeDriver: true }),
              Animated.timing(impactScale, { toValue: 1.4, duration: 60, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(translateY, { toValue: 0, tension: 350, friction: 7, useNativeDriver: true }),
              Animated.spring(rotateX, { toValue: 0, tension: 300, friction: 9, useNativeDriver: true }),
              Animated.spring(impactScale, { toValue: 1, tension: 400, friction: 7, useNativeDriver: true }),
              Animated.timing(impactFlash, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]),
          ]),
          Animated.sequence([
            Animated.delay(220),
            createShakeSequence(2.5, 600),
          ]),
          Animated.sequence([
            Animated.delay(230),
            Animated.parallel([
              Animated.timing(ringOpacity, { toValue: 1, duration: 30, useNativeDriver: true }),
              Animated.timing(ringScale, { toValue: 5, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(ringOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
              Animated.timing(ring2Opacity, { toValue: 0.8, duration: 30, useNativeDriver: true }),
              Animated.timing(ring2Scale, { toValue: 6, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(ring2Opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(280),
            Animated.parallel([
              Animated.sequence([
                Animated.timing(textScale, { toValue: 1.4, duration: 80, useNativeDriver: true }),
                Animated.spring(textScale, { toValue: 1, tension: 450, friction: 7, useNativeDriver: true }),
              ]),
              Animated.timing(textOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
              Animated.spring(textRotateX, { toValue: 0, tension: 350, friction: 9, useNativeDriver: true }),
            ]),
          ]),
        ]);

      case 'neon_pulse':
        return Animated.parallel([
          // Flicker on effect
          Animated.sequence([
            Animated.loop(
              Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 40, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.1, duration: 60, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.8, duration: 50, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.05, duration: 80, useNativeDriver: true }),
              ]),
              { iterations: 2 }
            ),
            Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          ]),
          Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, tension: 150, friction: 10, useNativeDriver: true }),
          // 3D pop
          Animated.sequence([
            Animated.delay(400),
            Animated.parallel([
              Animated.timing(rotateX, { toValue: 8, duration: 150, useNativeDriver: true }),
              Animated.timing(impactScale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(rotateX, { toValue: 0, tension: 200, friction: 10, useNativeDriver: true }),
              Animated.spring(impactScale, { toValue: 1, tension: 180, friction: 10, useNativeDriver: true }),
            ]),
          ]),
          // Text neon flicker
          Animated.sequence([
            Animated.delay(450),
            Animated.loop(
              Animated.sequence([
                Animated.timing(textOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
                Animated.timing(textOpacity, { toValue: 0.7, duration: 60, useNativeDriver: true }),
              ]),
              { iterations: 3 }
            ),
            Animated.timing(textOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(480),
            Animated.spring(textScale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
          ]),
        ]);

      case 'phoenix_ascend':
      default:
        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateY, { toValue: 350, duration: 0, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 0.4, duration: 0, useNativeDriver: true }),
              Animated.timing(rotateX, { toValue: 45, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(translateY, { toValue: -30, duration: 600, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1.2, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(rotateX, { toValue: -10, duration: 600, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(impactFlash, { toValue: 0.6, duration: 150, useNativeDriver: true }),
              Animated.timing(impactScale, { toValue: 1.15, duration: 200, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(translateY, { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
              Animated.spring(scale, { toValue: 1, tension: 150, friction: 10, useNativeDriver: true }),
              Animated.spring(rotateX, { toValue: 0, tension: 120, friction: 12, useNativeDriver: true }),
              Animated.spring(impactScale, { toValue: 1, tension: 140, friction: 10, useNativeDriver: true }),
              Animated.timing(impactFlash, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
          ]),
          Animated.sequence([
            Animated.delay(500),
            Animated.parallel([
              Animated.spring(textScale, { toValue: 1, tension: 180, friction: 10, useNativeDriver: true }),
              Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
              Animated.spring(textRotateX, { toValue: 0, tension: 150, friction: 12, useNativeDriver: true }),
            ]),
          ]),
        ]);
    }
  }, [variant, animValues, createShakeSequence]);

  const createExitAnimation = useCallback((): Animated.CompositeAnimation => {
    const { opacity, scale, translateY, textOpacity, rotateX, impactFlash } = animValues;

    return Animated.parallel([
      Animated.timing(impactFlash, { toValue: 0.5, duration: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.85, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -50, duration: 200, useNativeDriver: true }),
      Animated.timing(rotateX, { toValue: -15, duration: 200, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]);
  }, [animValues]);

  useEffect(() => {
    if (visible) {
      resetAnimations();
      setIsVisible(true);

      // Start the entrance animation
      const entranceAnim = createEntranceAnimation();
      entranceAnim.start();

      // Start continuous loop animations (they run forever until stopped)
      startContinuousAnimations();

      if (duration > 0) {
        const timer = setTimeout(() => {
          // Stop all continuous animations first
          stopContinuousAnimations();

          const exitAnim = createExitAnimation();
          exitAnim.start(() => {
            setIsVisible(false);
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
        onHide();
      });
    }
  }, [visible, duration, createEntranceAnimation, createExitAnimation, resetAnimations, onHide, isVisible, startContinuousAnimations, stopContinuousAnimations]);

  const containerStyle = useMemo(() => ({
    opacity: animValues.opacity,
    transform: [
      { perspective: 1200 },
      { translateY: animValues.translateY },
      { translateX: Animated.add(animValues.translateX, animValues.shakeX) },
      { scale: Animated.multiply(animValues.scale, animValues.impactScale) },
      { rotateX: animValues.rotateX.interpolate({
        inputRange: [-90, 0, 90],
        outputRange: ['-90deg', '0deg', '90deg'],
      })},
      { rotateY: animValues.rotateY.interpolate({
        inputRange: [-90, 0, 90],
        outputRange: ['-90deg', '0deg', '90deg'],
      })},
      { rotateZ: animValues.rotateZ.interpolate({
        inputRange: [-45, 0, 45],
        outputRange: ['-45deg', '0deg', '45deg'],
      })},
    ],
  }), [animValues]);

  const textContainerStyle = useMemo(() => ({
    opacity: animValues.textOpacity,
    transform: [
      { scale: animValues.textScale },
      { translateY: animValues.textTranslateY },
    ],
  }), [animValues]);

  if (!isVisible) return null;

  const chamferedPath = generateChamferedPath(CONTAINER_WIDTH, CONTAINER_HEIGHT, CHAMFER_SIZE);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Full screen flash overlay */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            backgroundColor: COLORS.primary,
            opacity: animValues.impactFlash.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]}
        pointerEvents="none"
      />

      {/* Primary shockwave ring */}
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

      {/* Secondary shockwave ring */}
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
        <View style={[styles.ring, styles.ringSecondary, { borderColor: COLORS.secondary }]} />
      </Animated.View>

      {/* Main toast container */}
      <Animated.View style={[styles.toastContainer, containerStyle]}>
        {/* 3D depth shadow layers */}
        <Animated.View
          style={[
            styles.depthLayer,
            styles.depthLayer3,
            {
              transform: [
                { translateX: animValues.layer3Offset },
                { translateY: animValues.layer3Offset },
              ],
            },
          ]}
        >
          <Svg width={CONTAINER_WIDTH} height={CONTAINER_HEIGHT}>
            <Path d={chamferedPath} fill={COLORS.void} opacity={0.5} />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            styles.depthLayer,
            styles.depthLayer2,
            {
              transform: [
                { translateX: Animated.multiply(animValues.layer2Offset, 0.6) },
                { translateY: Animated.multiply(animValues.layer2Offset, 0.6) },
              ],
            },
          ]}
        >
          <Svg width={CONTAINER_WIDTH} height={CONTAINER_HEIGHT}>
            <Path d={chamferedPath} fill={COLORS.void} opacity={0.7} />
          </Svg>
        </Animated.View>

        {/* Main container */}
        <View style={styles.mainContainer}>
          <Svg width={CONTAINER_WIDTH} height={CONTAINER_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={COLORS.surface} stopOpacity="0.95" />
                <Stop offset="50%" stopColor={COLORS.void} stopOpacity="0.98" />
                <Stop offset="100%" stopColor={COLORS.surface} stopOpacity="0.95" />
              </LinearGradient>
              <LinearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={COLORS.secondary} stopOpacity="0.5" />
                <Stop offset="50%" stopColor={COLORS.primary} stopOpacity="1" />
                <Stop offset="100%" stopColor={COLORS.secondary} stopOpacity="0.5" />
              </LinearGradient>
            </Defs>
            <Path d={chamferedPath} fill="url(#bgGradient)" />
            <Path d={chamferedPath} fill="none" stroke="url(#borderGradient)" strokeWidth="1" />
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
                  outputRange: [0, 0.3],
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

          {/* Corner data gauges */}
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
              <Svg width={30} height={30}>
                <Circle cx={15} cy={15} r={12} fill="none" stroke={COLORS.secondary} strokeWidth={2} />
                <Circle cx={15} cy={15} r={12} fill="none" stroke={COLORS.primary} strokeWidth={2} strokeDasharray="25 75" strokeLinecap="round" />
                <Circle cx={15} cy={15} r={4} fill={COLORS.primary} />
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
              <Svg width={30} height={30}>
                <Circle cx={15} cy={15} r={12} fill="none" stroke={COLORS.secondary} strokeWidth={2} />
                <Circle cx={15} cy={15} r={12} fill="none" stroke={COLORS.primary} strokeWidth={2} strokeDasharray="40 60" strokeLinecap="round" />
                <Circle cx={15} cy={15} r={4} fill={COLORS.primary} />
              </Svg>
            </Animated.View>
          </View>

          {/* Text content */}
          <Animated.View style={[styles.textContainer, textContainerStyle]}>
            <Animated.Text style={styles.messageText} numberOfLines={subtitle ? 1 : 2} adjustsFontSizeToFit>
              {message}
            </Animated.Text>
            {subtitle && (
              <Animated.Text style={styles.subtitleText} numberOfLines={1} adjustsFontSizeToFit>
                {subtitle}
              </Animated.Text>
            )}
          </Animated.View>

          {/* Top label */}
          <View style={styles.topLabel}>
            <View style={styles.labelLine} />
            <Animated.Text style={[styles.labelText, { opacity: animValues.textOpacity }]}>
              SYSTEM ALERT
            </Animated.Text>
            <View style={styles.labelLine} />
          </View>

          {/* Bottom status */}
          <View style={styles.bottomStatus}>
            <Animated.Text style={[styles.statusText, { opacity: animValues.textOpacity }]}>
              {'>>>'} ACTIVE {'<<<'}
            </Animated.Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  ringContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998,
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  ringSecondary: {
    borderWidth: 1,
    opacity: 0.5,
  },
  toastContainer: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  depthLayer: {
    position: 'absolute',
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
  },
  depthLayer3: {
    opacity: 0.3,
  },
  depthLayer2: {
    opacity: 0.5,
  },
  mainContainer: {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
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
    opacity: 0.6,
  },
  shimmer: {
    position: 'absolute',
    width: 60,
    height: '300%',
    backgroundColor: COLORS.highlight,
    opacity: 0.1,
  },
  cornerGauge: {
    position: 'absolute',
  },
  cornerGaugeLeft: {
    left: 10,
    top: '50%',
    marginTop: -15,
  },
  cornerGaugeRight: {
    right: 10,
    top: '50%',
    marginTop: -15,
  },
  textContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 10,
    paddingHorizontal: 50,
    paddingTop: 18,
    paddingBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  messageText: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.highlight,
    fontFamily: 'System',
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    color: COLORS.primary,
    fontFamily: 'System',
    marginTop: 4,
  },
  topLabel: {
    position: 'absolute',
    top: 8,
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
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.primary,
    marginHorizontal: 8,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  bottomStatus: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
});
