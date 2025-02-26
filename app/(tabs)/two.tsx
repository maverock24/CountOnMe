import {useData} from '@/components/data.provider';
import {faBed, faRunning} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {Audio, AVPlaybackStatusSuccess, InterruptionModeAndroid, InterruptionModeIOS} from 'expo-av';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
} from 'react-native-svg';
import commonStyles from '../styles';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { set } from 'react-hook-form';

// Create a mapping object with static requires for each sound file.
const soundFiles: { [key: string]: any } = {
  upbeat: require('../../assets/sounds/upbeat.mp3'),
  chill: require('../../assets/sounds/chill.mp3'),
  yeah: require('../../assets/sounds/yeah.mp3'),
  wandering: require('../../assets/sounds/wandering.mp3'),
  starlit_serenity: require('../../assets/sounds/starlit_serenity.mp3'),
  peaceful_music_indian: require('../../assets/sounds/peaceful_music_indian.mp3'),
  mystical: require('../../assets/sounds/mystical.mp3'),
  morning_garden_acoustic_chill: require('../../assets/sounds/morning_garden_acoustic_chill.mp3'),
  low_key: require('../../assets/sounds/low_key.mp3'),
  happy_rock: require('../../assets/sounds/happy_rock.mp3'),
  clapping: require('../../assets/sounds/clapping.mp3'),
  chill_beats: require('../../assets/sounds/chill_beats.mp3'),
  bollywood: require('../../assets/sounds/bollywood.mp3'),
};

const {width, height} = Dimensions.get('window');

let workoutMusic: any;
let breakMusic: any;
let successSound: any;

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
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
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
}

let currentSound: Audio.Sound | null = null;
const playSound = async (
  soundFile: any, 
  loop: boolean = true, 
  audioReady: boolean,
  volume: number = 1.0
): Promise<void> => {
  // Validate parameters
  if (!audioReady) {
    console.warn("Audio system not ready yet");
    return;
  }
  
  if (!soundFile) {
    console.error("Cannot play null sound file");
    return;
  }

  try {
    // Clean up any existing sound
    await stopSound();
    
    // Create and configure the new sound
    const { sound } = await Audio.Sound.createAsync(
      soundFile,
      {
        shouldPlay: true,
        isLooping: loop,
        volume: volume,
        progressUpdateIntervalMillis: 1000, // Update status every second
      }
    );
    
    // Store reference to current sound
    currentSound = sound;
    
    // Optional: Add status listener
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        // Handle loading errors
        if (status.error) {
          console.error(`Sound playback error: ${status.error}`);
        }
      }
    });
    
    // Return promise that resolves when playback starts
    await sound.playAsync();
  } catch (error) {
    console.error('Error playing sound:', error);
    currentSound = null;
  }
};

