import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, Path, Polygon, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

// Create animated SVG components
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

// A simple fallback for Colors constant if it's not available in your project.
const Colors = {
    glow: 'rgba(78, 230, 225, 0.8)',
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Scale factor to make the toast 1/3 smaller (i.e. multiply sizes by 2/3)
const TOAST_SCALE = 2 / 3;
const HEX_WIDTH = 400 * TOAST_SCALE;
const HEX_HEIGHT = 120 * TOAST_SCALE;

// --- Type Definitions ---
export interface ToastConfig {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
  onPress?: () => void;
  onDismiss?: () => void;
}

interface ToastMessageProps extends ToastConfig {
  visible: boolean;
  onHide: () => void;
  showIcon?: boolean;
}

// --- Helper Functions ---
const getToastConfig = (type: ToastConfig['type']) => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: 'rgba(8, 10, 12, 0.95)',
        borderColor: 'rgba(78, 230, 225, 1)',
      };
    case 'error':
      return {
        backgroundColor: 'rgba(12, 8, 8, 0.95)',
        borderColor: 'rgb(2, 248, 240)',
      };
    case 'warning':
      return {
        backgroundColor: 'rgba(10, 10, 8, 0.95)',
        borderColor: 'rgb(2, 248, 240)',
      };
    case 'info':
    default:
      return {
        backgroundColor: 'rgba(8, 10, 12, 0.95)',
        borderColor: 'rgb(2, 248, 240)',
      };
  }
};

const generateElectricPath = (startX: number, endX: number, centerY: number) => {
  const numberOfPoints = 15;
  const baseAmplitude = 40 * TOAST_SCALE;
  
  const points = Array.from({ length: numberOfPoints }, (_, i) => {
    const progress = i / (numberOfPoints - 1);
    const x = startX + progress * (endX - startX);
    
    if (i === 0 || i === numberOfPoints - 1) {
      return { x, y: centerY };
    }

    const primaryChaos = (Math.random() - 0.5) * baseAmplitude;
    const branchingDistortion = Math.random() > 0.7 ? (Math.random() - 0.5) * baseAmplitude * 1.5 : 0;
    const microCrackle = (Math.random() - 0.5) * baseAmplitude * 0.3;
    const progressAmplitude = Math.sin(progress * Math.PI * 3) * baseAmplitude * 0.4;
    const electricJump = Math.random() > 0.85 ? (Math.random() - 0.5) * baseAmplitude * 2 : 0;
    const fractalNoise = 
      Math.sin(progress * Math.PI * 8) * (Math.random() - 0.5) * baseAmplitude * 0.2 +
      Math.sin(progress * Math.PI * 16) * (Math.random() - 0.5) * baseAmplitude * 0.1;
      
    const y = centerY + primaryChaos + branchingDistortion + microCrackle + progressAmplitude + electricJump + fractalNoise;
    return { x, y };
  });
  
  return 'M' + points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L');
};

const getPositionStyle = (position: ToastConfig['position']) => {
  const baseStyle: any = {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  };
  switch (position) {
    case 'top': return { ...baseStyle, top: 60 };
    case 'center': return { ...baseStyle, top: Math.max((screenHeight - HEX_HEIGHT) / 2, 60), alignSelf: 'center', left: 0, right: 0 };
    case 'bottom': return { ...baseStyle, bottom: 100 };
    default: return { ...baseStyle, top: 60 };
  }
};


