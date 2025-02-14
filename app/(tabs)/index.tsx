import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import Slider from '@react-native-community/slider';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { commonStyles } from '../styles';

export default function TabOneScreen() {
  const [count, setCount] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [selectedRemaining, setSelectedRemaining] = useState(0);

  const repititions = [5, 10, 15, 200];

  const handleCountUp = () => {
    setCount(prevCount => prevCount + 1);
    if (remaining > 0) {
      setRemaining(prevRemaining => prevRemaining - 1);
    }
  };
  
  const handleCountDown = () => {
    if (count !== 0){
    setCount(prevCount => prevCount - 1);
    if (remaining > 0) {
      setRemaining(prevRemaining => prevRemaining + 1);
    }
  }
  };

  const handleSetRemaining = (value: number) => {
    setSelectedRemaining(value);
    setRemaining(value-count);
  }

  const handleReset = () => {
    setCount(0);
    setRemaining(selectedRemaining);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>db: {sliderValue}</Text>
      <Slider
        style={styles.slider}
        minimumValue={50}
        maximumValue={150}
        step={1}
        value={count}
        onValueChange={(value) => setSliderValue(value)}
        thumbTintColor='#019baf'
        minimumTrackTintColor='white'
      />
      <View style={styles.buttonContainerReps}>
        {repititions.map((rep, index) => (
          <TouchableOpacity
            key={index}
            style={commonStyles.button}
            onPress={() => handleSetRemaining(rep)}>
            <Text style={styles.buttonText}>{rep}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.remaining}>{remaining ? remaining : 0}</Text>
      <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={() => handleCountDown()}>
      <FontAwesome name="caret-left" style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.count}>{count}</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleCountUp()}>
        <FontAwesome name="caret-right" style={styles.icon} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={commonStyles.button} onPress={() => handleReset()}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    textShadowOffset: { width: 0, height: 0 },
    width: '80%',
  },
  count: {
    fontSize: 140,
    fontWeight: 'bold',
    marginVertical: 20,
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
  },
  buttonContainerReps: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  slider: {
    width: '90%',
    height: 40,
    color: '#019baf',
  },
  sliderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 120,
    color: '#019baf',
  },
});