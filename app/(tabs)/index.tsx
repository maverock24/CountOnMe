import React, {useState, useEffect} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {Text, View} from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import {commonStyles} from '../styles';
import { AndroidAudioEncoder, AndroidOutputFormat } from 'expo-av/build/Audio';
import { IOSOutputFormat } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabOneScreen() {
  const [count, setCount] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [selectedRemaining, setSelectedRemaining] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [buttonText, setButtonText] = useState('Mic on');
  const [lastSpikeTime, setLastSpikeTime] = useState<number | null>(null);

  const repititions = [5, 10, 15, 200];

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access microphone is required!');
      }
      const storedThreshold = await AsyncStorage.getItem('audioThreshold');
      if (storedThreshold) {
        console.log('storedThreshold', storedThreshold);
        setSliderValue(parseFloat(storedThreshold));
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
    setSelectedRemaining(value);
    setRemaining(value - count);
  };

  const handleReset = () => {
    setCount(0);
    setRemaining(0);
  };

  const handleListen = async () => {
    if (isListening) {
      setIsListening(false);
      setButtonText('Mic on');
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      await Audio.setIsEnabledAsync(false);
    } else {
      if (buttonText === 'Mic on') {
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
    }   }
  };

  useEffect(() => {
    if (isListening && audioLevel > sliderValue) {
      const currentTime = Date.now();
      if (lastSpikeTime === null || currentTime - lastSpikeTime > 10) { // Adjust debounce time as needed
        handleCountUp();
        setLastSpikeTime(currentTime);
      }
    }
  }, [audioLevel]);

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.tileTitle}>Sound trigger</Text>
      <View style={commonStyles.tile}>
      <Text style={styles.title}>db: {sliderValue}</Text>
      <Slider
        style={styles.slider}
        minimumValue={-100}
        maximumValue={0}
        step={1}
        value={sliderValue}
        onValueChange={(value) => setSliderValue(value)}
        thumbTintColor='#019baf'
        minimumTrackTintColor='white'
      />
      <View style={styles.audioVisualizer}>
          <Text style={styles.audioLevel}>Audio Level: {audioLevel}</Text>
        </View>
     <TouchableOpacity style={commonStyles.button} onPress={handleListen}>
        <Text style={commonStyles.buttonText}>{buttonText}</Text>
      </TouchableOpacity> 
      </View>
      <Text style={commonStyles.tileTitle}>Counter</Text>
      <View style={commonStyles.tile}>
      <View style={styles.buttonContainerReps}>
        {repititions.map((rep, index) => (
          <TouchableOpacity
            key={index}
            style={commonStyles.button}
            onPress={() => handleSetRemaining(rep)}
          >
            <Text style={commonStyles.buttonText}>{rep}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.remaining}>{remaining ? remaining : 0}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleCountDown()}
        >
          <FontAwesome name='caret-left' style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.count}>{count}</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleCountUp()}>
          <FontAwesome name='caret-right' style={styles.icon} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={commonStyles.button}
        onPress={() => handleReset()}
      >
        <Text style={commonStyles.buttonText}>Reset</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    textShadowOffset: {width: 0, height: 0},
    width: '80%',
  },
  count: {
    fontSize: 130,
    fontWeight: 'bold',
    marginVertical: 0,
    color: 'white',
  },

  //round button
  repButton: {
    borderRadius: 50,
    padding: 10,
    margin: 10,
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
    marginBottom: -20,
  },
  buttonContainerReps: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
  icon: {
    fontSize: 120,
    color: '#32656F',
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
