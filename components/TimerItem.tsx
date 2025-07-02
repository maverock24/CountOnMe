import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';
import { Platform } from 'react-native';
import { useSound } from './sound.provider';

// Define the props for the TimerItem component
interface TimerItemProps {
  title: string; // The title of the timer item (e.g., 'workout' or 'break')
  time: number; // The remaining time in seconds
  isRunning: boolean; // Indicates if the timer is currently running
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>; // Function to update the running state
  setTime: React.Dispatch<React.SetStateAction<number>>; // Function to update the remaining time
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>; // Ref to store the interval ID
  soundEnabled: boolean; // Indicates if sound is enabled
}

// Helper function to format time in MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Module-scoped variable for tracking the current playing sound
let currentSound: Audio.Sound | null = null;

// Stop sound function
export const stopSound = async () => {
  if (!currentSound) return;

  try {
    const status = await currentSound.getStatusAsync();
    if (status.isLoaded) {
      if ((status as AVPlaybackStatusSuccess).isPlaying) {
        await currentSound.stopAsync();
      }
      await currentSound.unloadAsync();
    }
  } catch (error) {
    console.error('Error stopping sound:', error);
  } finally {
    currentSound = null;
  }
};

const TimerItem: React.FC<TimerItemProps> = ({
  title,
  time,
  isRunning,
  setIsRunning,
  setTime,
  intervalRef,
  soundEnabled,
}) => {
  const alarmPlayedRef = useRef(false);
  const { playSegmentMusic, audioReady, fadeOutSound } = useSound();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Play the appropriate sound when the timer starts
  useEffect(() => {
    let soundTimeout: NodeJS.Timeout | null = null;

    if (isRunning && soundEnabled && audioReady) {
      // Add slight delay for Android to ensure audio system is ready
      soundTimeout = setTimeout(
        () => {
          if (title === 'workout') {
            playSegmentMusic('workout');
          } else if (title === 'break') {
            playSegmentMusic('break');
          }
        },
        Platform.OS === 'android' ? 500 : 0
      );
    }

    return () => {
      if (soundTimeout) clearTimeout(soundTimeout);
    };
  }, [isRunning, soundEnabled, title, audioReady]);

  // Fade out sound as timer nears completion
  useEffect(() => {
    // Reset alarmPlayedRef when time changes to > 5
    if (time > 5) {
      alarmPlayedRef.current = false;
    }

    // Trigger fadeout when time gets low
    if (
      soundEnabled &&
      (title === 'break' || title === 'workout') &&
      time <= 4 &&
      time > 0 &&
      !alarmPlayedRef.current
    ) {
      fadeOutSound();
      alarmPlayedRef.current = true;
    }
  }, [time, soundEnabled, title]);

  // Timer interval logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, setTime, intervalRef]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound().catch((err) => console.error('Error stopping sound:', err));
    };
  }, []);

  return <Text style={styles.count}>{formatTime(time)}</Text>;
};

const styles = StyleSheet.create({
  count: {
    marginTop: -20,
    fontSize: 70,
    fontWeight: 'bold',
    color: 'white',
  },
});

// Export sound-related functions for use in parent components
export default TimerItem;
