import { useData } from '@/components/data.provider';
import { faBed, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';
import commonStyles from '../styles';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { useSound } from '@/components/useSound';

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

interface TimerItemProps {
  title: string;
  time: number;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  soundEnabled: boolean;
  audioReady: boolean;
  workoutMusic: any;
  breakMusic: any;
  successSound: any;
}

let currentSound: Audio.Sound | null = null;

// Update the playSound function with better Android support
const playSound = async (
  soundFile: any,
  loop: boolean = true,
  audioReady: boolean,
  volume: number = 1.0
): Promise<void> => {
  // Make sure audio is enabled (especially important for Android)
  try {
    await Audio.setIsEnabledAsync(true);
  } catch (error) {
    console.warn('Error enabling audio:', error);
  }

  // More detailed validation
  if (!audioReady) {
    console.warn('Audio system not ready yet. Waiting for initialization...');
    return; // Don't attempt to play if audio isn't ready
  }

  if (!soundFile) {
    console.error('Cannot play null sound file');
    return;
  }

  try {
    // Clean up any existing sound
    await stopSound();

    // For Android, add small delay before creating new sound
    if (Platform.OS === 'android') {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Create the sound object
    const { sound } = await Audio.Sound.createAsync(soundFile, { volume: volume, isLooping: loop });

    // Store reference
    currentSound = sound;

    // Start playback
    await sound.playAsync();
  } catch (error) {
    console.error('Error playing sound:', error);
    currentSound = null;

    // For Android, if there was an error, try to re-enable audio
    if (Platform.OS === 'android') {
      try {
        await Audio.setIsEnabledAsync(false);
        await new Promise((resolve) => setTimeout(resolve, 300));
        await Audio.setIsEnabledAsync(true);
      } catch (e) {
        console.warn('Failed to reset audio system:', e);
      }
    }
  }
};

const stopSound = async (): Promise<void> => {
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
  audioReady,
  workoutMusic,
  breakMusic,
  successSound,
}) => {
  const alarmPlayedRef = useRef(false);

  // Play the appropriate sound when the timer starts
  useEffect(() => {
    let soundTimeout: NodeJS.Timeout | null = null;

    if (isRunning && soundEnabled && audioReady) {
      // Add slight delay for Android to ensure audio system is ready
      soundTimeout = setTimeout(
        () => {
          if (title === 'workout') {
            playSound(workoutMusic, true, audioReady);
          } else if (title === 'break') {
            playSound(breakMusic, true, audioReady);
          }
        },
        Platform.OS === 'android' ? 500 : 0
      );
    }

    return () => {
      if (soundTimeout) clearTimeout(soundTimeout);
    };
  }, [isRunning, soundEnabled, title, audioReady]);

  useEffect(() => {
    const fadeOutSound = async () => {
      try {
        // First check if we have a sound to fade
        if (!currentSound) {
          return;
        }

        // Get current status to check if it's playing
        const status = await currentSound.getStatusAsync();
        if (!status.isLoaded || !(status as AVPlaybackStatusSuccess).isPlaying) {
          return;
        }

        // Start with current volume or default to 1
        let volume = (status as AVPlaybackStatusSuccess).volume ?? 1;
        const duration = 800; // ms per step
        const steps = 5;
        const decrement = volume / steps;

        // Gradually reduce volume
        for (let i = 0; i < steps; i++) {
          volume = Math.max(volume - decrement, 0);
          await currentSound.setVolumeAsync(volume);
          await new Promise((resolve) => setTimeout(resolve, duration));
        }
      } catch (error) {
        console.error('Error during fadeout:', error);
      }
    };

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
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  return <Text style={styles.count}>{formatTime(time)}</Text>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TabTwoScreen: React.FC = () => {
  const { workoutItems } = useData();
  const [timers, setTimers] = useState<Timer[]>([]);
  const noWorkout = workoutItems.length === 0;
  const totalTime = timers.reduce((acc, timer) => acc + timer.time, 0);

  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [stopped, setStopped] = useState<boolean>(false);
  const { breakMusic, workoutMusic, successSound } = useData();
  const [selectedWorkoutMusic, setSelectedWorkoutMusic] = useState<any>(null);
  const [selectedBreakMusic, setSelectedBreakMusic] = useState<any>(null);
  const [selectedSuccessSound, setSelectedSuccessSound] = useState<any>(null);

  //const { isPlaying, playSound, stopSound, audioReady } = useSound();

  //disabled variable for disabling buttons start and stop and reset when no timer is set
  const [disabled, setDisabled] = useState<boolean>(true);

  const getSoundFileByLabel = (label: string) => {
    const workoutMatch = workoutMusic.find((music) => music.label === label);
    if (workoutMatch) {
      return workoutMatch.value;
    }

    const breakMatch = breakMusic.find((music) => music.label === label);
    if (breakMatch) {
      return breakMatch.value;
    }

    const successMatch = successSound.find((sound) => sound.label === label);
    if (successMatch) {
      return successMatch.value;
    }

    if (workoutMusic.length > 0) return workoutMusic[0].value;

    console.error('Could not find any sound to play');
    return null;
  };

  // Reload music settings whenever the tab is focused.
  useFocusEffect(
    useCallback(() => {
      async function loadMusicSettings() {
        const storedWorkoutMusic = (await AsyncStorage.getItem('workoutMusic')) || 'Upbeat';
        const storedBreakMusic = (await AsyncStorage.getItem('breakMusic')) || 'Chill';
        const storedSuccessMusic = (await AsyncStorage.getItem('successSound')) || 'Yeah';

        setSelectedBreakMusic(getSoundFileByLabel(storedBreakMusic));
        setSelectedWorkoutMusic(getSoundFileByLabel(storedWorkoutMusic));
        setSelectedSuccessSound(getSoundFileByLabel(storedSuccessMusic));
      }
      loadMusicSettings();

      // Return a cleanup function that stops the sound and timer when the tab loses focus.
      return () => {
        stopSound();
        setIsRunning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [])
  );

  // Update the initAudio function in your useEffect
  useEffect(() => {
    let isMounted = true;
    let initAttempts = 0;
    const maxInitAttempts = 3;

    const initAudio = async () => {
      try {
        // First ensure permissions are granted
        const permissionResponse = await Audio.requestPermissionsAsync();
        if (!permissionResponse.granted) {
          console.warn('Audio permissions not granted');
          return;
        }

        // Android-specific initialization
        if (Platform.OS === 'android') {
          try {
            // For Android, explicitly enable audio before setting mode
            await Audio.setIsEnabledAsync(true);
          } catch (error) {
            console.warn('Error enabling audio on Android:', error);
          }
        }

        // Then set audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });

        // Verify audio system is working by creating and immediately releasing a sound
        try {
          const verificationSound = new Audio.Sound();
          await verificationSound.loadAsync(require('../../assets/sounds/chill.mp3'));
          await verificationSound.unloadAsync();
        } catch (verifyError) {
          console.error('Audio verification failed:', verifyError);
          throw verifyError; // Re-throw to trigger retry
        }

        // All good!
        if (isMounted) {
          setAudioReady(true);
        }
      } catch (error) {
        console.error('Error initializing audio system:', error);

        // Retry with increasing delay
        if (initAttempts < maxInitAttempts && isMounted) {
          initAttempts++;
          const delay = 1000 * initAttempts; // Increase delay with each attempt
          console.log(
            `Retrying audio initialization in ${
              delay / 1000
            }s (attempt ${initAttempts}/${maxInitAttempts})`
          );
          setTimeout(initAudio, delay);
        }
      }
    };

    // Start initialization
    initAudio();

    return () => {
      isMounted = false;
      stopSound().catch((err) => console.error('Error stopping sound during cleanup:', err));
    };
  }, []);

  useEffect(() => {
    if (timers.length > 0) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [timers]);

  useEffect(() => {
    if (time === 0 && currentIndex < timers.length - 1) {
      // Reset alarm reference when moving to next timer
      //alarmPlayedRef.current = false;

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
  }, [time, currentIndex]);

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      shakeAnimation.setValue(0);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => {
          const newElapsedTime = prev + 1;
          const progressValue = (newElapsedTime / totalTime) * 100;
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
      if (currentIndex === timers.length - 1 && !stopped) {
        playSound(selectedSuccessSound, false, audioReady);
        // Wait 2 seconds before resetting (adjust timing as needed)
        setTimeout(() => {
          handleReset();
        }, 4000);
      }
    }
  }, [isRunning]);

  const selectSet = (value: string) => {
    // Split the value string into an array of objects
    const items = value.split(';').map((time, index) => ({
      id: index.toString(),
      time: parseInt(time),
      segment: index % 2 === 0 ? 'workout' : 'break',
    }));
    setTimers(items);
    handleReset(items);
  };

  const handleResetButtonPress = () => handleReset();

  const handleStart = () => {
    setIsRunning(true);
    setStopped(false);
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
    items ? setTime(items[0].time) : setTime(timers[0].time);
    setCurrentIndex(0);
    clearInterval(intervalRef.current!);
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
  };

  const toggleSelectSet = (value: string) => {
    setSelectedItem((prev) => {
      if (prev === value) {
        handleReset();
        setTimers([]);
        setTime(0);
        return null;
      }
      selectSet(value);
      return value;
    });
  };

  const handleAddNew = () => {
    //navigate to the tab /modal
    router.push('/three');
  };

  const handleSwitchSound = (value: boolean) => {
    setSoundEnabled(value);
    if (!value) currentSound?.stopAsync();
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
      <Text style={commonStyles.tileTitle}>Active Workout</Text>
      <View style={commonStyles.tile}>
        <View style={styles.innerWrapperTopTile}>
          <View style={styles.timerContainer}>
            <Svg
              height={radius * 2 + strokeWidth}
              width={radius * 2 + strokeWidth}
              viewBox={`-15 -15 ${radius * 2 + strokeWidth + 30} ${radius * 2 + strokeWidth + 30}`}
              style={[styles.progressCircle, { overflow: 'visible' }]}
            >
              <Defs>
                <Filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <FeGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
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
                stroke="rgb(46, 52, 70)"
                strokeWidth={strokeWidth}
                fill="none"
                {...({ collapsable: 'false' } as any)}
              />
              <AnimatedCircle
                cx={radius + strokeWidth / 2}
                cy={radius + strokeWidth / 2}
                r={radius}
                stroke="#00bcd4"
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
                key={timers.length > 0 ? timers[currentIndex].id : ''}
                time={time}
                isRunning={isRunning}
                setIsRunning={setIsRunning}
                setTime={setTime}
                intervalRef={intervalRef}
                soundEnabled={soundEnabled}
                audioReady={audioReady}
                workoutMusic={selectedWorkoutMusic}
                breakMusic={selectedBreakMusic}
                successSound={selectedSuccessSound}
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
            <TouchableOpacity
              disabled={disabled}
              style={disabled ? commonStyles.buttonDisabled : commonStyles.button}
              onPress={handleStart}
            >
              <Text style={[commonStyles.buttonText, { paddingLeft: 20, paddingRight: 20 }]}>
                Start
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={disabled}
              style={disabled ? commonStyles.buttonDisabled : commonStyles.button}
              onPress={handleStop}
            >
              <Text style={[commonStyles.buttonText, { paddingLeft: 20, paddingRight: 20 }]}>
                Stop
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={disabled}
              style={disabled ? commonStyles.buttonDisabled : commonStyles.button}
              onPress={handleResetButtonPress}
            >
              <Text style={[commonStyles.buttonText, { paddingLeft: 20, paddingRight: 20 }]}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Sound on/off</Text>
            <Switch
              thumbColor={soundEnabled ? '#00bcd4' : 'grey'}
              style={styles.switch}
              value={soundEnabled}
              onValueChange={(value) => handleSwitchSound(value)}
            />
          </View>
        </View>
      </View>
      <Text style={commonStyles.tileTitle}>Workouts</Text>
      {noWorkout && (
        <TouchableOpacity
          style={[commonStyles.button, { width: '95%' }]}
          onPress={() => handleAddNew()}
        >
          <Text style={commonStyles.buttonText}>Add</Text>
        </TouchableOpacity>
      )}
      <SafeAreaProvider>
        <SafeAreaView>
          <FlatList
            style={styles.listContainer}
            data={workoutItems}
            renderItem={({ item }) =>
              item.key === 'breakMusic' ||
              item.key === 'workoutMusic' ||
              item.key === 'audioThreshold' ? null : (
                <TouchableOpacity
                  style={[
                    commonStyles.buttonTile,
                    selectedItem === item.value?.toString() && {
                      borderColor: '#00bcd4',
                      borderWidth: 2,
                      shadowColor: '#00bcd4',
                      shadowOpacity: 1,
                      shadowRadius: 1,
                      boxShadow: '0px 0px 5px 1px #00bcd4',
                      elevation: 6, // Android
                    },
                  ]}
                  onPress={() => toggleSelectSet(item.value?.toString() ?? '0')}
                >
                  <Text style={commonStyles.listItemTitle}>{item.key}</Text>
                  <Text style={commonStyles.listItemValue}>
                    {item.value
                      ?.split(';')
                      .map((time) => parseFloat(time) / 60)
                      .join(' | ')}
                  </Text>
                </TouchableOpacity>
              )
            }
            keyExtractor={(item) => item.key}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </View> // push delete button to right
  );
};

const styles = StyleSheet.create({
  innerWrapperTopTile: {
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
    backgroundColor: 'transparent',
    top: '-45%',
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
    width: '100%',
    backgroundColor: 'transparent',
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
    top: '18%',
    alignItems: 'center',
    backgroundColor: 'green',
    width: 50,
    borderRadius: 50,
    padding: 10,
  },
  timerContainerSnooze: {
    position: 'absolute',
    top: '18%',
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
    marginTop: -75,
  },
  count: {
    marginTop: -20,
    fontSize: 70,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default TabTwoScreen;
