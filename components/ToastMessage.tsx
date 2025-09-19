import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Defs, Path, Polygon, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

// Create animated SVG components
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

// A simple fallback for Colors constant if it's not available in your project.
const Colors = {
    glow: 'rgba(78, 230, 225, 0.8)',
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const baseAmplitude = 40;
  
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
    position: 'absolute', left: 0, right: 0, zIndex: 9999, alignItems: 'center', justifyContent: 'center',
  };
  switch (position) {
    case 'top': return { ...baseStyle, top: 60 };
    case 'center': return { ...baseStyle, top: Math.max((screenHeight - 120) / 2, 60), alignSelf: 'center' };
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
    pulse: new Animated.Value(1), flashOpacity: new Animated.Value(0), explosionScale: new Animated.Value(0),
    screenShakeX: new Animated.Value(0), screenShakeY: new Animated.Value(0), crackFlash: new Animated.Value(0),
    hexagonRotateX: new Animated.Value(-75), hexagonRotateY: new Animated.Value(0),
    hexagonScaleZ: new Animated.Value(0.3), hexagonTranslateZ: new Animated.Value(-200),
    borderFlicker: new Animated.Value(1), // New animated value for border flickering
  }).current;

  // Use state for visibility control and electric paths
  const [isVisible, setIsVisible] = useState(false);
  const [electricPath, setElectricPath] = useState('');
  const [electricPath2, setElectricPath2] = useState('');
  const [electricOpacity, setElectricOpacity] = useState(0.7);
  
  // Refs for animation loop control
  const animationFrameId = useRef<number>();
  const shouldAnimateElectric = useRef(false);

  const toastConfig = getToastConfig(type);

  // Optimized Tesla coil electricity animation - full-width ribbon surge
  const animateElectricity = () => {
    // Continue animating as long as shouldAnimateElectric is true
    if (!shouldAnimateElectric.current) {
      console.log('Animation stopped - electric animation disabled');
      return;
    }
    
    const centerY = 60;
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
    const electricPath1 = generateElectricPath(
      ribbonStartX, 
      ribbonEndX, 
      chaoticCenterY1
    );
    const electricPath2 = generateElectricPath(
      ribbonStartX, 
      ribbonEndX, 
      chaoticCenterY2
    );
    
    console.log('Electric ribbon paths generated:', { 
      path1Length: electricPath1.length, 
      path2Length: electricPath2.length,
      ribbonStartX,
      ribbonEndX,
      ribbonWidth,
      screenWidth,
      visible,
      shouldAnimateElectric: shouldAnimateElectric.current,
      chaoticCenterY1,
      chaoticCenterY2
    });
    
    setElectricPath(electricPath1);
    setElectricPath2(electricPath2);
    
    // Enhanced opacity calculation with chaotic variation - ENSURE MINIMUM VISIBILITY
    const baseOpacity = 0.7 + Math.random() * 0.2; // Higher base opacity
    const timeFlicker = Math.sin(time * 0.005) * 0.15;
    const chaoticFlicker = Math.sin(time * 0.012) * 0.1;
    const microFlicker = (Math.random() - 0.5) * 0.1;
    const suddenFlash = Math.random() > 0.9 ? 0.3 : 0; // Occasional bright flashes
    const opacity = baseOpacity + timeFlicker + chaoticFlicker + microFlicker + suddenFlash;
    setElectricOpacity(Math.max(0.5, Math.min(1.0, opacity))); // MINIMUM 0.5 opacity for visibility
    
    console.log('Electric opacity set:', opacity);
    
    // Variable timing for unpredictable flicker
    const baseInterval = 60;
    const randomVariation = Math.random() * 40;
    const chaoticVariation = Math.sin(time * 0.001) * 20;
    const interval = baseInterval + randomVariation + chaoticVariation;
    
    setTimeout(() => {
      requestAnimationFrame(animateElectricity);
    }, Math.max(20, interval)); // Ensure minimum 20ms interval
  };

  const animateIn = useCallback(() => {
    setIsVisible(true);
    shouldAnimateElectric.current = true;
    
    const createShakeSequence = (animValue: Animated.Value, intensity: number) => Animated.sequence([
      ...[intensity, -intensity*0.9, intensity*0.8, -intensity*0.7, intensity*0.6, -intensity*0.5, intensity*0.4, -intensity*0.3, intensity*0.2].map(toValue => 
        Animated.timing(animValue, { toValue, duration: 30, useNativeDriver: true })
      ),
      Animated.timing(animValue, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]);

    Animated.parallel([
      createShakeSequence(animValues.screenShakeX, 20),
      createShakeSequence(animValues.screenShakeY, 15),
      Animated.sequence([
        Animated.timing(animValues.crackFlash, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(animValues.crackFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.spring(animValues.explosionScale, { toValue: 1.1, tension: 800, friction: 8, useNativeDriver: true }),
        Animated.spring(animValues.explosionScale, { toValue: 1, tension: 250, friction: 12, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(50),
        Animated.parallel([
          Animated.spring(animValues.slide, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
          Animated.spring(animValues.scale, { toValue: 1, tension: 180, friction: 8, useNativeDriver: true }),
          Animated.timing(animValues.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(animValues.hexagonRotateX, { toValue: 5, tension: 150, friction: 10, useNativeDriver: true }),
          Animated.spring(animValues.hexagonScaleZ, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
          Animated.spring(animValues.hexagonTranslateZ, { toValue: 0, tension: 140, friction: 8, useNativeDriver: true }),
        ]),
        Animated.spring(animValues.hexagonRotateX, { toValue: -2, tension: 100, friction: 15, useNativeDriver: true }),
      ]),
    ]).start(() => {
      animateElectricity();
      Animated.loop(Animated.sequence([
        Animated.timing(animValues.pulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(animValues.pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(animValues.flashOpacity, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(animValues.flashOpacity, { toValue: 0.4 + Math.random() * 0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(animValues.flashOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      ])).start();
      // Border flickering animation
      Animated.loop(Animated.sequence([
        Animated.timing(animValues.borderFlicker, { toValue: 0.3, duration: 80 + Math.random() * 40, useNativeDriver: true }),
        Animated.timing(animValues.borderFlicker, { toValue: 1.0, duration: 60 + Math.random() * 30, useNativeDriver: true }),
        Animated.timing(animValues.borderFlicker, { toValue: 0.7, duration: 90 + Math.random() * 50, useNativeDriver: true }),
        Animated.timing(animValues.borderFlicker, { toValue: 1.0, duration: 70 + Math.random() * 35, useNativeDriver: true }),
        Animated.delay(200 + Math.random() * 300), // Random pause between flicker sequences
      ])).start();
    });
  }, [animValues]);

  const animateOut = useCallback(() => {
    shouldAnimateElectric.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    Animated.parallel([
      Animated.timing(animValues.flashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(animValues.scale, { toValue: 0.8, duration: 250, useNativeDriver: true }),
      Animated.timing(animValues.opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
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
        cancelAnimationFrame(animationFrameId.current);
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
  const combinedYTransform = Animated.add(slideTransform, animValues.screenShakeY);

  return (
    <Animated.View style={[positionStyle, {
      transform: [ { translateY: combinedYTransform }, { scale: animValues.scale }, { translateX: animValues.screenShakeX } ],
      opacity: animValues.opacity,
    }]}>
      <Animated.View style={[styles.crackFlash, { opacity: animValues.crackFlash }]}><View style={styles.crackPattern} /></Animated.View>
      
      <Animated.View style={[styles.electricFlash, { opacity: Animated.multiply(animValues.flashOpacity, electricOpacity) }]}>
        <Svg width="100%" height="120" style={styles.flashSvg}>
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
        <Svg width="100%" height="120" style={styles.flashSvg}>
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
        <Svg width="100%" height="120" style={styles.flashSvg}>
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

      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.container}>
        <Animated.View style={[styles.hexagonContainer, {
          transform: [
            { perspective: 2000 },
            { scale: Animated.multiply(animValues.explosionScale, animValues.hexagonScaleZ.interpolate({ inputRange: [0.3, 1], outputRange: [0.3, 1] })) },
            { rotateX: animValues.hexagonRotateX.interpolate({ inputRange: [-90, 0, 90], outputRange: ['-90deg', '0deg', '90deg'] }) },
            { rotateY: animValues.hexagonRotateY.interpolate({ inputRange: [-90, 0, 90], outputRange: ['-90deg', '0deg', '90deg'] }) },
            { translateX: animValues.hexagonTranslateZ },
          ],
        }]}>
          <Svg width="400" height="120" style={styles.hexagonSvg}>
            <Defs>
              <filter id="hexagonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={toastConfig.borderColor} />
              </filter>
            </Defs>
            <Polygon points="40,20 360,20 380,60 360,100 40,100 20,60" fill={toastConfig.backgroundColor} />
            <AnimatedPolygon 
              points="40,20 360,20 380,60 360,100 40,100 20,60" 
              fill="none" 
              stroke={toastConfig.borderColor} 
              strokeWidth="1.5" 
              filter="url(#hexagonGlow)"
              opacity={animValues.borderFlicker}
            />
          </Svg>
          <Animated.View style={[styles.toastContent, { transform: [{ scale: animValues.pulse }] }]}>
            <View style={styles.content}><Text style={styles.message} numberOfLines={3}>{message}</Text></View>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  crackFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#ffffff', zIndex: 20, borderRadius: 10 },
  crackPattern: { flex: 1, borderWidth: 1, borderColor: Colors.glow, borderStyle: 'dashed', borderRadius: 15, opacity: 0.8 },
  electricFlash: { 
    position: 'absolute', 
    top: 0, 
    height: 120, 
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
    height: '100%'
  },
  hexagonContainer: { position: 'relative', width: 400, height: 120, justifyContent: 'center', alignItems: 'center', zIndex: 100, backgroundColor: 'transparent' },
  hexagonSvg: { ...StyleSheet.absoluteFillObject },
  toastContent: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 50, paddingVertical: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  message: { flex: 1, fontSize: 18, fontWeight: '600', color: '#ffffff', textAlign: 'left', lineHeight: 24, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
});