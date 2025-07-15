import { faArrowDown, faArrowUp, faBed, faGripVertical, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, FeMerge, FeMergeNode, Filter } from 'react-native-svg';

import { useData } from '@/components/data.provider';
import ListTile from '@/components/ListTile';
import { useSound } from '@/components/sound.provider';
import TimerButton from '@/components/TimerButton';
import TimerItem from '@/components/TimerItem';
import Colors from '@/constants/Colors';

import CustomPicker from '@/components/CustomPicker';
import commonStyles from '../styles';

const { height } = Dimensions.get('window');

const baseRadius = 120;
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
  const { 
    workoutItems, 
    groupItems, 
    isCountOnMeKey, 
    audioEnabled, 
    setAudioEnabled, 
    currentMusicBeingPlayed, 
    getOrderedWorkoutsForGroup,
    reorderWorkoutInGroup,
    reload
  } = useData();

  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // State for managing workout order
  const [reorderableWorkouts, setReorderableWorkouts] = useState<any[]>([]);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [globalWorkoutOrder, setGlobalWorkoutOrder] = useState<string[]>([]);

  const groupData = [
    { label: 'All', value: 'All' },
    ...groupItems.map(group => ({ label: group.name, value: group.name }))
  ];

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

  // Load saved workout order on component mount
  useEffect(() => {
    const loadWorkoutOrder = async () => {
      try {
        const savedOrder = await AsyncStorage.getItem('@countOnMe_workoutOrder');
        if (savedOrder) {
          setGlobalWorkoutOrder(JSON.parse(savedOrder));
        }
      } catch (error) {
        console.error('Error loading workout order:', error);
      }
    };
    loadWorkoutOrder();
  }, []);

  // Auto-progression functionality
  const autoSelectNextWorkout = () => {
    if (!selectedItem) return;
    
    const currentWorkouts = orderedWorkouts;
    const currentWorkoutIndex = currentWorkouts.findIndex(workout => workout.name === selectedItem);
    if (currentWorkoutIndex === -1 || currentWorkoutIndex >= currentWorkouts.length - 1) {
      // No next workout available
      return;
    }
    
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
        setIsRunning(true);
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
      
          playSegmentMusic('successSound', () => {
            // Workout completed, try to auto-progress to next workout
            setTimeout(() => {
              autoSelectNextWorkout();
            }, 1000); // Give time for success sound to play
          });
          }
        } else {
          // No audio, proceed immediately with auto-progression
          setTimeout(() => {
            autoSelectNextWorkout();
          }, 500);
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

  const handleGroupChange = (groupName: string) => {
    setSelectedGroup(groupName);
  };

  // Functions for handling workout reordering
  const moveWorkoutUp = (index: number) => {
    if (index > 0) {
      const newWorkouts = [...reorderableWorkouts];
      [newWorkouts[index], newWorkouts[index - 1]] = [newWorkouts[index - 1], newWorkouts[index]];
      setReorderableWorkouts(newWorkouts);
    }
  };

  const moveWorkoutDown = (index: number) => {
    if (index < reorderableWorkouts.length - 1) {
      const newWorkouts = [...reorderableWorkouts];
      [newWorkouts[index], newWorkouts[index + 1]] = [newWorkouts[index + 1], newWorkouts[index]];
      setReorderableWorkouts(newWorkouts);
    }
  };

  const toggleReorderMode = async () => {
    if (!isReorderMode) {
      // Enter reorder mode - copy current workouts to reorderable state
      setReorderableWorkouts([...orderedWorkouts]);
    } else {
      // Exit reorder mode - save the new order
      if (selectedGroup !== 'All') {
        // Save the new order for the specific group by updating localStorage directly
        try {
          const groupKey = `@countOnMe_group_${selectedGroup}`;
          const existingGroupData = await AsyncStorage.getItem(groupKey);
          
          if (existingGroupData) {
            const groupData = JSON.parse(existingGroupData);
            
            // Update the workouts array with new order
            const updatedWorkouts = reorderableWorkouts.map((workout, index) => ({
              orderId: index + 1,
              name: workout.name
            }));
            
            // Update the group data
            const updatedGroupData = {
              ...groupData,
              workouts: updatedWorkouts
            };
            
            // Save back to localStorage
            await AsyncStorage.setItem(groupKey, JSON.stringify(updatedGroupData));
            
            // Reload data provider to reflect changes
            await reload();
            
            console.log('Group workout order saved successfully');
          }
        } catch (error) {
          console.error('Error saving group workout order:', error);
        }
      } else {
        // For 'All' workouts, create or update a special "All" group
        try {
          const allGroupKey = '@countOnMe_group_All';
          
          // Create the workouts array with new order
          const updatedWorkouts = reorderableWorkouts.map((workout, index) => ({
            orderId: index + 1,
            name: workout.name
          }));
          
          // Create or update the "All" group data
          const allGroupData = {
            name: 'All',
            workouts: updatedWorkouts
          };
          
          // Save to localStorage
          await AsyncStorage.setItem(allGroupKey, JSON.stringify(allGroupData));
          
          // Reload data provider to reflect changes
          await reload();
          
          console.log('Global workout order saved successfully');
        } catch (error) {
          console.error('Error saving global workout order:', error);
        }
      }
    }
    setIsReorderMode(!isReorderMode);
  };

  const filteredWorkouts = selectedGroup === 'All' 
    ? workoutItems 
    : getOrderedWorkoutsForGroup(selectedGroup);

  // Apply saved global order to workouts when in 'All' mode
  const getOrderedWorkouts = () => {
    if (selectedGroup !== 'All') {
      return filteredWorkouts;
    }
    
    // Check if there's an "All" group with saved order
    const allGroup = groupItems.find(group => group.name === 'All');
    if (allGroup && allGroup.workouts.length > 0) {
      // Use the group ordering function for the "All" group
      return getOrderedWorkoutsForGroup('All');
    }
    
    // Fallback to original workout order if no "All" group exists
    if (globalWorkoutOrder.length === 0) {
      return filteredWorkouts;
    }
    
    // Sort workouts according to saved order (legacy support)
    const orderedWorkouts = [];
    const remainingWorkouts = [...filteredWorkouts];
    
    // First, add workouts in the saved order
    globalWorkoutOrder.forEach(workoutName => {
      const workoutIndex = remainingWorkouts.findIndex(w => w.name === workoutName);
      if (workoutIndex !== -1) {
        orderedWorkouts.push(remainingWorkouts[workoutIndex]);
        remainingWorkouts.splice(workoutIndex, 1);
      }
    });
    
    // Then, add any new workouts that weren't in the saved order
    orderedWorkouts.push(...remainingWorkouts);
    
    return orderedWorkouts;
  };

  const orderedWorkouts = getOrderedWorkouts();

  // Use reorderable workouts when in reorder mode, otherwise use ordered workouts
  const displayWorkouts = isReorderMode ? reorderableWorkouts : orderedWorkouts;

  // Custom render item for reorderable list
  const renderWorkoutItem = ({ item, index }: { item: any, index: number }) => {
    if (isReorderMode) {
      return (
        <View style={styles.reorderableItem}>
          <View style={styles.reorderControls}>
            <TouchableOpacity 
              onPress={() => moveWorkoutUp(index)}
              disabled={index === 0}
              style={[styles.reorderButton, index === 0 && styles.disabledButton]}
            >
              <FontAwesomeIcon 
                icon={faArrowUp} 
                size={16} 
                color={index === 0 ? '#666' : '#fff'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => moveWorkoutDown(index)}
              disabled={index === displayWorkouts.length - 1}
              style={[styles.reorderButton, index === displayWorkouts.length - 1 && styles.disabledButton]}
            >
              <FontAwesomeIcon 
                icon={faArrowDown} 
                size={16} 
                color={index === displayWorkouts.length - 1 ? '#666' : '#fff'} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.workoutInfo}>
            <ListTile
              isSelected={false}
              title={item.name}
              value={item.workout}
              currentIndex={currentIndex}
              onPressTile={() => {}} // Disabled in reorder mode
            />
          </View>
          <View style={styles.gripHandle}>
            <FontAwesomeIcon icon={faGripVertical} size={20} color="#666" />
          </View>
        </View>
      );
    } else {
      return (
        <ListTile
          isSelected={selectedItem === item.name}
          title={item.name}
          value={item.workout}
          currentIndex={currentIndex}
          onPressTile={() => toggleSelectSet(item.name, item.workout)}
        />
      );
    }
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
                  <Circle
                    cx={radius + strokeWidth / 2}
                    cy={radius + strokeWidth / 2}
                    r={radius}
                    stroke="#2A2E33"
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
                    transform={`rotate(-90 ${radius + strokeWidth / 2} ${
                      radius + strokeWidth / 2
                    })`}
                    filter="url(#glow)"
                    {...({ collapsable: 'false' } as any)}
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
            <CustomPicker
              containerStyle={{ margin: 2, justifyContent: 'center', width: 150 }}
              style={{ alignSelf: 'center', justifyContent: 'center'}}
              selectedValue={selectedGroup}
              onValueChange={handleGroupChange}
              items={groupData}
              dropdownIconColor="#fff"
            />

              {/* <TouchableOpacity 
                style={[styles.reorderToggleButton, isReorderMode && styles.reorderToggleButtonActive]}
                onPress={toggleReorderMode}
              >
                <FontAwesomeIcon 
                  icon={faGripVertical} 
                  size={16} 
                  color={isReorderMode ? '#000' : '#fff'} 
                />
                <Text style={[styles.reorderToggleText, isReorderMode && styles.reorderToggleTextActive]}>
                  {isReorderMode ? t('done') || 'Done' : t('reorder') || 'Reorder'}
                </Text>
              </TouchableOpacity> */}
              <TimerButton 
                text={isReorderMode ? t('done') || 'Done' : t('reorder') || 'Reorder'}
                onPress={toggleReorderMode}
                isSelected={isReorderMode}
                style={{ width:100}}
              />
            </View>
            
            {/* Reorder Mode Toggle */}
          
      
            {noWorkout && <TimerButton text={t('add_button')} onPress={handleAddNew} maxWidth />}
            
            <FlatList
              style={styles.listContainer}
              data={displayWorkouts}
              renderItem={renderWorkoutItem}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={false}
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
  // Reorder mode styles
  reorderToggleContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  reorderToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2E33',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  reorderToggleButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#2A2E33',
  },
  reorderToggleText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  reorderToggleTextActive: {
    color: '#000',
  },
  reorderableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1E23',
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  reorderControls: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reorderButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 4,
    padding: 6,
    marginVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
  },
  disabledButton: {
    backgroundColor: '#1A1A1A',
    opacity: 0.5,
  },
  workoutInfo: {
    flex: 1,
    paddingRight: 10,
  },
  gripHandle: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabTwoScreen;

