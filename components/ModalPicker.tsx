import { Text } from '@/components/Themed';
import { DataKey } from '@/constants/media';
import { FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useData } from './data.provider';
import { useSound } from './sound.provider';

export type setting = 'breakMusic' | 'workoutMusic' | 'successSound';

interface MusicPickerProps {
  label: string;
  dataKey: setting;
}

const ModalPicker: React.FC<MusicPickerProps> = ({ label, dataKey }) => {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const { workoutMusic, breakMusic, successSound, storeItem, getStoredItem } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const { loadMusicSettings } = useSound();
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackPosition, setTrackPosition] = useState(0);
  const [trackDuration, setTrackDuration] = useState(1);
  const [sliderDragging, setSliderDragging] = useState(false);
  const [isRadio, setIsRadio] = useState(false);
  let soundInstance = React.useRef<any>(null);

  // Add helper to get random track by label
  function getRandomTrack(options: DataKey[], label: string) {
    const filtered = options.filter((item) =>
      item.label.toLowerCase().includes(label.toLowerCase())
    );
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)].value;
  }

  // Get the correct music array based on musicType
  const options = (() => {
    let options: DataKey[] = [];
    switch (dataKey) {
      case 'workoutMusic':
        options = workoutMusic;
        // Add 'random:Action' option
        return [
          ...options,
          { label: 'random:Action', value: 'RANDOM_ACTION' } as DataKey,
          { label: 'random:Chill', value: 'RANDOM_CHILL' } as DataKey,
        ].sort((a, b) => a.label.localeCompare(b.label));
      case 'breakMusic':
        options = breakMusic;
        // Add 'random:Chill' option
        return [
          ...options,
          { label: 'random:Chill', value: 'RANDOM_CHILL' } as DataKey,
          { label: 'random:Action', value: 'RANDOM_ACTION' } as DataKey,
        ].sort((a, b) => a.label.localeCompare(b.label));
      case 'successSound':
        options = successSound;
        break;
      default:
        options = [];
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  })();

  useEffect(() => {
    // Load music setting from async storage
    const loadValue = async () => {
      try {
        const value = await getStoredItem(dataKey);
        if (value !== null) {
          setSelectedValue(value);
        }
      } catch (e) {
        console.error(`Error loading ${dataKey} setting:`, e);
      }
    };
    loadValue();
  }, []);

  const handleValueChange = async (value: string) => {
    try {
      storeItem(dataKey, value);
      setSelectedValue(value);
      setPreviewKey((prev) => prev + 1);
      loadMusicSettings();
    } catch (e) {
      console.error(`Error saving ${dataKey} setting:`, e);
    }
  };

  // Find the selected sound object
  const findSelectedSound = () => {
    const music = options.find((item) => item.label === selectedValue);
    return music ? music.value : null;
  };

  // Play sound and show slider
  const handlePlay = async () => {
    let sound;
    if (dataKey === 'workoutMusic' && selectedValue === 'random:Action') {
      sound = getRandomTrack(workoutMusic, 'action');
    } else if (dataKey === 'breakMusic' && selectedValue === 'random:Chill') {
      sound = getRandomTrack(breakMusic, 'chill');
    } else {
      sound = findSelectedSound();
    }
    setIsRadio(sound?.toString().includes('http'));
    if (!sound) return;
    setIsPlaying(true);
    const playback = new Audio.Sound();
    await playback.loadAsync(sound);
    soundInstance.current = playback;
    playback.setOnPlaybackStatusUpdate((status: any) => {
      if (!sliderDragging && status.isLoaded) {
        setTrackPosition(status.positionMillis || 0);
        setTrackDuration(status.durationMillis || 1);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setTrackPosition(0);
        playback.unloadAsync();
      }
    });
    await playback.playAsync();
  };

  const handleStop = async () => {
    setIsPlaying(false);
    setIsRadio(false);
    setTrackPosition(0);
    if (soundInstance.current) {
      await soundInstance.current.stopAsync();
      await soundInstance.current.unloadAsync();
      soundInstance.current = null;
    }
  };

  const handleSliderValueChange = async (value: number) => {
    setTrackPosition(value);
    if (soundInstance.current) {
      await soundInstance.current.setPositionAsync(value);
    }
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.musicPickerContainer}>
        {isPlaying ? (
          <>
            <TouchableOpacity style={styles.pickerButton} onPress={handleStop}>
              <FontAwesome name="stop" size={22} color="white" />
            </TouchableOpacity>
            <Slider
              disabled={isRadio}
              style={{ flex: 1, marginHorizontal: 10 }}
              minimumValue={0}
              maximumValue={trackDuration}
              value={trackPosition}
              minimumTrackTintColor="#00bcd4"
              maximumTrackTintColor="#fff"
              thumbTintColor="#00bcd4"
              onValueChange={(value: number) => {
                setSliderDragging(true);
                setTrackPosition(value);
              }}
              onSlidingComplete={async (value: number) => {
                setSliderDragging(false);
                await handleSliderValueChange(value);
              }}
            />
          </>
        ) : (
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <TouchableOpacity style={styles.pickerButton} onPress={handlePlay}>
              <FontAwesome name="play" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.selectedValueText}>
                  {selectedValue}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setModalVisible(true)}>
              <FontAwesome name="chevron-down" size={15} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{label}</Text>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.label}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        selectedValue === item.label && styles.selectedOptionItem,
                      ]}
                      onPress={() => {
                        handleValueChange(item.label);
                        setModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedValue === item.label && styles.selectedOptionText,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {selectedValue === item.label && (
                        <FontAwesome name="check" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.optionsList}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 5,
  },
  musicPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(49, 67, 77)',
    borderRadius: 5,
    marginBottom: 15,
    justifyContent: 'space-between',
    minHeight: 50,
    paddingLeft: 10,
    paddingRight: 10,
  },
  pickerWithPreview: {
    backgroundColor: 'rgb(45, 55, 73)',
    color: '#fff',
    flex: 1,
  },
  label: {
    marginTop: 15,
    fontSize: 14,
    color: 'lightgray',
    marginBottom: 5,
  },
  // Modal styles - fully black background
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Almost completely black overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 400,
    maxHeight: '90%',
    backgroundColor: 'rgb(49, 67, 77)', // Dark background for the actual content
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2E33',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2E33',
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 46, 51, 0.5)',
  },
  selectedOptionItem: {
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedValueText: {
    color: '#fff',
    fontSize: 14,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ModalPicker;