// When you want to stop the sound (for example, when the component unmounts or timer stops)
const stopSound = async () => {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
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
  audioReady
}) => {
  const alarmPlayedRef = useRef(false);

  // Play the appropriate sound when the timer starts
  useEffect(() => {
    if (isRunning && soundEnabled) {
      if (title === 'workout') {
        //play sound in a loop
        playSound(workoutMusic,undefined, audioReady);
      } else if (title === 'break') {
        playSound(breakMusic,undefined, audioReady);
      }
    }
  }, [isRunning, soundEnabled, title]);

  // For break timers: play alarm sound when 5 seconds remain (if next timer is workout)
  useEffect(() => {
  const fadeOutSound = async () => {
  const duration = 1000;
  const steps = 4;
  let { volume } = await currentSound?.getStatusAsync() as AVPlaybackStatusSuccess;
  volume = volume ?? 1; // default to full volume if undefined
  const decrement = volume / steps;
  for (let i = 0; i < steps; i++) {
    volume = Math.max(volume - decrement, 0);
    await currentSound?.setVolumeAsync(volume);
    await new Promise(resolve => setTimeout(resolve, duration));
  }
    };alarmPlayedRef
    if (
      soundEnabled &&
      (title === 'break' || title === 'workout') &&
      time <= 4 &&
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
  const {storedItems, reload} = useData();
  const [timers, setTimers] = useState<Timer[]>([]);
  const noWorkout = storedItems.length === 0 || (storedItems[0].key === 'audioThreshold' && storedItems.length === 1); 
  const totalTime = timers.reduce((acc, timer) => acc + timer.time, 0);

  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const textSize = useRef(new Animated.Value(18)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [stopped, setStopped] = useState<boolean>(false);

  //disabled variable for disabling buttons start and stop and reset when no timer is set
  const [disabled, setDisabled] = useState<boolean>(true);

  useEffect(() => {
    const reservedKeys = ['workoutMusic', 'breakMusic', 'successSound', 'audioThreshold'];
  
  // Filter storedItems to find any workout items (non-reserved keys)
  const workoutItems = storedItems.filter(item => !reservedKeys.includes(item.key));

  if (workoutItems.length === 0) {
    setTimers([]);
    setTime(0);
    return;
  }
 

    
  }
  , [storedItems]);

      // Reload music settings whenever the tab is focused.
  useFocusEffect(
    useCallback(() => {
      async function loadMusicSettings() {
        const storedWorkoutMusic = (await AsyncStorage.getItem('workoutMusic')) || 'upbeat';
        const storedBreakMusic   = (await AsyncStorage.getItem('breakMusic')) || 'chill';
        const storedSuccessMusic = (await AsyncStorage.getItem('successSound')) || 'yeah';

        workoutMusic = soundFiles[storedWorkoutMusic];
        breakMusic = soundFiles[storedBreakMusic];
        successSound = soundFiles[storedSuccessMusic];
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

  // In your component, make sure to unload the sound when unmounting:
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: true,
        });
        setAudioReady(true);
      } catch (error) {
        console.error("Error setting audio mode:", error);
      }
    })();
    
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
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

  // useEffect(() => {
  //   if (timers.length > 0) {
  //     if (timers[currentIndex].segment === 'break') {
  //       Animated.loop(
  //         Animated.sequence([
  //           Animated.timing(textSize, {
  //             toValue: 24,
  //             duration: 1000,
  //             useNativeDriver: false,
  //           }),
  //           Animated.timing(textSize, {
  //             toValue: 18,
  //             duration: 1000,
  //             useNativeDriver: false,
  //           }),
  //         ])
  //       ).start();
  //     }
  //   } else {
  //     textSize.setValue(18);
  //   }
  // }, [currentIndex, timers]);

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
        playSound(successSound, false, audioReady).then(() => {
          handleReset();
        });

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
    if(!value)
    currentSound?.stopAsync();
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
            stroke='rgb(46, 52, 70)'
            strokeWidth={strokeWidth}
            fill='none'
            {...({collapsable: 'false'} as any)}
          />
          <AnimatedCircle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke='#00bcd4'
            strokeWidth={strokeWidth}
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${radius + strokeWidth / 2} ${
              radius + strokeWidth / 2
            })`}
            filter="url(#glow)"
            {...({collapsable: 'false'} as any)}
          />
        </Svg>
        {timers.length > 0 &&
          isRunning &&
          (timers[currentIndex].segment === 'workout' ? (
            <View style={styles.timerContainerActive}>
              <FontAwesomeIcon icon={faRunning} size={30} color='white' />
            </View>
          ) : (
            <View style={styles.timerContainerSnooze}>
              <FontAwesomeIcon icon={faBed} size={30} color='white' />
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
        />
        <View style={styles.nextTimerContainer}>
          { timers.length > 0 && (
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
        <TouchableOpacity disabled={disabled}
          style={disabled ? commonStyles.buttonDisabled : commonStyles.button} onPress={handleStart}>
          <Text style={[commonStyles.buttonText, {paddingLeft: 20, paddingRight: 20}]}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={disabled}
          style={disabled ? commonStyles.buttonDisabled : commonStyles.button} onPress={handleStop}>
          <Text style={[commonStyles.buttonText, {paddingLeft: 20, paddingRight: 20}]}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={disabled}
          style={disabled ? commonStyles.buttonDisabled : commonStyles.button}
          onPress={handleResetButtonPress}
        >
          <Text style={[commonStyles.buttonText, {paddingLeft: 20, paddingRight: 20}]}>Reset</Text>
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
        <TouchableOpacity style={[commonStyles.button,{width: '95%'}]} onPress={() => handleAddNew()}>
        <Text style={commonStyles.buttonText}>Add</Text>
      </TouchableOpacity>
      )}
      <SafeAreaProvider>
        <SafeAreaView>
          <FlatList
            style={styles.listContainer}
            data={storedItems}
            renderItem={({item}) => (
             item.key === 'breakMusic' || item.key === 'workoutMusic' || item.key === 'audioThreshold' ? null : (
              <TouchableOpacity style={[
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
                <Text style={commonStyles.listItemValue}>{item.value?.split(';').map((time) => parseInt(time) / 60).join(' | ')}</Text>
          
            </TouchableOpacity>
            ))}
            keyExtractor={(item) => item.key}
          />
        </SafeAreaView>
      </SafeAreaProvider>
      </View> // push delete button to right
  );
};

const styles = StyleSheet.create({
  innerWrapperTopTile :{
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
    transform: [{scaleX: 0.8}, {scaleY: 0.8}], // Increase the size of the switch
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#101418',
  },
  timerContainerWrapper:{
    backgroundColor: 'transparent',
    top: '-45%'
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
    marginTop:10
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
    marginTop: -75
  },
  count: {
    marginTop: -20,
    fontSize: 70,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default TabTwoScreen;
