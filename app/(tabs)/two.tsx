import { faBed, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, FeMerge, FeMergeNode, Filter } from 'react-native-svg';

import { useData } from '@/components/data.provider';
import { WorkoutItem } from '@/components/data/types';
import ReorderableWorkoutList from '@/components/ReorderableWorkoutList';
import TimerButton from '@/components/TimerButton';
import TimerItem from '@/components/TimerItem';
import Colors from '@/constants/Colors';
import { clearSeededProgressions, seedProgressionGroupsToStorage } from '@/utils/progressionStorage';

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

// Create a wrapper to filter out React Native specific props
const CircleWrapper = React.forwardRef((props: any, ref: any) => {
  const { collapsable, ...svgProps } = props;
  return <Circle {...svgProps} ref={ref} />;
});

const AnimatedCircle = Animated.createAnimatedComponent(CircleWrapper);

const TabTwoScreen: React.FC = () => {
  const { 
    workoutItems, 
    groupItems, 
    audioEnabled, 
    setAudioEnabled, 
    currentMusicBeingPlayed, 
    getOrderedWorkoutsForGroup,
    reload,
    // Centralized Timer & Sound Management functions
    handleTimerStart,
    handleTimerStop,
    handleTimerReset,
    handleTimerSegmentChange,
    handleAudioToggle,
    // Centralized Timer State
    timerIsRunning: isRunning,
    timerCurrentTime: time,
    timerCurrentIndex: currentIndex,
    timerElapsedTime: elapsedTime,
    timers,
    timerStopped: stopped,
    timerDisabled: disabled,
    timerSelectedItem: selectedItem,
    timerProgressKey: progressKey,
    // Centralized Timer Actions
    startTimer,
    stopTimer,
    resetTimer,
    setTimers,
    setTimerSelectedItem,
    updateTimerTime,
    setCurrentIndex,
    incrementElapsedTime,
    setWorkoutCompleteCallback,
    handleWorkoutCompleteFlow,
    getCurrentSegment,
    getTotalTime
  } = useData();

  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  // Track whether single-select mode is enabled in the list
  const [singleSelectMode, setSingleSelectMode] = useState<boolean>(false);
  // Controls visibility of the selected group's description modal
  const [groupDescVisible, setGroupDescVisible] = useState<boolean>(false);
  const [currentGroupDescription, setCurrentGroupDescription] = useState<string | null>(null);

  // Remove duplicate 'All' entry in groupData
  const groupData = [
    ...groupItems.filter(group => group.name.toLowerCase() !== 'all').map(group => ({ label: group.name, value: group.name })),
  ];
  // Add 'All' at the top
  groupData.unshift({ label: 'All', value: 'All' });

  const noWorkout = workoutItems.length === 0;
  const totalTime = getTotalTime();

  // Keep local refs for animations and UI
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Keep local functions for UI-specific state only
  const setProgressKey = (value: number | ((prev: number) => number)) => {
    // This will be handled by centralized timer state - kept for compatibility
  };
  const setSelectedItem = (value: string | null | ((prev: string | null) => string | null)) => {
    const newValue = typeof value === 'function' ? value(selectedItem) : value;
    setTimerSelectedItem(newValue);
  };

  const { t } = useTranslation();

  // Seed progressions into AsyncStorage when the app has no groups yet.
  // This runs only once on mount and only if groupItems is empty.
  useEffect(() => {
    let mounted = true;
    async function seedIfNeeded() {
      try {
        if (mounted && (!groupItems || groupItems.length === 0)) {
          const result = await seedProgressionGroupsToStorage();
          // After seeding, tell provider to reload data so groupItems/workoutItems reflect new keys
          if (result.success) {
            await reload();
          } else {
            console.warn('Seeding progressions failed', result.error);
          }
        }
      } catch (err) {
        console.warn('seedIfNeeded error', err);
      }
    }
    seedIfNeeded();
    return () => { mounted = false; };
  }, []);

  // Development helper: if running in DEV, clear previously seeded progression keys and force a reseed.
  // This ensures component-level entries (e.g. @countOnMe_Push-ups) are created during development tests.
  useEffect(() => {
    if (!__DEV__) return;
    let mounted = true;
    (async () => {
      try {
        // DEV: clear seeded progression keys (no reseed) to remove previously created items
        const res = await clearSeededProgressions();
        if (mounted) await reload();
        console.log('[dev clearSeededProgressions]', res);
      } catch (err) {
        console.warn('[dev clearSeededProgressions] error', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
    // This is now handled by centralized timer state - disabled is computed automatically
  }, [timers]);

  useEffect(() => {
    // Timer progression is now handled entirely by centralized timer management in data provider
    // This useEffect is kept for UI animations only
    if (time === 0 && currentIndex < timers.length - 1) {
      // Only handle UI animations - timer progression is centralized
      const nextIndex = currentIndex + 1;
      Animated.timing(translateY, {
        toValue: -nextIndex * height,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [time, currentIndex, timers, height]);

  useEffect(() => {
    // Progress animation based on current segment completion
    let progressValue = 0;
    
    if (timers.length > 0 && currentIndex < timers.length) {
      const currentTimer = timers[currentIndex];
      const currentSegmentTime = currentTimer.time;
      
      // Calculate progress within the current segment (0-100)
      // When time decreases from initial value to 0, progress should increase from 0 to 100
      if (currentSegmentTime > 0) {
        progressValue = ((currentSegmentTime - time) / currentSegmentTime) * 100;
        // Ensure progress is between 0 and 100
        progressValue = Math.max(0, Math.min(100, progressValue));
      }
    }
    
    Animated.timing(progress, {
      toValue: progressValue,
      duration: 200, // Shorter duration for smoother updates
      useNativeDriver: false,
    }).start();
  }, [time, currentIndex, timers, progress]);

  const selectSet = (workout: string) => {
    // Stop any currently running timer first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log(`[selectSet] Parsing workout string: "${workout}"`);
    
    // Split the workout string into an array of objects
    const items = workout.split(';').map((time, index) => ({
      id: index.toString(),
      time: parseInt(time),
      segment: index % 2 === 0 ? 'workout' : 'break',
    }));

    console.log(`[selectSet] Parsed segments:`, items.map((item, i) => `${i}: ${item.time}s ${item.segment}`));

    // Set the new timers
    setTimers(items);

    // Ensure we have valid data before setting time
    if (items.length > 0) {
      // Reset all progress and timing state
      progress.setValue(0);
      setCurrentIndex(0);
      updateTimerTime(items[0].time); // Set to first segment time
      setProgressKey((k: number) => k + 1); // force re-render
      
      // Reset animation position
      Animated.timing(translateY, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();
      
      // Centralized timer reset handles stopped and isRunning state
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
        updateTimerTime(0);
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
        resetTimer();
      }

      setTimeout(() => {
        if (time === 0 && timers[currentIndex]) {
          updateTimerTime(timers[currentIndex].time);
        }
        
        // Use centralized timer start
        const currentSegment = timers.length > 0 ? timers[currentIndex].segment : '';
        if (currentSegment) {
          startTimer(currentSegment);
        }
      }, 0);
    }
  };

  const handleStop = () => {
    stopTimer();
    handleTimerStop();
    // If timer is at the end, force progress to 100
    if (elapsedTime >= totalTime && totalTime > 0) {
      progress.setValue(100);
    }
  };

  // Callback for when a timer segment ends
  const handleTimerEnd = () => {
    // This is handled by the existing useEffect that watches for time === 0
  };

  // Callback for when segment changes
  const handleSegmentChange = (newSegment: string) => {
    handleTimerSegmentChange(newSegment);
  };

  // Fadeout logic is now handled centrally in data provider - removed from here

  const handleReset = (items?: Timer[]) => {
    // Stop any currently playing sounds
    handleTimerReset();
    
    // Clear any running intervals first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Use centralized reset
    resetTimer();

    const timerItems = items || timers;
    if (timerItems.length > 0) {
      // Set initial time after reset
      updateTimerTime(timerItems[0].time);

      // Reset animations
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Reset progress
      progress.setValue(0);
      setProgressKey((k) => k + 1); // force re-render
    } else {
      // No timers available - reset to initial state
      updateTimerTime(0);
      progress.setValue(100);
      setProgressKey((k) => k + 1); // force re-render
    }
  };

  // Set up workout completion callback after all functions are defined
  useEffect(() => {
    const handleWorkoutCompleteCallback = () => {
      if (singleSelectMode) {
        // In single-select mode: stop at the end of the current workout and do not advance
        handleTimerReset();
        resetTimer();
        return;
      }
      // Default behavior: proceed using centralized flow (may auto-advance)
      handleWorkoutCompleteFlow(orderedWorkouts);
    };

    setWorkoutCompleteCallback(handleWorkoutCompleteCallback);
  }, [orderedWorkouts, handleWorkoutCompleteFlow, setWorkoutCompleteCallback, singleSelectMode, handleTimerReset, resetTimer]);

  const handleAddNew = () => {
    router.push('/three');
  };

  // Dev helper: manual reseed action (clears seeded keys then force-seeds)
  const handleDevReseed = async () => {
    try {
      await clearSeededProgressions();
      const res = await seedProgressionGroupsToStorage({ force: true });
      await reload();
      console.log('[manual dev reseed]', res);
    } catch (err) {
      console.warn('[manual dev reseed] error', err);
    }
  };

  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0], // Start with full offset (empty circle), end with 0 offset (full circle)
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const currentSegment = timers.length > 0 && timers[currentIndex] ? timers[currentIndex].segment : undefined;
    handleAudioToggle(audioEnabled, isRunning, currentSegment);
  }, [audioEnabled, isRunning, timers, currentIndex, handleAudioToggle]);

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
                  key={`timer-${
                    timers.length > 0 ? timers[currentIndex].id : 'empty'
                  }-${currentIndex}`}
                  onSegmentChange={handleSegmentChange}
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
            {noWorkout && <TimerButton text={t('add_button')} onPress={handleAddNew} maxWidth />}
            {__DEV__ && (
              <View style={{ marginTop: 8, alignItems: 'center' }}>
                <TimerButton text={'DEV: Reseed'} onPress={handleDevReseed} small />
              </View>
            )}
            
            <View style={{ width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6 }}>
                <Text style={{ color: '#b0e0e6', marginRight: 8 }}>{selectedGroup}</Text>
                <TouchableOpacity
                  onPress={() => {
                    // Prefer bundled progressions.json descriptions (metadata), fall back to a generic message
                    try {
                      // require here to keep this file synchronous and avoid adding top-level imports
                      // path relative to this file
                      // eslint-disable-next-line @typescript-eslint/no-var-requires
                      const progressionsList: any[] = require('../../assets/progressions.json');
                      const prog = progressionsList.find((p: any) => p.name === selectedGroup);
                      let desc: any = null;
                      if (selectedGroup === 'All') {
                        desc = t('all_exercises_description') || '';
                      } else if (prog && prog.description) {
                        desc = prog.description;
                      } else {
                        // fallback to provider-stored metadata key if available
                        desc = t('no_description') || '';
                      }
                      console.log('[GroupDescription] resolved description for', selectedGroup, ':', desc);
                      setCurrentGroupDescription(typeof desc === 'string' ? desc : JSON.stringify(desc));
                    } catch (err) {
                      console.warn('[GroupDescription] error loading progressions.json', err);
                      setCurrentGroupDescription(t('no_description') || '');
                    }
                    setGroupDescVisible(true);
                  }}
                  style={styles.helpButton}
                  accessibilityLabel={`Show description for ${selectedGroup}`}
                >
                  <Text style={styles.helpButtonText}>?</Text>
                </TouchableOpacity>
              </View>
              {/* Group description modal (safe rendering of description string) */}
              {groupDescVisible ? (
                <Modal
                  visible={groupDescVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setGroupDescVisible(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                      <ScrollView style={{ maxHeight: 400 }}>
                        <Text style={styles.modalTitle}>{selectedGroup}</Text>
                        <Text style={styles.modalText}>{currentGroupDescription ?? ''}</Text>
                      </ScrollView>
                      <TouchableOpacity style={styles.modalClose} onPress={() => setGroupDescVisible(false)}>
                        <Text style={styles.modalCloseText}>{t('close') || 'Close'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              ) : null}

              <ScrollView
                style={{ width: '100%', maxHeight: Math.max(200, height * 0.45) }}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
              >
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
                  showSingleSelect={true}
                  onReorderComplete={handleReorderComplete}
                  onWorkoutsChanged={setOrderedWorkouts}
                  // NEW: capture Single/All toggle changes
                  onSingleSelectChange={setSingleSelectMode}
                />
              </ScrollView>
            </View>
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
  helpButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2a2e33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b0e0e6',
  },
  helpButtonText: {
    color: '#b0e0e6',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#0f1112',
    padding: 18,
    borderRadius: 10,
    width: '100%',
    maxWidth: 720,
    borderWidth: 1,
    borderColor: '#2a2e33',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    color: '#b0e0e6',
    fontSize: 14,
    lineHeight: 20,
  },
  modalClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#202425',
  },
  modalCloseText: {
    color: '#b0e0e6',
  },
});

export default TabTwoScreen;

