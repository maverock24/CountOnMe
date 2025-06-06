import TimerButton from '@/components/TimerButton';
import TimerItem from '@/components/TimerItem';
import { useData } from '@/components/data.provider';
import { useSound } from '@/components/sound.provider';
import { faBed, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, FeMerge, FeMergeNode, Filter } from 'react-native-svg';
import commonStyles from '../styles';
import ListTile from '@/components/ListTile';
import Colors from '@/constants/Colors';

const { height } = Dimensions.get('window');

const baseRadius = 140;
const radius = height > 800 ? baseRadius * 1.2 : baseRadius;

interface Timer {
  id: string;
  time: number;
  segment: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TabTwoScreen: React.FC = () => {
  const { workoutItems, isCountOnMeKey, audioEnabled, setAudioEnabled } = useData();

  const { audioReady, stopSound, playSegmentMusic } = useSound();

  const [timers, setTimers] = useState<Timer[]>([]);
  const noWorkout = workoutItems.length === 0;
  const totalTime = timers.reduce((acc, timer) => acc + timer.time, 0);

  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const [stopped, setStopped] = useState<boolean>(false);

  const [disabled, setDisabled] = useState<boolean>(true);

  useEffect(() => {
    if (timers.length > 0) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [timers]);

  useEffect(() => {
    if (time === 0 && currentIndex < timers.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setTime(timers[nextIndex].time);
      Animated.timing(translateY, {
        toValue: -nextIndex * height,
        duration: 500,
        useNativeDriver: true,
      }).start();
      setIsRunning(true);
    }
  }, [time, currentIndex, timers, height]);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => {
          const newElapsedTime = prev + 1;
          const progressValue = totalTime > 0 ? (newElapsedTime / totalTime) * 100 : 0;
          Animated.timing(progress, {
            toValue: progressValue,
            duration: 500,
            useNativeDriver: false,
          }).start();
          return newElapsedTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      if (currentIndex === timers.length - 1 && !stopped && timers.length > 0) {
        if (audioReady) {
          playSegmentMusic('successSound', handleReset);
        }
      }
    }
  }, [isRunning, currentIndex, timers.length, stopped, totalTime, audioReady]);

  const selectSet = (value: string) => {
    // Split the value string into an array of objects
    const items = value.split(';').map((time, index) => ({
      id: index.toString(),
      time: parseInt(time),
      segment: index % 2 === 0 ? 'workout' : 'break',
    }));

    setTimers(items);

    // Ensure we have valid data before setting time
    if (items.length > 0) {
      handleReset(items);
    }
  };

  const handleResetButtonPress = () => handleReset();

