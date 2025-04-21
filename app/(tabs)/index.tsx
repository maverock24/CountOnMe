import { Text, View } from '@/components/Themed';
import TimerButton from '@/components/TimerButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import commonStyles from '../styles';

export default function TabOneScreen() {
  const [count, setCount] = useState(0);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [buttonText, setButtonText] = useState('Mic on');
  const [micOn, setMicOn] = useState(false);

  const repititions = [5, 10, 15, 200];

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access microphone is required!');
      }
      const storedThreshold = await AsyncStorage.getItem('audioThreshold');
      if (storedThreshold !== null) {
        const parsed = parseFloat(storedThreshold);
        if (!isNaN(parsed)) {
          setSliderValue(parsed);
        } else {
          setSliderValue(0);
        }
      } else {
        setSliderValue(0); // default value if none stored
      }
    })();
  }, []);

  const handleCountUp = () => {
    setCount((prevCount) => prevCount + 1);
    if (remaining > 0) {
      setRemaining((prevRemaining) => prevRemaining - 1);
    }
  };

  const handleCountDown = () => {
    if (count !== 0) {
      setCount((prevCount) => prevCount - 1);
      if (remaining > 0) {
        setRemaining((prevRemaining) => prevRemaining + 1);
      }
    }
  };

  const handleSetRemaining = (value: number) => {
    setCount(0);
    setRemaining(value);
  };

  const handleReset = () => {
    setCount(0);
    setRemaining(0);
  };

  const handleListen = async () => {
    if (isListening) {
      setMicOn(false);
      setIsListening(false);
      setButtonText('Mic on');
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      await Audio.setIsEnabledAsync(false);
    } else {
      if (buttonText === 'Mic on') {
        setMicOn(true);
        setIsListening(true);
        setButtonText('Mic off');
        await Audio.setIsEnabledAsync(true);
        const newRecording = new Audio.Recording();
        try {
          if (recording) {
            await recording.stopAndUnloadAsync();
            setRecording(null);
          }
          await newRecording.prepareToRecordAsync();
          await newRecording.startAsync();
          newRecording.setOnRecordingStatusUpdate((status) => {
            if (status.metering) {
              setAudioLevel(status.metering);
            }
          });
          setRecording(newRecording);
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  useEffect(() => {
    if (isListening && audioLevel > sliderValue!) {
      handleCountUp();

      setAudioLevel((prev) => prev - 50);
    }
  }, [audioLevel]);

  const handleSliderChange = React.useCallback((value: number) => {
    setSliderValue(value);
    AsyncStorage.setItem('audioThreshold', value.toString()).catch((err) =>
      console.error('Error saving threshold:', err)
    );
  }, []);

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>Sound trigger</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
            {/* <Text style={styles.title}>db: {sliderValue}</Text> */}
            <Slider
              value={sliderValue!}
              style={styles.slider}
              minimumValue={-100}
              maximumValue={0}
              step={1}
              onSlidingComplete={handleSliderChange}
              thumbTintColor="#00bcd4"
              minimumTrackTintColor="#00bcd4"
              maximumTrackTintColor="gray"
            />
            {/* <View style={styles.audioVisualizer}>
              <Text style={styles.audioLevel}>Audio Level: {audioLevel}</Text>
            </View> */}
            <TimerButton
              text={micOn ? 'Mic off' : 'Mic on'}
              onPress={handleListen}
              disabled={false}
              style={
                micOn
                  ? {
                      borderColor: '#00bcd4',
                      borderWidth: 2,
                      shadowColor: '#00bcd4',
                      shadowOpacity: 1,
                      shadowRadius: 1,
                      boxShadow: '0px 0px 5px 1px #00bcd4',
                      elevation: 6, // Android
                    }
                  : {}
              }
            />
          </View>
        </View>
        <Text style={commonStyles.tileTitle}>Counter</Text>
        <View
          style={[commonStyles.tile, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
        >
          <View style={styles.innerWrapperBottomTile}>
            <View style={{ backgroundColor: 'transparent', alignItems: 'center' }}>
              <View style={styles.buttonContainerReps}>
                {repititions.map((rep, index) => (
                  <TimerButton
                    key={index}
                    text={rep.toString()}
                    onPress={() => handleSetRemaining(rep)}
                  />
                ))}
              </View>
              <Text style={styles.remaining}>{remaining ? remaining : 0}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.triangleLeft}
                onPress={() => handleCountDown()}
              ></TouchableOpacity>
              <Text style={styles.count}>{count}</Text>
              <TouchableOpacity
                style={styles.triangleRight}
                onPress={() => handleCountUp()}
              ></TouchableOpacity>
            </View>
            <TimerButton maxWidth={true} text="Reset" onPress={handleReset} />
          </View>
        </View>
      </View>
    </View>
  );
}

const { height } = Dimensions.get('window');
const paddingTopTile = height * 0.01;
const paddingBottomTile = height > 800 ? height * 0.05 : height * 0.001;

const styles = StyleSheet.create({
  innerWrapperTopTile: {
    paddingBottom: paddingTopTile,
    paddingTop: paddingTopTile,
    width: '95%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  innerWrapperBottomTile: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '95%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    textShadowOffset: { width: 0, height: 0 },
    width: '80%',
  },
  count: {
    fontSize: 100,
    fontWeight: 'bold',
    color: 'white',
  },

  repButton: {
    borderRadius: 50,
    padding: 10,
    marginBottom: paddingBottomTile,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  remaining: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    textAlign: 'center',
    width: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    backgroundColor: 'transparent',
  },
  buttonContainerReps: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  slider: {
    width: '90%',
    height: 40,
    color: '#387480',
  },
  sliderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  triangleLeft: {
    marginTop: -10,
    width: 0,
    height: 0,
    borderTopWidth: 60,
    borderRightWidth: 50,
    borderBottomWidth: 60,
    borderTopColor: 'transparent',
    borderRightColor: 'rgb(34, 132, 152)',
    borderBottomColor: 'transparent',
  },
  triangleRight: {
    marginTop: -10,
    width: 0,
    height: 0,
    borderTopWidth: 60,
    borderLeftWidth: 50,
    borderBottomWidth: 60,
    borderTopColor: 'transparent',
    borderLeftColor: 'rgb(34, 132, 152)',
    borderBottomColor: 'transparent',
  },
  audioVisualizer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  audioLevel: {
    fontSize: 14,
    color: 'white',
    backgroundColor: 'transparent',
  },
});
