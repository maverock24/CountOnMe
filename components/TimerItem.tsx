import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { useData } from './data.provider';

// Define the props for the TimerItem component
interface TimerItemProps {
  onSegmentChange?: (newSegment: string) => void; // Optional callback when segment changes
}

// Helper function to format time in MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const TimerItem: React.FC<TimerItemProps> = ({
  onSegmentChange,
}) => {
  // Get centralized timer state and functions
  const { 
    timerIsRunning: isRunning,
    timerCurrentTime: time,
    timerCurrentIndex: currentIndex,
    timers,
    updateTimerTime,
    setCurrentIndex,
    incrementElapsedTime,
    stopTimer,
    getCurrentSegment
  } = useData();
  
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const prevTitleRef = useRef<string | null>(null); // Track title changes for segment callbacks
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current title from centralized state
  const title = getCurrentSegment();

  // Handle segment changes and notify parent
  useEffect(() => {
    const prevTitle = prevTitleRef.current;
    
    // Only notify on actual title changes while running
    if (isRunning && title !== prevTitle && prevTitle !== null && onSegmentChange) {
      onSegmentChange(title);
    }
    
    prevTitleRef.current = title;
  }, [title, isRunning, onSegmentChange]);

  // Timer display logic - NO interval management here (handled by data provider)
  // This component is now purely for display and segment change notifications
  useEffect(() => {
    // Clean up any existing intervals when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Pulse animation: run when isRunning is true
  useEffect(() => {
    if (isRunning) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.04,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ])
      );
      pulseAnimation.start();
      pulseAnimationRef.current = pulseAnimation;
    } else {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
        pulseAnimationRef.current = null;
      }
      scaleValue.setValue(1);
    }
  }, [isRunning, scaleValue]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Text style={styles.count}>{formatTime(time)}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  count: {
    marginTop: -20,
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default TimerItem;
