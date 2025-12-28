import { Text } from '@/components/Themed';
import { DataKey } from '@/constants/media';
import { FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useData } from './data.provider';
import { getBlob, setBlob } from './data/indexeddb';
import { StorageService } from './data/storage';
import { useSound } from './sound.provider';

export type setting = 'breakMusic' | 'workoutMusic' | 'successSound';

interface MusicPickerProps {
  label: string;
  dataKey: setting;
}

// Helper: sanitize filenames to avoid issues with special characters
function sanitizeFilename(name: string) {
  // Keep common safe chars, replace the rest
  const cleaned = name.replace(/[^a-zA-Z0-9._-\s\(\)\[\]]/g, '_').replace(/\s+/g, ' ').trim();
  // Limit extremely long names
  return cleaned.length > 120 ? cleaned.slice(0, 120) : cleaned;
}

// Known audio extensions
const knownAudioExts = new Set(['mp3', 'wav', 'aac', 'ogg', 'm4a']);

async function fileExistsAndNonZero(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists && (typeof info.size !== 'number' || info.size > 0);
  } catch {
    return false;
  }
}

const ModalPicker: React.FC<MusicPickerProps> = ({ label, dataKey }) => {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const { workoutMusic, breakMusic, successSound, storeItem, getStoredItem, selectedWorkoutFile, selectedBreakFile } = useData();

  useEffect(() => {
    if (dataKey === 'workoutMusic' && selectedWorkoutFile?.uri) {
      setSelectedValue(selectedWorkoutFile.uri);
    }
    if (dataKey === 'breakMusic' && selectedBreakFile?.uri) {
      setSelectedValue(selectedBreakFile.uri);
    }
  }, [selectedWorkoutFile, selectedBreakFile, dataKey]);

  useEffect(() => {
    if (dataKey === 'workoutMusic' && selectedWorkoutFile?.uri) {
      setSelectedValue(selectedWorkoutFile.uri);
    }
    if (dataKey === 'breakMusic' && selectedBreakFile?.uri) {
      setSelectedValue(selectedBreakFile.uri);
    }
  }, [selectedWorkoutFile, selectedBreakFile, dataKey]);
  const [modalVisible, setModalVisible] = useState(false);
  const { loadMusicSettings } = useSound();
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackPosition, setTrackPosition] = useState(0);
  const [trackDuration, setTrackDuration] = useState(1);
  const [sliderDragging, setSliderDragging] = useState(false);
  const [isRadio, setIsRadio] = useState(false);
  let soundInstance = React.useRef<any>(null);

  // NEW: local state for persisted custom items
  const [customOptions, setCustomOptions] = useState<DataKey[]>([]);

  // Helper: map picker to custom list key
  const listKey = useMemo(() => {
    switch (dataKey) {
      case 'workoutMusic':
        return 'custom_workoutMusic' as const;
      case 'breakMusic':
        return 'custom_breakMusic' as const;
      case 'successSound':
        return 'custom_successSound' as const;
      default:
        return 'custom_workoutMusic' as const;
    }
  }, [dataKey]);

  

  

  // Helper: display a friendly label for selection
  const displaySelected = useMemo(() => {
    if (selectedLabel) return selectedLabel;
    if (!selectedValue) return '';
    if (
      selectedValue.startsWith('file:') ||
      selectedValue.startsWith('content:') ||
      selectedValue.startsWith('http')
    ) {
      try {
        const last = selectedValue.split('/').pop() || selectedValue;
        return decodeURIComponent(last);
      } catch {
        return selectedValue;
      }
    }
    if (selectedValue.startsWith('data:') || selectedValue.startsWith('blob:') || selectedValue.startsWith('indexeddb:')) {
      return 'Custom audio';
    }
    return selectedValue;
  }, [selectedLabel, selectedValue]);

  // Add helper to get random track by label
  function getRandomTrack(options: DataKey[], label: string) {
    const filtered = options.filter((item) =>
      item.label.toLowerCase().includes(label.toLowerCase())
    );
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)].value;
  }

  // NEW: load custom list into options (shared across workout+break)
  const loadCustomOptions = async () => {
    try {
      console.log('Loading custom options...');
      const [w, b, s] = await Promise.all([
        StorageService.getCustomAudio('custom_workoutMusic' as any),
        StorageService.getCustomAudio('custom_breakMusic' as any),
        StorageService.getCustomAudio('custom_successSound' as any),
      ]);
      console.log('Raw custom lists - workout:', w.length, 'break:', b.length, 'success:', s.length);
      
      const all = [...w, ...b, ...s];
      const byUri = new Map<string, { label: string; uri: string }>();
      for (const it of all) {
        if (!byUri.has(it.uri)) {
          byUri.set(it.uri, it);
          console.log('Added to dedup map:', it.label, '->', it.uri);
        } else {
          console.log('Skipped duplicate URI:', it.uri);
        }
      }
      
      const mapped: DataKey[] = Array.from(byUri.values()).map((x) => ({ label: x.label, value: x.uri }));
      console.log('Final custom options count:', mapped.length);
      console.log('Final custom options:', mapped.map(x => x.label));
      
      setCustomOptions(mapped);
    } catch (e: any) {
      console.error('Error loading custom audio list', e);
      Alert.alert('Load failed', e?.message || 'Could not load custom audio list');
    }
  };

  useEffect(() => {
    // Load music setting from async storage
    const loadValue = async () => {
      try {
        const [value, labelStored] = await Promise.all([
          getStoredItem(dataKey),
          getStoredItem((`${dataKey}Label`) as any),
        ]);
        if (value !== null) setSelectedValue(value);
        if (labelStored !== null) setSelectedLabel(labelStored);
      } catch (e) {
        console.error(`Error loading ${dataKey} setting:`, e);
      }
    };
    loadValue();
    loadCustomOptions();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      loadCustomOptions();
    }
  }, [modalVisible]);

  const saveSelection = async (value: string, labelToPersist?: string) => {
    try {
      await storeItem(dataKey, value);
      if (labelToPersist && labelToPersist.trim().length > 0) {
        await storeItem((`${dataKey}Label`) as any, labelToPersist);
        setSelectedLabel(labelToPersist);
      } else {
        // Clear any stale label so the filename shows
        await storeItem((`${dataKey}Label`) as any, '');
        setSelectedLabel('');
      }
      setSelectedValue(value);
      setPreviewKey((prev) => prev + 1);
      await loadMusicSettings();
    } catch (e: any) {
      console.error(`Error saving ${dataKey} setting:`, e);
      Alert.alert('Save failed', e?.message || 'Could not save your selection');
    }
  };

  const handlePickLocal = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/*', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const safeName = (file.name && file.name.trim().length > 0)
          ? file.name
          : decodeURIComponent((file.uri.split('/').pop() || 'Custom audio'));
        
        let uriToStore: string;
        
        if (Platform.OS === 'web') {
          // On web, convert the file to a blob and store it in IndexedDB
          try {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            
            // Create a unique key for this file
            const fileKey = `custom_audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Store the blob in IndexedDB
            await setBlob(fileKey, blob);
            
            // Store the IndexedDB key with a prefix
            uriToStore = `indexeddb:${fileKey}`;
            
            console.log(`[handlePickLocal] Stored web file "${safeName}" in IndexedDB with key: ${fileKey}`);
          } catch (error) {
            console.error('Error storing file in IndexedDB:', error);
            Alert.alert('Storage failed', 'Could not store the selected file for playback.');
            return;
          }
        } else {
          uriToStore = file.uri;
        }
        
        await StorageService.addCustomAudio(listKey, { label: safeName, uri: uriToStore });
        await saveSelection(uriToStore, safeName);
        await loadCustomOptions();
        
        Alert.alert('Success', `Added "${safeName}" to your custom audio list.`);
      }
    } catch (err: any) {
      console.error('Error picking local file:', err);
      Alert.alert('Selection failed', err?.message || 'Could not pick the file');
    } finally {
      setModalVisible(false);
    }
  };

  

  

  const handlePlay = async () => {
    try {
      let sound: any;
      if (dataKey === 'workoutMusic' && selectedValue === 'random:Action') {
        sound = getRandomTrack(workoutMusic, 'action');
      } else if (dataKey === 'workoutMusic' && selectedValue === 'random:Chill') {
        sound = getRandomTrack(workoutMusic, 'chill');
      } else if (dataKey === 'breakMusic' && selectedValue === 'random:Chill') {
        sound = getRandomTrack(breakMusic, 'chill');
      } else if (dataKey === 'breakMusic' && selectedValue === 'random:Action') {
        sound = getRandomTrack(breakMusic, 'action');
      } else {
        // Handle custom selected value
        if (selectedValue.startsWith('indexeddb:')) {
          // Retrieve from IndexedDB
          const fileKey = selectedValue.replace('indexeddb:', '');
          try {
            const blob = await getBlob(fileKey);
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              sound = { uri: blobUrl };
            } else {
              Alert.alert('Playback', 'The audio file could not be found. Please try selecting it again.');
              return;
            }
          } catch (error) {
            console.error('Error retrieving audio from IndexedDB:', error);
            Alert.alert('Playback failed', 'Could not retrieve the audio file for playback.');
            return;
          }
        } else {
          sound = { uri: selectedValue };
        }
      }

      if (!sound || sound.uri === 'web-reselect') {
        Alert.alert('Playback', 'This audio needs to be re-selected. Please pick the file again.');
        return;
      }

      if (typeof sound === 'string') {
        sound = { uri: sound };
      }

      // Verify file exists before attempting to load (skip for web blob/data URLs)
      if (typeof sound === 'object' && sound?.uri?.startsWith('file:')) {
        const exists = await fileExistsAndNonZero(sound.uri);
        if (!exists) {
          console.warn('File does not exist or is empty:', sound.uri);
          Alert.alert('Playback failed', 'The audio file could not be found or is corrupted. Please try selecting it again.');
          setIsPlaying(false);
          return;
        }
      } else if (typeof sound === 'object' && (sound?.uri?.startsWith('blob:') || sound?.uri?.startsWith('data:'))) {
        console.log('Skipping file existence check for blob/data URI (web environment)');
      }

      setIsRadio(typeof sound === 'string' ? sound.includes('http') : (sound?.uri?.startsWith('http') ?? false));

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
    } catch (err: any) {
      console.error('Error during playback:', err);
      Alert.alert('Playback failed', err?.message || 'Could not play this source');
      setIsPlaying(false);
    }
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

  // Build options including custom items, keeping "Pick…" pinned on top
  const options = useMemo(() => {
    let base: DataKey[] = [];
    const PICK: DataKey = { label: 'Pick from device…', value: '__PICK_LOCAL__' } as DataKey;

    const customsSorted = [...customOptions].sort((a, b) => a.label.localeCompare(b.label));

    switch (dataKey) {
      case 'workoutMusic': {
        base = [
          ...workoutMusic,
          { label: 'random:Action', value: 'RANDOM_ACTION' } as DataKey,
          { label: 'random:Chill', value: 'RANDOM_CHILL' } as DataKey,
        ].sort((a, b) => a.label.localeCompare(b.label));
        return [PICK, ...customsSorted, ...base];
      }
      case 'breakMusic': {
        base = [
          ...breakMusic,
          { label: 'random:Chill', value: 'RANDOM_CHILL' } as DataKey,
          { label: 'random:Action', value: 'RANDOM_ACTION' } as DataKey,
        ].sort((a, b) => a.label.localeCompare(b.label));
        return [PICK, ...customsSorted, ...base];
      }
      case 'successSound': {
        base = [...successSound].sort((a, b) => a.label.localeCompare(b.label));
        return [PICK, ...customsSorted, ...base];
      }
      default:
        return [PICK, ...customsSorted];
    }
  }, [dataKey, workoutMusic, breakMusic, successSound, customOptions]);

  const onSelectItem = async (item: DataKey) => {
    if (item.value === '__PICK_LOCAL__') {
      await handlePickLocal();
      return;
    }
    await saveSelection(item.value as string, item.label);
    setModalVisible(false);
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
                <Text style={styles.selectedValueText} numberOfLines={1}>
                  {displaySelected}
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
        <Pressable onPress={() => setModalVisible(false)} style={styles.modalOverlay}>
          <Pressable>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{label}</Text>
              <FlatList
                data={options}
                keyExtractor={(item, index) => `${item.label}-${item.value}-${index}`}
                getItemLayout={(data, index) => ({
                  length: 50,
                  offset: 50 * index,
                  index,
                })}
                windowSize={10}
                maxToRenderPerBatch={10}
                removeClippedSubviews={true}
                renderItem={({ item }) => {
                  const isSelected = selectedValue === item.label || selectedValue === (item.value as any);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        isSelected && styles.selectedOptionItem,
                      ]}
                      onPress={() => onSelectItem(item)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <FontAwesome name="check" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </Pressable>
        </Pressable>
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
    backgroundColor: 'rgba(41, 57, 68, 1)',
    borderRadius: 5,
    marginBottom: 15,
    justifyContent: 'space-between',
    minHeight: 50,
    paddingLeft: 10,
    paddingRight: 10,
  },
  pickerWithPreview: {
    backgroundColor: 'rgba(41, 57, 68, 1)',
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
    maxWidth: 260,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ModalPicker;
