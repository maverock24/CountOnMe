import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');
import Svg, { Circle } from 'react-native-svg';

interface Timer {
  id: string;
  time: number;
  title: string;
}

const timers: Timer[] = [
  { id: '1', time: 3, title: 'workout' },
  { id: '2', time: 6,  title: 'break' },
  { id: '3', time: 9, title: 'workout' },
];

const totalTime = timers.reduce((acc, timer) => acc + timer.time, 0);

const formatTime = (seconds: number) => {
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface TimerItemProps {
  time: number;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

const TimerItem: React.FC<TimerItemProps> = ({ time, isRunning, setIsRunning, setTime, intervalRef }) => {
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
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

  return (
    
      <Text style={styles.count}>{formatTime(time)}</Text>
    
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TabTwoScreen: React.FC = () => {
  const [time, setTime] = useState<number>(timers[0].time);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const textSize = useRef(new Animated.Value(18)).current;
  const progress = useRef(new Animated.Value(0)).current;

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
    if (timers[currentIndex].title === 'break') {
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
    } else {
      textSize.setValue(18);
    }
  }, [currentIndex, timers]);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setElapsedTime(prev => {
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
    }
  }, [isRunning]);

  const handleSetTime = (seconds: number) => {
    setTime(seconds);
    setIsRunning(false);
    clearInterval(intervalRef.current!);
    const index = timers.findIndex(timer => timer.time === seconds);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(timers[0].time);
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
      <View style={styles.timerContainer}>
      <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth} style={styles.progressCircle}>
          <Circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke="grey"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke="white"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
          />
        </Svg>
      <View style={styles.currentTimerContainer}>
      <Animated.Text
            style={[
              styles.nextTimerText,
              timers[currentIndex].title === 'workout'
                ? { transform: [{ translateX: shakeAnimation }] }
                : { fontSize: textSize },
            ]}
          >
            {timers[currentIndex].title}
          </Animated.Text>
      </View>
          <TimerItem
            key={timers[currentIndex].id}
            time={time}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            setTime={setTime}
            intervalRef={intervalRef}
          />
      <View style={styles.nextTimerContainer}>
        <Text style={styles.nextTimerText}>
          Next Up: {currentIndex < timers.length - 1 ? formatTime(timers[currentIndex + 1].time) : 'Finish line'}
        </Text>
      </View>
      </View>
      <View style={styles.buttonContainer}>
        {[3, 6, 9].map((sec) => (
          <TouchableOpacity
            key={sec}
            style={styles.repButton}
            onPress={() => handleSetTime(sec)}
          >
            <Text style={styles.buttonText}>{sec} sec</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleStop}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#107AB0',
  },
  animatedContainer: {
    width,
    height: height * timers.length,
  },
  scrollView: {
    height: 10,
  },
  listContainer: {
    width: '100%',
  },
  pageContainer: {
    height: 10,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    width: '100%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -140 }, { translateY: -140 }],
  },
  currentTimerContainer: {
    marginTop: 0,
    alignItems: 'center',
  },
  nextTimerContainer: {
    marginTop: 0,
    alignItems: 'center',
  },
  nextTimerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 20,
  },
  repButton: {
    borderRadius: 50,
    padding: 10,
    margin: 10,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  }, 
  button: {
    borderRadius: 50,
    padding: 10,
    margin: 10,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  }, 
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 70,
    fontWeight: 'bold',
    // marginVertical: 20,
    color: 'white',
  },
});

export default TabTwoScreen;