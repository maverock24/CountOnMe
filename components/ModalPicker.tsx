import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import { Text } from '@/components/Themed';
import SoundPreview from './SoundPreview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from './data.provider';
import { FontAwesome } from '@expo/vector-icons';
import { useSound } from './sound.provider';

export type DataKey = 'breakMusic' | 'workoutMusic' | 'successSound' | 'language';

interface MusicPickerProps {
  label: string;
  dataKey: string;
}

const ModalPicker: React.FC<MusicPickerProps> = ({ label, dataKey }) => {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const { workoutMusic, breakMusic, successSound, language } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const { loadMusicSettings } = useSound();

  // Get the correct music array based on musicType
  const musicOptions = (() => {
    switch (dataKey) {
      case 'workoutMusic':
        return workoutMusic;
      case 'breakMusic':
        return breakMusic;
      case 'successSound':
        return successSound;
      case 'language':
        return language;
      default:
        return [];
    }
  })();

  useEffect(() => {
    // Load music setting from async storage
    const loadValue = async () => {
      try {
        const value = await AsyncStorage.getItem(dataKey);
        if (value !== null) {
          setSelectedValue(value);
        } else if (musicOptions.length > 0) {
          // Set default if no stored value
          setSelectedValue(musicOptions[0].label);
          await AsyncStorage.setItem(dataKey, musicOptions[0].label);
        }
      } catch (e) {
        console.error(`Error loading ${dataKey} setting:`, e);
      }
    };
    loadValue();
  }, [dataKey, musicOptions]);

  const handleValueChange = async (value: string) => {
    try {
      await AsyncStorage.setItem(dataKey, value);
      setSelectedValue(value);
      setPreviewKey((prev) => prev + 1);
      if (dataKey !== 'language') {
        loadMusicSettings();
      }
    } catch (e) {
      console.error(`Error saving ${dataKey} setting:`, e);
    }
  };

  // Find the selected sound object
  const findSelectedSound = () => {
    const music = musicOptions.find((item) => item.label === selectedValue);
    return music ? music.value : null;
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.musicPickerContainer}>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setModalVisible(true)}>
          <FontAwesome name="chevron-down" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.selectedValueText}>{selectedValue}</Text>
        </TouchableOpacity>
        {dataKey !== 'language' && (
          <SoundPreview
            key={`${selectedValue}-${previewKey}`}
            selectedSound={findSelectedSound()}
          />
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
                  data={musicOptions}
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
    backgroundColor: 'rgb(45, 55, 73)',
    borderRadius: 5,
  },
  musicPickerContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgb(45, 55, 73)',
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
    backgroundColor: 'rgb(36, 44, 59)', // Dark background for the actual content
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ModalPicker;