// --- Component ---
export default function ToastMessage({
  visible, message, type = 'info', duration = 3000, position = 'center', onPress, onDismiss, onHide,
}: ToastMessageProps) {
  
  const animValues = useRef({
  slide: new Animated.Value(0), scale: new Animated.Value(0.8), opacity: new Animated.Value(0),
  flashOpacity: new Animated.Value(0), explosionScale: new Animated.Value(0), entranceRotate: new Animated.Value(0),
  crackFlash: new Animated.Value(0),
  hexagonRotateX: new Animated.Value(-75), hexagonRotateY: new Animated.Value(0),
  hexagonScaleZ: new Animated.Value(0.3), hexagonTranslateZ: new Animated.Value(-200),
  hexagonNudgeX: new Animated.Value(0), hexagonNudgeY: new Animated.Value(0),
    borderFlicker: new Animated.Value(1), // New animated value for border flickering
    textFlicker: new Animated.Value(1), // Animated opacity for inner text flicker
    hexagonShakeScale: new Animated.Value(1), // scale-based shake for entrance
  }).current;

  // Use state for visibility control and electric paths
  const [isVisible, setIsVisible] = useState(false);
  const [electricPath, setElectricPath] = useState('');
  const [electricPath2, setElectricPath2] = useState('');
  const [electricPath3, setElectricPath3] = useState('');
  const [electricPath4, setElectricPath4] = useState('');
  const [electricPath5, setElectricPath5] = useState('');
  const [electricPath6, setElectricPath6] = useState('');
  const [electricOpacity, setElectricOpacity] = useState(0.7);
  
  // Refs for animation loop control
  const animationFrameId = useRef<number>();
  const electricTimeoutId = useRef<any>(null);
  const shouldAnimateElectric = useRef(false);
  const flashLoopRef = useRef<any>(null);
  const borderLoopRef = useRef<any>(null);
  const textLoopRef = useRef<any>(null);
  const electricStartTimer = useRef<any>(null);
  const particlesTimerRef = useRef<any>(null);
  const particlesRef = useRef<Array<{
    animX: Animated.Value,
    animY: Animated.Value,
    animScale: Animated.Value,
    animOpacity: Animated.Value,
    twinkle?: Animated.Value,
    rotation: number,
    color: string,
  }>>([]);

  const toastConfig = getToastConfig(type);

  // Initialize particles once
  if (particlesRef.current.length === 0) {
  const count = 30; // increased particles for denser burst
  // Expanded palette for more visual variety (include subtle tints)
  const base = toastConfig.borderColor || '#00ffff';
  const colors = [base, '#ffffff', '#e6f9fb', '#bff7f5', '#80fff8', '#cfffff', '#e0ffff', '#a0e8e0'];
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        animX: new Animated.Value(0),
        animY: new Animated.Value(0),
        animScale: new Animated.Value(0.8),
        animOpacity: new Animated.Value(0),
        twinkle: new Animated.Value(1),
        rotation: Math.round((Math.random() - 0.5) * 360),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  // Optimized Tesla coil electricity animation - full-width ribbon surge
  const animateElectricity = () => {
    // Continue animating as long as shouldAnimateElectric is true
    if (!shouldAnimateElectric.current) {
      console.log('Animation stopped - electric animation disabled');
      return;
    }
    
  const centerY = 60 * TOAST_SCALE;
    const time = Date.now();
    
  // Create ribbon that spans the full extended width
  const ribbonWidth = screenWidth * 1.5; // Match the ribbon container width
    const ribbonStartX = 0; // Start from left edge of ribbon
    const ribbonEndX = ribbonWidth; // End at right edge of ribbon
    
    // Add chaotic time-based modulation to the center Y position
    const chaoticCenterY1 = centerY + 
      Math.sin(time * 0.003) * 12 + 
      Math.sin(time * 0.007) * 8 + 
      Math.cos(time * 0.011) * 6 +
      (Math.random() - 0.5) * 4; // Random jitter
      
    const chaoticCenterY2 = centerY + 
      Math.cos(time * 0.004) * 15 + 
      Math.sin(time * 0.009) * 10 + 
      Math.sin(time * 0.013) * 7 +
      (Math.random() - 0.5) * 5; // Different random jitter
    
    // Generate ribbon-width electric path with enhanced chaos
    const electricPath1 = generateElectricPath(ribbonStartX, ribbonEndX, chaoticCenterY1);
    const electricPath2 = generateElectricPath(
      ribbonStartX, 
      ribbonEndX, 
      chaoticCenterY2
    );
    const electricPath3 = generateElectricPath(
      ribbonStartX, 
      ribbonEndX, 
      chaoticCenterY1 + (Math.random() - 0.5) * 6
    );
    const electricPath4 = generateElectricPath(
      ribbonStartX, 
      ribbonEndX, 
      chaoticCenterY2 + (Math.random() - 0.5) * 8
    );
    const electricPath5 = generateElectricPath(
      ribbonStartX, 
      ribbonEndX, 
      chaoticCenterY1 + (Math.random() - 0.5) * 4
    );
    const electricPath6 = generateElectricPath(
      ribbonStartX, 
      ribbonEndX, 
      chaoticCenterY2 + (Math.random() - 0.5) * 10
    );
    
    // electric ribbon paths generated (debug logs removed for production)
    
  setElectricPath(electricPath1);
    setElectricPath2(electricPath2);
    setElectricPath3(electricPath3);
    setElectricPath4(electricPath4);
    setElectricPath5(electricPath5);
    setElectricPath6(electricPath6);
    
    // Enhanced opacity calculation with chaotic variation - ENSURE MINIMUM VISIBILITY
    const baseOpacity = 0.7 + Math.random() * 0.2; // Higher base opacity
    const timeFlicker = Math.sin(time * 0.005) * 0.15;
    const chaoticFlicker = Math.sin(time * 0.012) * 0.1;
    const microFlicker = (Math.random() - 0.5) * 0.1;
    const suddenFlash = Math.random() > 0.9 ? 0.3 : 0; // Occasional bright flashes
    const opacity = baseOpacity + timeFlicker + chaoticFlicker + microFlicker + suddenFlash;
    setElectricOpacity(Math.max(0.5, Math.min(1.0, opacity))); // MINIMUM 0.5 opacity for visibility
    
  // electric opacity calculated
    
    // Variable timing for unpredictable flicker
    const baseInterval = 60;
    const randomVariation = Math.random() * 40;
    const chaoticVariation = Math.sin(time * 0.001) * 20;
    const interval = baseInterval + randomVariation + chaoticVariation;
    
    // Use a tracked timeout so we can cancel it if the component unmounts or animation stops
    if (electricTimeoutId.current) {
      clearTimeout(electricTimeoutId.current);
      electricTimeoutId.current = null;
    }
    electricTimeoutId.current = setTimeout(() => {
      animationFrameId.current = requestAnimationFrame(animateElectricity);
    }, Math.max(20, interval)); // Ensure minimum 20ms interval
  };

  // Emit tiny shards/dust particles outward from random points on the hexagon border
  const emitParticles = () => {
    const animations: Animated.CompositeAnimation[] = [];
    // Hexagon vertices for border-aligned emission
    // Hexagon vertices derived from scaled hex width/height (fractions of original 400x120)
    const hexVerts = [
      { x: HEX_WIDTH * 0.1, y: HEX_HEIGHT * 0.1666667 },
      { x: HEX_WIDTH * 0.9, y: HEX_HEIGHT * 0.1666667 },
      { x: HEX_WIDTH * 0.95, y: HEX_HEIGHT * 0.5 },
      { x: HEX_WIDTH * 0.9, y: HEX_HEIGHT * 0.8333333 },
      { x: HEX_WIDTH * 0.1, y: HEX_HEIGHT * 0.8333333 },
      { x: HEX_WIDTH * 0.05, y: HEX_HEIGHT * 0.5 }
    ];

  particlesRef.current.forEach((p, i) => {
      // pick a random point along a random edge
      const edgeIndex = Math.floor(Math.random() * hexVerts.length);
      const v1 = hexVerts[edgeIndex];
      const v2 = hexVerts[(edgeIndex + 1) % hexVerts.length];
      const t = Math.random();
      const startXRaw = v1.x + (v2.x - v1.x) * t;
      const startYRaw = v1.y + (v2.y - v1.y) * t;

  // center particle on that border point (smaller for snappy twinkle)
  const particleW = 5 * TOAST_SCALE;
  const particleH = 4 * TOAST_SCALE;
      p.animX.setValue(startXRaw - particleW / 2);
      p.animY.setValue(startYRaw - particleH / 2);
  p.animScale.setValue(0.5 + Math.random() * 0.35);
      p.animOpacity.setValue(1);

      // Compute precise outward normal from hex center (derived)
      const cx = HEX_WIDTH / 2, cy = HEX_HEIGHT / 2;
      const nx = (startXRaw - cx);
      const ny = (startYRaw - cy);
      const nlen = Math.sqrt(nx * nx + ny * ny) || 1;
      let ux = nx / nlen; // unit outward vector x
      let uy = ny / nlen; // unit outward vector y

      // Add a small perpendicular jitter for variety
      const perpJitter = (Math.random() - 0.5) * 0.35;
      const jitterX = -uy * perpJitter * 30;
      const jitterY = ux * perpJitter * 30;

  // Distances (scaled down with toast)
  const distance = (110 + Math.random() * 180) * TOAST_SCALE; // final distance scaled
  const burstDistance = distance * (0.32 + Math.random() * 0.18);

  // Targets for two-phase motion
  const burstTargetX = startXRaw + ux * burstDistance + jitterX - particleW / 2;
  const burstTargetY = startYRaw + uy * burstDistance + jitterY - ((6 * TOAST_SCALE) + Math.random() * (24 * TOAST_SCALE)) - particleH / 2; // slight upward bias
  const finalTargetX = startXRaw + ux * distance + jitterX - particleW / 2;
  const finalTargetY = startYRaw + uy * distance + jitterY - ((18 * TOAST_SCALE) + Math.random() * (40 * TOAST_SCALE)) - particleH / 2;

  // Durations: shorter burst and drift for faster particles
  const burstDur = 80 + Math.random() * 120; // keep durations similar for feel
  const driftDur = 320 + Math.random() * 520;

      // Start a small snappier twinkle pulse concurrently (randomized)
      if (p.twinkle) {
        p.twinkle.setValue(0.9 + Math.random() * 0.4);
        Animated.sequence([
          Animated.timing(p.twinkle, { toValue: 1.5, duration: 80 + Math.random() * 120, easing: Easing.out(Easing.sin), useNativeDriver: true }),
          Animated.timing(p.twinkle, { toValue: 1.0, duration: 100 + Math.random() * 160, easing: Easing.in(Easing.sin), useNativeDriver: true }),
        ]).start();
      }

      // Two-phase animation: quick ease-out burst then smooth slower drift with fade & scale down
      const seq = Animated.sequence([
        Animated.parallel([
          Animated.timing(p.animX, { toValue: burstTargetX, duration: burstDur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.animY, { toValue: burstTargetY, duration: burstDur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.animScale, { toValue: 0.9, duration: burstDur * 0.9, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(p.animX, { toValue: finalTargetX, duration: driftDur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.animY, { toValue: finalTargetY, duration: driftDur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.animScale, { toValue: 0.35, duration: driftDur * 0.9, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.animOpacity, { toValue: 0, duration: driftDur, easing: Easing.in(Easing.linear), useNativeDriver: true }),
        ]),
      ]);

      animations.push(seq);
    });

    // Tighter stagger for snappier simultaneous burst
    Animated.stagger(10, animations).start(() => {
      // Completed - nothing else to do
    });
  };

  const animateIn = useCallback(() => {
  setIsVisible(true);
    // Start border flicker immediately when the hexagon appears
    try { if (borderLoopRef.current) { borderLoopRef.current.stop(); } } catch (e) {}
    borderLoopRef.current = Animated.loop(Animated.sequence([
      Animated.timing(animValues.borderFlicker, { toValue: 0.3, duration: 80 + Math.random() * 40, useNativeDriver: true }),
      Animated.timing(animValues.borderFlicker, { toValue: 1.0, duration: 60 + Math.random() * 30, useNativeDriver: true }),
      Animated.timing(animValues.borderFlicker, { toValue: 0.7, duration: 90 + Math.random() * 50, useNativeDriver: true }),
      Animated.timing(animValues.borderFlicker, { toValue: 1.0, duration: 70 + Math.random() * 35, useNativeDriver: true }),
      Animated.delay(120 + Math.random() * 180),
    ]));
    borderLoopRef.current.start();

    // Start a subtle text flicker immediately
    try { if (textLoopRef.current) { textLoopRef.current.stop(); } } catch (e) {}
    textLoopRef.current = Animated.loop(Animated.sequence([
      Animated.timing(animValues.textFlicker, { toValue: 0.6, duration: 120, useNativeDriver: true }),
      Animated.timing(animValues.textFlicker, { toValue: 1.0, duration: 90, useNativeDriver: true }),
      Animated.delay(100 + Math.random() * 200),
    ]));
    textLoopRef.current.start();
    
    // Stronger and longer initial shake for explosion: more steps, larger amplitudes and slightly longer durations
    const createShakeSequence = (animValue: Animated.Value, intensity: number) => Animated.sequence([
      ...[intensity * 2.8, -intensity*2.4, intensity*2.0, -intensity*1.6, intensity*1.3, -intensity*1.1, intensity*0.9, -intensity*0.7, intensity*0.5, -intensity*0.35, intensity*0.18].map(toValue => 
        Animated.timing(animValue, { toValue, duration: 42, useNativeDriver: true })
      ),
      Animated.timing(animValue, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]);

    // Scale-based shake sequence for hexagon (applied to hexagon scale instead of translate X/Y)
    const createScaleShakeSequence = (animValue: Animated.Value, intensity: number) => Animated.sequence([
      ...[3.0, -2.4, 2.0, -1.6, 1.3, -1.1, 0.95, -0.7, 0.5, -0.35, 0.18].map(mult => 
        Animated.timing(animValue, { toValue: 1 + mult * intensity, duration: 36, useNativeDriver: true })
      ),
      Animated.timing(animValue, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]);

  // Entrance: stronger explosive sequence
  Animated.parallel([
    // Use scale-based shake on the hexagon itself instead of translating the whole toast
    createScaleShakeSequence(animValues.hexagonShakeScale, 0.09),
    // small X/Y nudge to add extra realism to the shake
    ((): Animated.CompositeAnimation => {
      const createNudgeSequence = (animX: Animated.Value, animY: Animated.Value, intensity: number) => {
        const steps: Array<[number, number]> = [
          [10 * intensity, 6 * intensity],
          [-8 * intensity, -5 * intensity],
          [6 * intensity, 4 * intensity],
          [-4 * intensity, -3 * intensity],
          [2 * intensity, 1 * intensity],
          [0, 0],
        ];
        return Animated.sequence(steps.map(([x, y]) => Animated.parallel([
          Animated.timing(animX, { toValue: x, duration: 36, useNativeDriver: true }),
          Animated.timing(animY, { toValue: y, duration: 36, useNativeDriver: true }),
        ])));
      };
      return createNudgeSequence(animValues.hexagonNudgeX, animValues.hexagonNudgeY, 1);
    })(),
    // Add a quick rotational burst for extra punch
    Animated.sequence([
      Animated.timing(animValues.entranceRotate, { toValue: 12, duration: 80, useNativeDriver: true }),
      Animated.timing(animValues.entranceRotate, { toValue: -6, duration: 100, useNativeDriver: true }),
      Animated.timing(animValues.entranceRotate, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]),
    // Flash pulse to emphasize the explosion
    Animated.sequence([
      Animated.timing(animValues.flashOpacity, { toValue: 1.6, duration: 90, useNativeDriver: true }),
      Animated.timing(animValues.flashOpacity, { toValue: 0.6, duration: 200, useNativeDriver: true }),
    ]),
      Animated.sequence([
        Animated.timing(animValues.crackFlash, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(animValues.crackFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      // (explosionScale animation removed so the hexagon won't scale up/shrink)
      Animated.sequence([
        Animated.delay(50),
        Animated.parallel([
          Animated.spring(animValues.slide, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
          Animated.spring(animValues.scale, { toValue: 1, tension: 180, friction: 8, useNativeDriver: true }),
          Animated.timing(animValues.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(80),
        // Break-through pop: push toward the user (positive translateZ), increase Z-scale and rotateX toward camera
        Animated.parallel([
          Animated.sequence([
            Animated.spring(animValues.hexagonTranslateZ, { toValue: 80, tension: 1200, friction: 18, useNativeDriver: true }),
            Animated.spring(animValues.hexagonTranslateZ, { toValue: 8, tension: 160, friction: 12, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.spring(animValues.hexagonScaleZ, { toValue: 1.15, tension: 900, friction: 14, useNativeDriver: true }),
            Animated.spring(animValues.hexagonScaleZ, { toValue: 1.02, tension: 200, friction: 12, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.spring(animValues.hexagonRotateX, { toValue: 18, tension: 900, friction: 12, useNativeDriver: true }),
            Animated.spring(animValues.hexagonRotateX, { toValue: -4, tension: 160, friction: 16, useNativeDriver: true }),
          ]),
          // small settle rotate after the pop
        ]),
      ]),
    ]).start(() => {
      // entrance sequence finished
    });
    // schedule particle emission close to the pop moment
    if (particlesTimerRef.current) clearTimeout(particlesTimerRef.current);
    particlesTimerRef.current = setTimeout(() => emitParticles(), 110);

    // Schedule mild electric surges to begin right after the explosion effect
    if (electricStartTimer.current) clearTimeout(electricStartTimer.current);
    electricStartTimer.current = setTimeout(() => {
      if (!shouldAnimateElectric.current) {
        shouldAnimateElectric.current = true;
        animateElectricity();
        // start a mild flash loop
        if (flashLoopRef.current) try { flashLoopRef.current.stop(); } catch (e) {}
        flashLoopRef.current = Animated.loop(Animated.sequence([
          Animated.timing(animValues.flashOpacity, { toValue: 1.0, duration: 100, useNativeDriver: true }),
          Animated.timing(animValues.flashOpacity, { toValue: 0.5 + Math.random() * 0.3, duration: 90, useNativeDriver: true }),
        ]));
        flashLoopRef.current.start();
      }
  }, 300); // start surges 300ms after the explosion spring sequence (earlier)
  }, [animValues]);

  const animateOut = useCallback(() => {
    // When shrinking starts, intensify surges if already active; otherwise start them immediately
    if (!shouldAnimateElectric.current) {
      shouldAnimateElectric.current = true;
      animateElectricity();
    }
    // ramp up flash intensity: replace current flash loop with a more intense one
    if (flashLoopRef.current) {
      try { flashLoopRef.current.stop(); } catch (e) { }
      flashLoopRef.current = null;
    }
    flashLoopRef.current = Animated.loop(Animated.sequence([
      Animated.timing(animValues.flashOpacity, { toValue: 1.8, duration: 80, useNativeDriver: true }),
      Animated.timing(animValues.flashOpacity, { toValue: 0.4 + Math.random() * 0.5, duration: 60, useNativeDriver: true }),
    ]));
    flashLoopRef.current.start();

    if (electricStartTimer.current) { clearTimeout(electricStartTimer.current); electricStartTimer.current = null; }

    Animated.parallel([
      Animated.timing(animValues.flashOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(animValues.scale, { toValue: 0.8, duration: 250, useNativeDriver: true }),
      Animated.timing(animValues.opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      // Stop electric animation and flash loop after shrink completes
      shouldAnimateElectric.current = false;
      if (animationFrameId.current) {
        try { cancelAnimationFrame(animationFrameId.current); } catch (e) { }
        animationFrameId.current = undefined;
      }
      if (electricTimeoutId.current) {
        try { clearTimeout(electricTimeoutId.current); } catch (e) {}
        electricTimeoutId.current = null;
      }
      // Ensure particle timer is cleared so we don't emit after hide
      if (particlesTimerRef.current) {
        try { clearTimeout(particlesTimerRef.current); } catch (e) {}
        particlesTimerRef.current = null;
      }
  try { flashLoopRef.current && flashLoopRef.current.stop(); } catch (e) { /* ignore */ }
      try { borderLoopRef.current && borderLoopRef.current.stop(); } catch (e) { /* ignore */ }
      try { textLoopRef.current && textLoopRef.current.stop(); } catch (e) { /* ignore */ }
      borderLoopRef.current = null;
      textLoopRef.current = null;
      Animated.timing(animValues.flashOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();

      setIsVisible(false);
      onHide();
    });
  }, [animValues, onHide]);

  useEffect(() => {
    if (visible) {
      animateIn();
      if (duration > 0) {
        const timer = setTimeout(animateOut, duration);
        return () => clearTimeout(timer);
      }
    } else if (isVisible) {
      animateOut();
    }
    
    return () => {
      shouldAnimateElectric.current = false;
      if (animationFrameId.current) {
        try { cancelAnimationFrame(animationFrameId.current); } catch (e) { }
        animationFrameId.current = undefined;
      }
      if (electricTimeoutId.current) {
        try { clearTimeout(electricTimeoutId.current); } catch (e) {}
        electricTimeoutId.current = null;
      }
      if (electricStartTimer.current) {
        clearTimeout(electricStartTimer.current);
        electricStartTimer.current = null;
      }
      if (flashLoopRef.current) {
        try { flashLoopRef.current.stop(); } catch (e) {}
        flashLoopRef.current = null;
      }
      // Clear pending particle emission timer
      if (particlesTimerRef.current) {
        try { clearTimeout(particlesTimerRef.current); } catch (e) {}
        particlesTimerRef.current = null;
      }
    };
  }, [visible, duration, animateIn, animateOut, isVisible]);

  const handlePress = () => {
    onPress ? onPress() : onDismiss && (onDismiss(), animateOut());
  };

  if (!isVisible) return null;
  
  const positionStyle = getPositionStyle(position);
  const slideTransform = animValues.slide.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'bottom' ? [100, 0] : [-100, 0],
  });
  return (
    <View style={positionStyle}>
      {/* Electric surge layers live outside the transformed wrapper so they aren't clipped by transforms */}
      <Animated.View style={[styles.electricFlash, { opacity: Animated.multiply(animValues.flashOpacity, electricOpacity) }]}>
        <Svg width="100%" height={HEX_HEIGHT} style={styles.flashSvg}>
          <Defs>
            <SvgLinearGradient id="fullFlashGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              {[0,0.2,0.35,0.5,0.65,0.8,1].map((o,i) => <Stop key={i} offset={`${o*100}%`} stopColor={i===3?"#fff":toastConfig.borderColor} stopOpacity={[0,0.3,0.8,1,0.8,0.3,0][i]}/>)}
            </SvgLinearGradient>
            <filter id="fullGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={toastConfig.borderColor} />
              <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor={toastConfig.borderColor} floodOpacity="0.6" />
              <feDropShadow dx="0" dy="0" stdDeviation="25" floodColor="#ffffff" floodOpacity="0.3" />
            </filter>
          </Defs>
          <Path d={electricPath} stroke="url(#fullFlashGrad)" strokeWidth="4" fill="none" filter="url(#fullGlow)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.electricFlash, { opacity: Animated.multiply(animValues.flashOpacity, electricOpacity * 0.9), top: 1 }]}>
        <Svg width="100%" height={HEX_HEIGHT} style={styles.flashSvg}>
          <Defs>
            <SvgLinearGradient id="fullCyanFlashGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              {[0,0.2,0.35,0.5,0.65,0.8,1].map((o,i) => <Stop key={i} offset={`${o*100}%`} stopColor={i===3?"#fff":"rgb(2, 248, 240)"} stopOpacity={[0,0.3,0.8,1,0.8,0.3,0][i]}/>)}
            </SvgLinearGradient>
            <filter id="fullCyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00ffff" />
              <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#00ffff" floodOpacity="0.7" />
              <feDropShadow dx="0" dy="0" stdDeviation="20" floodColor="#ffffff" floodOpacity="0.4" />
            </filter>
          </Defs>
          <Path d={electricPath2} stroke="url(#fullCyanFlashGrad)" strokeWidth="3.5" fill="none" filter="url(#fullCyanGlow)" />
        </Svg>
      </Animated.View>

      {/* Additional intense core surge layer */}
      <Animated.View style={[styles.electricFlash, { opacity: Animated.multiply(animValues.flashOpacity, electricOpacity * 1.2), top: 0.5 }]}>
        <Svg width="100%" height={HEX_HEIGHT} style={styles.flashSvg}>
          <Defs>
            <SvgLinearGradient id="coreFlashGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              {[0,0.3,0.4,0.5,0.6,0.7,1].map((o,i) => <Stop key={i} offset={`${o*100}%`} stopColor={i===3?"#ffffff":"#00ffff"} stopOpacity={[0,0.5,0.9,1,0.9,0.5,0][i]}/>)}
            </SvgLinearGradient>
            <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffffff" />
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#00ffff" floodOpacity="0.8" />
            </filter>
          </Defs>
          <Path d={electricPath} stroke="url(#coreFlashGrad)" strokeWidth="1.5" fill="none" filter="url(#coreGlow)" />
        </Svg>
      </Animated.View>

      {/* Fourth electric surge layer */}
      <Animated.View style={[styles.electricFlash, { opacity: Animated.multiply(animValues.flashOpacity, electricOpacity * 0.8), top: 1.5 }]}>
        <Svg width="100%" height={HEX_HEIGHT} style={styles.flashSvg}>
          <Defs>
            <SvgLinearGradient id="fourthFlashGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              {[0,0.25,0.4,0.5,0.6,0.75,1].map((o,i) => <Stop key={i} offset={`${o*100}%`} stopColor={i===3?"#e0ffff":"#40e0d0"} stopOpacity={[0,0.4,0.8,1,0.8,0.4,0][i]}/>)}
            </SvgLinearGradient>
            <filter id="fourthGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#40e0d0" />
              <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#00ffff" floodOpacity="0.6" />
            </filter>
          </Defs>
          <Path d={electricPath3} stroke="url(#fourthFlashGrad)" strokeWidth="3" fill="none" filter="url(#fourthGlow)" />
        </Svg>
      </Animated.View>

      {/* Fifth electric surge layer */}
      <Animated.View style={[styles.electricFlash, { opacity: Animated.multiply(animValues.flashOpacity, electricOpacity * 0.7), top: 2 }]}>
        <Svg width="100%" height={HEX_HEIGHT} style={styles.flashSvg}>
          <Defs>
            <SvgLinearGradient id="fifthFlashGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              {[0,0.2,0.38,0.5,0.62,0.8,1].map((o,i) => <Stop key={i} offset={`${o*100}%`} stopColor={i===3?"#f0ffff":"#20b2aa"} stopOpacity={[0,0.35,0.75,1,0.75,0.35,0][i]}/>)}
            </SvgLinearGradient>
            <filter id="fifthGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#20b2aa" />
              <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#48d1cc" floodOpacity="0.5" />
            </filter>
          </Defs>
          <Path d={electricPath4} stroke="url(#fifthFlashGrad)" strokeWidth="2.5" fill="none" filter="url(#fifthGlow)" />
        </Svg>
      </Animated.View>

      {/* Sixth electric surge layer */}
      <Animated.View style={[styles.electricFlash, { opacity: Animated.multiply(animValues.flashOpacity, electricOpacity * 0.6), top: 2.5 }]}>
        <Svg width="100%" height={HEX_HEIGHT} style={styles.flashSvg}>
          <Defs>
            <SvgLinearGradient id="sixthFlashGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              {[0,0.22,0.42,0.5,0.58,0.78,1].map((o,i) => <Stop key={i} offset={`${o*100}%`} stopColor={i===3?"#e6fffa":"#008b8b"} stopOpacity={[0,0.3,0.7,1,0.7,0.3,0][i]}/>)}
            </SvgLinearGradient>
            <filter id="sixthGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#008b8b" />
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#5f9ea0" floodOpacity="0.4" />
            </filter>
          </Defs>
          <Path d={electricPath5} stroke="url(#sixthFlashGrad)" strokeWidth="2" fill="none" filter="url(#sixthGlow)" />
        </Svg>
      </Animated.View>

      {/* Seventh electric surge layer */}
      <Animated.View style={[styles.electricFlash, { opacity: Animated.multiply(animValues.flashOpacity, electricOpacity * 0.5), top: 3 }]}>
        <Svg width="100%" height={HEX_HEIGHT} style={styles.flashSvg}>
          <Defs>
            <SvgLinearGradient id="seventhFlashGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              {[0,0.24,0.44,0.5,0.56,0.76,1].map((o,i) => <Stop key={i} offset={`${o*100}%`} stopColor={i===3?"#f5fffa":"#2f4f4f"} stopOpacity={[0,0.25,0.65,1,0.65,0.25,0][i]}/>)}
            </SvgLinearGradient>
            <filter id="seventhGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#2f4f4f" />
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#708090" floodOpacity="0.3" />
            </filter>
          </Defs>
          <Path d={electricPath6} stroke="url(#seventhFlashGrad)" strokeWidth="1.8" fill="none" filter="url(#seventhGlow)" />
        </Svg>
      </Animated.View>

      {/* Now render the interactive/animated hexagon and particles inside a transformed Animated.View */}
      <Animated.View style={[positionStyle, { transform: [{ translateY: slideTransform }, { scale: animValues.scale }], opacity: animValues.opacity }]}>
        <Animated.View style={[styles.crackFlash, { opacity: animValues.crackFlash }]}><View style={styles.crackPattern} /></Animated.View>
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.container}>
          {/* Wrapper keeps hexagon (which is transformed) and particles (which should NOT be transformed) aligned */}
          <View style={styles.particleWrapper}>
            <Animated.View style={[styles.hexagonContainer, {
              transform: [
                { perspective: 2000 },
                // Combine hexagon Z-scale and the new hexagon shake scale (no explosion scale so the hexagon won't scale up/shrink)
                { scale: Animated.multiply(animValues.hexagonScaleZ.interpolate({ inputRange: [0.3, 1], outputRange: [0.3, 1] }), animValues.hexagonShakeScale) },
                { rotateX: animValues.hexagonRotateX.interpolate({ inputRange: [-90, 0, 90], outputRange: ['-90deg', '0deg', '90deg'] }) },
                { rotateY: animValues.hexagonRotateY.interpolate({ inputRange: [-90, 0, 90], outputRange: ['-90deg', '0deg', '90deg'] }) },
                { translateX: animValues.hexagonNudgeX },
                { translateY: animValues.hexagonNudgeY },
              ],
            }]}> 
              <Svg width={HEX_WIDTH} height={HEX_HEIGHT} style={styles.hexagonSvg}>
                <Polygon points={`${HEX_WIDTH*0.1},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.95},${HEX_HEIGHT*0.5} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.1},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.05},${HEX_HEIGHT*0.5}`} fill="#222831" opacity={0.8} />
                {/* Multiple hexagon strokes for glow effect without container visibility */}
                <AnimatedPolygon 
                  points={`${HEX_WIDTH*0.1},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.95},${HEX_HEIGHT*0.5} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.1},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.05},${HEX_HEIGHT*0.5}`} 
                  fill="none" 
                  stroke={toastConfig.borderColor} 
                  strokeWidth="2"
                  opacity={animValues.borderFlicker}
                />
                <AnimatedPolygon 
                  points={`${HEX_WIDTH*0.1},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.95},${HEX_HEIGHT*0.5} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.1},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.05},${HEX_HEIGHT*0.5}`} 
                  fill="none" 
                  stroke={toastConfig.borderColor} 
                  strokeWidth="1"
                  opacity={Animated.multiply(animValues.borderFlicker, 0.7)}
                />
                <AnimatedPolygon 
                  points={`${HEX_WIDTH*0.1},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.95},${HEX_HEIGHT*0.5} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.1},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.05},${HEX_HEIGHT*0.5}`} 
                  fill="none" 
                  stroke={toastConfig.borderColor} 
                  strokeWidth="1"
                  opacity={Animated.multiply(animValues.borderFlicker, 0.9)}
                />
                <AnimatedPolygon 
                  points={`${HEX_WIDTH*0.1},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.1666667} ${HEX_WIDTH*0.95},${HEX_HEIGHT*0.5} ${HEX_WIDTH*0.9},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.1},${HEX_HEIGHT*0.8333333} ${HEX_WIDTH*0.05},${HEX_HEIGHT*0.5}`} 
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="0.8"
                  opacity={Animated.multiply(animValues.borderFlicker, 0.5)}
                />
            </Svg>
            <View style={styles.toastContent}>
            <View style={styles.content}><Animated.Text style={[styles.message, { opacity: animValues.textFlicker }]} numberOfLines={3}>{message}</Animated.Text></View>
          </View>
          </Animated.View>

          {/* Particle layer: absolutely positioned inside the wrapper so it doesn't inherit hexagon transforms */}
          <Animated.View style={[styles.particleLayer, {
            // Counter the hexagon nudge translation so particles remain screen-fixed
            transform: [
              { translateX: Animated.multiply(animValues.hexagonNudgeX, -1) },
              { translateY: Animated.multiply(animValues.hexagonNudgeY, -1) },
            ]
          }]} pointerEvents="none">
            {particlesRef.current.map((p, i) => (
              <Animated.View
                key={`shard-${i}`}
                style={[styles.particle, {
                  backgroundColor: p.color,
                  opacity: p.animOpacity,
                  transform: [
                    { translateX: p.animX },
                    { translateY: p.animY },
                    { rotate: `${p.rotation}deg` },
                    { scale: p.animScale },
                  ],
                }]}
              >
                {/* small twinkle scale overlay using twinkle value if present */}
                {p.twinkle ? (
                  <Animated.View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, transform: [{ scale: p.twinkle }], backgroundColor: 'transparent' }} />
                ) : null}
              </Animated.View>
            ))}
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  </View>
  );
}

// --- Styles ---
type Styles = {
  container: ViewStyle;
  crackFlash: ViewStyle;
  crackPattern: ViewStyle;
  electricFlash: ViewStyle;
  flashSvg: ViewStyle;
  hexagonContainer: ViewStyle;
  hexagonSvg: ViewStyle;
  particle: ViewStyle;
  particleWrapper: ViewStyle;
  particleLayer: ViewStyle;
  toastContent: ViewStyle;
  content: ViewStyle;
  message: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: { alignItems: 'center' },
  crackFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', zIndex: 20, borderRadius: 10 },
  // Hide the visible dashed borderline while preserving the crackPattern element for layout/animation
  crackPattern: { flex: 1, borderWidth: 0, borderColor: 'transparent', borderStyle: 'solid', borderRadius: 15, opacity: 0 },
  electricFlash: { 
    position: 'absolute', 
    top: 0, 
    height: HEX_HEIGHT, 
    zIndex: 0, // Behind hexagon but above background
    overflow: 'visible', // Allow glow to extend beyond bounds
    left: -screenWidth * 0.25, // Start off-screen
    right: -screenWidth * 0.25, // End off-screen
    width: screenWidth * 1.5 // Full ribbon width across screen
  },
  flashSvg: { 
    position: 'absolute', 
    top: 0, 
    left: 0, // Center the SVG within the ribbon
    width: '100%',
    height: '100%',
    overflow: 'visible'
  },
  hexagonContainer: { position: 'relative', width: HEX_WIDTH, height: HEX_HEIGHT, justifyContent: 'center', alignItems: 'center', zIndex: 100, backgroundColor: 'transparent' },
  hexagonSvg: { ...StyleSheet.absoluteFillObject },
  particle: { position: 'absolute', width: 5 * TOAST_SCALE, height: 4 * TOAST_SCALE, borderRadius: 2 * TOAST_SCALE, zIndex: 120, pointerEvents: 'none' as any },
  particleWrapper: { width: HEX_WIDTH, height: HEX_HEIGHT, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  particleLayer: { position: 'absolute', left: 0, top: 0, width: HEX_WIDTH, height: HEX_HEIGHT, zIndex: 120, overflow: 'visible' },
  toastContent: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 50 * TOAST_SCALE, paddingVertical: 20 * TOAST_SCALE, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  message: { flex: 1, fontSize: 18 * TOAST_SCALE, fontWeight: '600', color: '#ffffff', textAlign: 'center', lineHeight: 24 * TOAST_SCALE, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1 * TOAST_SCALE, height: 1 * TOAST_SCALE }, textShadowRadius: 2 * TOAST_SCALE },
});