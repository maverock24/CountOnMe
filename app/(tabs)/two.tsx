import {useData} from '@/components/data.provider';
import {Audio} from 'expo-av';
import React, {useEffect, useRef, useState} from 'react';
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
import Svg, {Circle} from 'react-native-svg';
import {commonStyles} from '../styles';

const actionSound = require('../../assets/sounds/action.mp3');
const chillSound = require('../../assets/sounds/chill.mp3');
const alarmSound = require('../../assets/sounds/alarm.mp3');
const success = require('../../assets/sounds/success.mp3');

const {width, height} = Dimensions.get('window');

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
}

const playSound = async (soundFile: any, loop: boolean = true) => {
  try {
    //stop any currently playing sounds
    Audio.setIsEnabledAsync(false);
    Audio.setIsEnabledAsync(true);
    const {sound} = await Audio.Sound.createAsync(soundFile);
    // Optionally set audio mode or looping here
    loop ? await sound.setIsLoopingAsync(true) : false;
    await sound.playAsync();
    // Note: You may want to store the sound instance to stop/unload later.
  } catch (error) {
    console.log('Error playing sound', error);
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
  // Function to play a given sound file using expo-av Audio API

  // Play the appropriate sound when the timer starts
  useEffect(() => {
    if (isRunning && soundEnabled) {
      if (title === 'workout') {
        //play sound in a loop
        playSound(actionSound);
      } else if (title === 'break') {
        playSound(chillSound);
      }
    }
    if (!isRunning) {
      Audio.setIsEnabledAsync(false);
    }
  }, [isRunning, soundEnabled, title]);

  // For break timers: play alarm sound when 5 seconds remain (if next timer is workout)
  useEffect(() => {
    if (
      soundEnabled &&
      title === 'break' &&
      time === 5 &&
      !alarmPlayedRef.current
    ) {
      playSound(alarmSound);
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

  useEffect(() => {
    if (timers.length > 0) {
      if (timers[currentIndex].segment === 'break') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(textSize, {
              toValue: 24,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(textSize, {
              toValue: 18,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }
    } else {
      textSize.setValue(18);
    }
  }, [currentIndex, timers]);

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
      if (currentIndex === timers.length - 1) {
        playSound(success, false);
      }
    }
  }, [isRunning]);

  const selectSet = (value: string) => {
    // Split the value string into an array of objects
    const items = value.split(',').map((time, index) => ({
      id: index.toString(),
      time: parseInt(time),
      segment: index % 2 === 0 ? 'workout' : 'break',
    }));
    setTimers(items);
    handleReset(items);
  };

  const handleResetButtonPress = () => handleReset();

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = (items?: Timer[]) => {
    //stop any currently playing sounds
    Audio.setIsEnabledAsync(false);
    setIsRunning(false);
    console.log(timers[0]);
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
    setSelectedItem((prev) => (prev === value ? null : value));
    selectSet(value);
  };

  const radius = 135;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Sound Enabled</Text>
        <Switch
          style={styles.switch}
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />
      </View>
      <View style={styles.timerContainer}>
        <Svg
          height={radius * 2 + strokeWidth}
          width={radius * 2 + strokeWidth}
          style={styles.progressCircle}
        >
          <Circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke='grey'
            strokeWidth={strokeWidth}
            fill='none'
            {...({collapsable: 'false'} as any)}
          />
          <AnimatedCircle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke='white'
            strokeWidth={strokeWidth}
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${radius + strokeWidth / 2} ${
              radius + strokeWidth / 2
            })`}
            {...({collapsable: 'false'} as any)}
          />
        </Svg>
        <Text style={styles.nextTimerText}>{timers[currentIndex].id}</Text>
        <TimerItem
          title={timers.length > 0 ? timers[currentIndex].segment : ''}
          key={timers.length > 0 ? timers[currentIndex].id : ''}
          time={time}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          setTime={setTime}
          intervalRef={intervalRef}
          soundEnabled={soundEnabled}
        />
        <View style={styles.currentTimerContainer}>
          {timers.length > 0 && (
            <Animated.Text
              style={[
                styles.nextTimerText,
                timers[currentIndex].segment === 'workout'
                  ? {transform: [{translateX: shakeAnimation}]}
                  : {fontSize: textSize},
              ]}
            >
              Now: {timers[currentIndex].segment}
            </Animated.Text>
          )}
        </View>
        <View style={styles.nextTimerContainer}>
          <Text style={styles.nextTimerText}>
            Next:{' '}
            {currentIndex < timers.length - 1
              ? formatTime(timers[currentIndex + 1].time)
              : 'Finish line'}
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={commonStyles.button} onPress={handleStart}>
          <Text style={commonStyles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={commonStyles.button} onPress={handleStop}>
          <Text style={commonStyles.buttonText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={commonStyles.button}
          onPress={handleResetButtonPress}
        >
          <Text style={commonStyles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <SafeAreaProvider>
        <SafeAreaView>
          <FlatList
            style={styles.listContainer}
            data={storedItems}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => toggleSelectSet(item.value?.toString() ?? '0')}
              >
                <View
                  style={[
                    styles.listItem,
                    selectedItem === item.value?.toString() && {
                      borderColor: 'white',
                      borderWidth: 3,
                    },
                  ]}
                >
                  <Text style={styles.listItemTitle}>{item.key}</Text>
                  <Text style={styles.listItemValue}>{item.value}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.key}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
    marginTop: 0,
    marginBottom: 20,
    width: '100%',
    height: '20%',
  },
  listItem: {
    flexDirection: 'row', // align children horizontally
    justifyContent: 'space-between', // push delete button to right
    padding: 0,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#547D8A',
    borderRadius: 10,
    height: 45,
    width: '95%',
  },
  listItemTitle: {
    margin: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  listItemValue: {
    margin: 8,
    fontSize: 18,
    color: 'white',
    letterSpacing: 4,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  switch: {
    transform: [{scaleX: 0.5}, {scaleY: 0.5}], // Increase the size of the switch
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#303030',
  },
  switchContainer: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -30,
  },
  switchLabel: {
    marginRight: 10,
    fontSize: 12,
    color: 'white',
  },
  listContainer: {
    width: '100%',
    paddingTop: 10,
    backgroundColor: '#242426',
  },
  pageContainer: {
    height: 10,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    width: '100%',
    height: '60%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    left: '50%',
    transform: [{translateX: -140}, {translateY: -140}],
  },
  currentTimerContainer: {
    marginTop: -10,
    alignItems: 'center',
  },
  nextTimerContainer: {
    alignItems: 'center',
  },
  nextTimerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: -20,
    borderBottomColor: 'white',
    borderBottomWidth: 2,
    paddingBottom: 5,
  },
  button: {
    borderRadius: 50,
    padding: 10,
    margin: 5,
    width: 70,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 70,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default TabTwoScreen;