  const handleStart = () => {
    if (timers.length > 0) {
      // Make sure time is set if starting from 0
      if (time === 0 && timers[currentIndex]) {
        setTime(timers[currentIndex].time);
      }

      setIsRunning(true);
      setStopped(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setStopped(true);
    stopSound();
  };

  const handleReset = (items?: Timer[]) => {
    //stop any currently playing sounds
    stopSound();
    setStopped(true);
    setIsRunning(false);

    const timerItems = items || timers;
    if (timerItems.length > 0) {
      setTime(timerItems[0].time);
      setCurrentIndex(0);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Animated.timing(progress, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();

      setElapsedTime(0);
    }
  };

  const toggleSelectSet = (key: string, value: string) => {
    setSelectedItem((prev) => {
      if (prev === key) {
        handleReset();
        setTimers([]);
        setTime(0);
        return null;
      }
      selectSet(value);
      return key;
    });
  };

  const handleAddNew = () => {
    router.push('/three');
  };

  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        {/* Rest of your component remains the same */}
        <Text style={commonStyles.tileTitle}>Active Workout</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
            <View style={styles.timerContainer}>
              <Svg
                height={radius * 2 + strokeWidth}
                width={radius * 2 + strokeWidth}
                viewBox={`-15 -10 ${radius * 2 + strokeWidth + 30} ${
                  radius * 2 + strokeWidth + 30
                }`}
                style={[styles.progressCircle, { overflow: 'visible' }]}
              >
                <Defs>
                  <Filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <FeGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <FeMerge>
                      <FeMergeNode in="blur" />
                      <FeMergeNode in="SourceGraphic" />
                    </FeMerge>
                  </Filter>
                </Defs>
                <Circle
                  cx={radius + strokeWidth / 2}
                  cy={radius + strokeWidth / 2}
                  r={radius}
                  stroke="darkSlateGrey"
                  strokeWidth={strokeWidth}
                  fill="none"
                  {...({ collapsable: 'false' } as any)}
                />
                <AnimatedCircle
                  cx={radius + strokeWidth / 2}
                  cy={radius + strokeWidth / 2}
                  r={radius}
                  stroke={Colors.glow}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
                  filter="url(#glow)"
                  {...({ collapsable: 'false' } as any)}
                />
              </Svg>
              {timers.length > 0 &&
                isRunning &&
                (timers[currentIndex].segment === 'workout' ? (
                  <View style={styles.timerContainerActive}>
                    <FontAwesomeIcon icon={faRunning} size={30} color="white" />
                  </View>
                ) : (
                  <View style={styles.timerContainerSnooze}>
                    <FontAwesomeIcon icon={faBed} size={30} color="white" />
                  </View>
                ))}
              <View style={styles.timerContainerWrapper}>
                <TimerItem
                  title={timers.length > 0 ? timers[currentIndex].segment : ''}
                  key={`timer-${
                    timers.length > 0 ? timers[currentIndex].id : 'empty'
                  }-${currentIndex}`}
                  time={time}
                  isRunning={isRunning}
                  setIsRunning={setIsRunning}
                  setTime={setTime}
                  intervalRef={intervalRef}
                  soundEnabled={audioEnabled}
                />
                <View style={styles.nextTimerContainer}>
                  {timers.length > 0 && (
                    <Text style={styles.nextTimerText}>
                      Next:{' '}
                      {currentIndex < timers.length - 1
                        ? formatTime(timers[currentIndex + 1].time)
                        : 'Finished'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <TimerButton onPress={handleStart} disabled={disabled} text="Start" />
              <TimerButton onPress={handleStop} disabled={disabled} text="Stop" />
              <TimerButton onPress={handleResetButtonPress} disabled={disabled} text="Reset" />
            </View>
          </View>
        </View>
        <View style={commonStyles.outerContainer}>
          <Text style={commonStyles.tileTitle}>Workouts</Text>
          <View style={[commonStyles.tile, { flex: 1, padding: 5 }]}>
            {noWorkout && <TimerButton text="Add" onPress={handleAddNew} maxWidth />}
            {/* <View style={{ width: '95%', flex: 1 }}> */}
            <FlatList
              style={styles.listContainer}
              data={workoutItems}
              renderItem={({ item }) => (
                <ListTile
                  isSelected={selectedItem === item.key?.toString()}
                  title={item.key}
                  value={item.value}
                  currentIndex={currentIndex}
                  onPressTile={() => toggleSelectSet(item.key, item.value?.toString() ?? '')}
                />
              )}
              keyExtractor={(item) => item.key}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Your existing styles remain the same
  innerWrapperTopTile: {
    paddingTop: 0,
    paddingBottom: 20,
    width: '95%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  flatList: {
    flex: 1,
    marginBottom: 20,
    width: '100%',
  },
  icon: {
    fontSize: 120,
    color: '#fff',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], // Increase the size of the switch
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#101418',
  },
  timerContainerWrapper: {
    position: 'absolute',
    top: '40%',
    backgroundColor: 'transparent',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  switchLabel: {
    marginRight: 10,
    fontSize: 16,
    color: 'white',
  },
  listContainer: {
    marginTop: 5,
    backgroundColor: 'transparent',
    width: '100%',
  },
  timerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressCircle: {
    marginTop: 10,
  },
  timerContainerActive: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
    backgroundColor: 'green',
    width: 50,
    borderRadius: 50,
    padding: 10,
  },
  timerContainerSnooze: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
    backgroundColor: 'red',
    width: 50,
    borderRadius: 50,
    padding: 10,
  },
  nextTimerContainer: {
    alignItems: 'center',
  },
  nextTimerText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'darkgrey',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  count: {
    marginTop: -20,
    fontSize: 70,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default TabTwoScreen;
