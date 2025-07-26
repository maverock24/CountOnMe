import { faBed, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, FeMerge, FeMergeNode, Filter } from 'react-native-svg';

import { useData } from '@/components/data.provider';
import ReorderableWorkoutList from '@/components/ReorderableWorkoutList';
import { useSound } from '@/components/sound.provider';
import TimerButton from '@/components/TimerButton';
import TimerItem from '@/components/TimerItem';
import Colors from '@/constants/Colors';

import commonStyles from '../styles';

const { height } = Dimensions.get('window');

const baseRadius = 120;
const radius = height > 800 ? baseRadius * 1.2 : baseRadius;

interface Timer {
  id: string;
  time: number;
  segment: string;
}

interface WorkoutItem {
  name: string;
  workout: string;
  group?: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Create a wrapper to filter out React Native specific props
const CircleWrapper = (props: any) => {
  const { collapsable, ...svgProps } = props;
  return <Circle {...svgProps} />;
};

const AnimatedCircle = Animated.createAnimatedComponent(CircleWrapper);

const TabTwoScreen: React.FC = () => {
  const { 
    workoutItems, 
    groupItems, 
    audioEnabled, 
    setAudioEnabled, 
    currentMusicBeingPlayed, 
    getOrderedWorkoutsForGroup,
    reload
  } = useData();

  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  console.log('workoutItems', workoutItems);

  // Remove duplicate 'All' entry in groupData
  const groupData = [
    ...groupItems.filter(group => group.name.toLowerCase() !== 'all').map(group => ({ label: group.name, value: group.name })),
  ];
  // Add 'All' at the top
  groupData.unshift({ label: 'All', value: 'All' });

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

  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const [progressKey, setProgressKey] = useState(0);

  const { t } = useTranslation();

  // Auto-progression functionality
  const autoSelectNextWorkout = () => {
    if (!selectedItem) return;

    const currentWorkouts = orderedWorkouts;
    const currentWorkoutIndex = currentWorkouts.findIndex(workout => workout.name === selectedItem);
    if (currentWorkoutIndex === -1 || currentWorkoutIndex >= currentWorkouts.length - 1) {
      // No next workout available
      return;
    }

    // Perform a full reset before moving to the next workout
    handleReset();

    const nextWorkout = currentWorkouts[currentWorkoutIndex + 1];

    // Complete reset of current state
    stopSound();
    setIsRunning(false);
    setStopped(true);

    // Clear any running intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset all timing and progress state
    setElapsedTime(0);
    setCurrentIndex(0);
    progress.setValue(0);

    // Reset animation
    Animated.timing(translateY, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start();

    // Small delay to ensure state is completely reset
    setTimeout(() => {
      // Select the next workout
      setSelectedItem(nextWorkout.name);

      // Parse and set up the new workout
      const newTimers = nextWorkout.workout.split(';').map((time, index) => ({
        id: index.toString(),
        time: parseInt(time),
        segment: index % 2 === 0 ? 'workout' : 'break',
      }));

      setTimers(newTimers);

      // Set initial time for the first segment of new workout
      if (newTimers.length > 0) {
        setTime(newTimers[0].time);
      }

      // Force re-render with new progress key
      setProgressKey((k) => k + 1);

      // Start the next workout after a brief pause
      setTimeout(() => {
        setStopped(false);
        stopSound();
        setTimeout(() => {
          if (newTimers.length > 0) {
            playSegmentMusic('actionSound');
          }
          setIsRunning(true);
        }, 200);
      }, 800);
    }, 200);
  };

  useEffect(() => {
    let pulseDuration = 350;
    let pulseUpDuration = 125;
    if (isRunning && currentMusicBeingPlayed) {
      if (currentMusicBeingPlayed.toLowerCase().includes('chill:')) {
        pulseDuration += 1000;
        pulseUpDuration += 1000;
      }
    }
    if (isRunning) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.01,
            duration: pulseUpDuration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: pulseDuration,
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
  }, [isRunning, scaleValue, currentMusicBeingPlayed]);

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
          if(audioEnabled) {
            const currentWorkoutIndex = orderedWorkouts.findIndex(workout => workout.name === selectedItem);
            if (currentWorkoutIndex < orderedWorkouts.length - 1) {
              playSegmentMusic('nextExerciseSound', () => {
                // Workout completed, try to auto-progress to next workout
                setTimeout(() => {
                  autoSelectNextWorkout();
                }, 1000); // Give time for success sound to play
              });
            } else {
              playSegmentMusic('successSound', () => {
                // Last workout finished, reset the timer
                setTimeout(() => {
                  handleReset();
                }, 1000);
              });
            }
          }
        } else {
          // No audio, proceed immediately with auto-progression or reset
          const currentWorkoutIndex = orderedWorkouts.findIndex(workout => workout.name === selectedItem);
          if (currentWorkoutIndex < orderedWorkouts.length - 1) {
            setTimeout(() => {
              autoSelectNextWorkout();
            }, 500);
          } else {
            setTimeout(() => {
              handleReset();
            }, 500);
          }
        }
      }
    }
  }, [isRunning, currentIndex, timers.length, stopped, totalTime, audioReady]);

  // Ensure progress is set to 100 when timer completes
  useEffect(() => {
    if (elapsedTime >= totalTime && totalTime > 0) {
      progress.setValue(100);
    }
  }, [elapsedTime, totalTime, progress]);

  const selectSet = (workout: string) => {
    // Stop any currently running timer first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Split the workout string into an array of objects
    const items = workout.split(';').map((time, index) => ({
      id: index.toString(),
      time: parseInt(time),
      segment: index % 2 === 0 ? 'workout' : 'break',
    }));

    // Set the new timers
    setTimers(items);

    // Ensure we have valid data before setting time
    if (items.length > 0) {
      // Reset all progress and timing state
      progress.setValue(0);
      setElapsedTime(0);
      setCurrentIndex(0);
      setTime(items[0].time); // Set to first segment time
      setProgressKey((k) => k + 1); // force re-render
      
      // Reset animation position
      Animated.timing(translateY, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();
      
      // Ensure stopped state
      setStopped(true);
      setIsRunning(false);
    }
  };

  const handleGroupChange = (groupName: string) => {
    setSelectedGroup(groupName);
  };

  const handleReorderComplete = async () => {
    // Refresh the data after reordering is complete
    await reload();
  };

  // Workouts are now loaded and ordered by ReorderableWorkoutList
  const [orderedWorkouts, setOrderedWorkouts] = useState<WorkoutItem[]>([]);

  const toggleSelectSet = (name: string, workout: string) => {
    setSelectedItem((prev) => {
      if (prev === name) {
        handleReset();
        setTimers([]);
        setTime(0);
        return null;
      }
      selectSet(workout);
      return name;
    });
  };

  const handleResetButtonPress = () => handleReset();

  const handleStart = () => {
    if (timers.length > 0) {
      if (totalTime > 0 && elapsedTime >= totalTime) {
        handleReset();
      }

      setTimeout(() => {
        if (time === 0 && timers[currentIndex]) {
          setTime(timers[currentIndex].time);
        }
        setIsRunning(true);
        setStopped(false);
      }, 0);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setStopped(true);
    stopSound();
    // If timer is at the end, force progress to 100
    if (elapsedTime >= totalTime && totalTime > 0) {
      progress.setValue(100);
    }
  };

  const handleReset = (items?: Timer[]) => {
    // Stop any currently playing sounds
    stopSound();
    
    // Clear any running intervals first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset state flags
    setStopped(true);
    setIsRunning(false);

    const timerItems = items || timers;
    if (timerItems.length > 0) {
      // Reset to first timer
      setTime(timerItems[0].time);
      setCurrentIndex(0);

      // Reset animations
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Reset progress and elapsed time
      progress.setValue(0);
      setElapsedTime(0);
      setProgressKey((k) => k + 1); // force re-render
    } else {
      // No timers available
      setTime(0);
      setCurrentIndex(0);
      setElapsedTime(0);
      progress.setValue(100);
      setProgressKey((k) => k + 1); // force re-render
    }
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

  useEffect(() => {
    if (!audioEnabled) {
      stopSound();
    } else if (audioEnabled && isRunning && timers.length > 0 && timers[currentIndex]) {
      // Play current segment music when sound is enabled and timer is running
      const segment = timers[currentIndex].segment;
      if (segment === 'workout') {
        playSegmentMusic('actionSound');
      } else if (segment === 'break') {
        playSegmentMusic('breakSound');
      }
    }
  }, [audioEnabled]);

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        {/* Rest of your component remains the same */}
        <Text style={commonStyles.tileTitle}>{t('active_workout')}</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
            <View style={styles.timerContainer}>
              <View
                style={{
                  zIndex: 999,
                  position: 'absolute',
                  top: '65%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={styles.label}>{t('sound_on_off')}</Text>
                <Switch
                  // style={{ marginRight: 10, marginTop: 10 }}
                  // trackColor={{ false: 'gray', true: 'white' }}
                  // thumbColor={audioEnabled ? 'white' : 'gray'}
                  onValueChange={setAudioEnabled}
                  value={audioEnabled}
                />
              </View>
              <Text style={styles.currentMusicLabel}>
                {isRunning ? t('playing') + ' ' + currentMusicBeingPlayed : ''}
              </Text>
              <Animated.View key={progressKey} style={{ transform: [{ scale: scaleValue }] }}>
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
                      <FeGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                      <FeMerge>
                        <FeMergeNode in="blur" />
                        <FeMergeNode in="SourceGraphic" />
                      </FeMerge>
                    </Filter>
                  </Defs>
                  <CircleWrapper
                    cx={radius + strokeWidth / 2}
                    cy={radius + strokeWidth / 2}
                    r={radius}
                    stroke="#2A2E33"
                    strokeWidth={strokeWidth}
                    fill="none"
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
                    transform={`rotate(-90 ${radius + strokeWidth / 2} ${
                      radius + strokeWidth / 2
                    })`}
                    filter="url(#glow)"
                  />
                </Svg>
              </Animated.View>
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
                {/* <View style={styles.nextTimerContainer}>
                  {timers.length > 0 && (
                    <Text style={styles.nextTimerText}>
                {t('next')}{' '}
                {currentIndex < timers.length - 1
                  ? formatTime(timers[currentIndex + 1].time)
                  : t('finished')}
              </Text>
                  )}
                </View> */}
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <TimerButton
                style={{ width: 100 }}
                onPress={handleStart}
                disabled={disabled}
                text={t('start')}
                small
              />
              <TimerButton
                style={{ width: 100 }}
                onPress={handleStop}
                disabled={disabled}
                text={t('stop')}
                small
              />
              <TimerButton
                style={{ width: 100 }}
                onPress={handleResetButtonPress}
                disabled={disabled}
                text={t('reset')}
                small
              />
            </View>
          </View>
        </View>
        <View style={commonStyles.outerContainer}>
          <Text style={commonStyles.tileTitle}>{t('workouts')}</Text>
          <View style={[commonStyles.tile, { flex: 1, padding: 5 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            {/* <Text style={styles.label}>{t('select_workout_group')}</Text> */}
            {/* CustomPicker is now rendered inside ReorderableWorkoutList */}
            </View>
            
            {noWorkout && <TimerButton text={t('add_button')} onPress={handleAddNew} maxWidth />}
            
            <ReorderableWorkoutList
              key={`${selectedGroup}-${groupItems.length}`}
              groupData={groupData}
              selectedGroup={selectedGroup}
              onGroupChange={handleGroupChange}
              selectedItem={selectedItem}
              selectedItems={selectedItem ? new Set([selectedItem]) : new Set()}
              onWorkoutSelect={toggleSelectSet}
              currentIndex={currentIndex}
              showReorderButton={true}
              onReorderComplete={handleReorderComplete}
              onWorkoutsChanged={setOrderedWorkouts}  
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginTop: 0,
    marginRight: 10,
    fontSize: 14,
    color: 'lightgray',
    marginBottom: 5,
    
  },
  currentMusicLabel: {
    position: 'absolute',
    top: '99%',
    fontSize: 12,
    color: 'lightgray',
    marginTop: 2,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
    textAlign: 'center',
  },
  // Your existing styles remain the same
  innerWrapperTopTile: {
    paddingTop: 0,
    paddingBottom: 5,
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
    top: '45%',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: 'darkgrey',
    opacity: 0.6,
  },
  buttonContainer: {
    marginTop: 20,
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

