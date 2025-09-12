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
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useData } from './data.provider';
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
  const { workoutMusic, breakMusic, successSound, storeItem, getStoredItem } = useData();
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

  // Helper: (optional) copy picked file to app documents so it persists
  async function ensurePermanentCopy(uri: string, suggestedName?: string, mimeType?: string) {
    try {
      const dir = `${FileSystem.documentDirectory}customAudio/`;
      try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); } catch {}

      // Determine filename + ensure proper extension
      let baseName = suggestedName || (uri.split('/').pop() || `picked_${Date.now()}`);
      let ext = '';
      const lastDot = baseName.lastIndexOf('.');
      if (lastDot > -1 && lastDot < baseName.length - 1) {
        ext = baseName.slice(lastDot + 1).toLowerCase();
      }
      const extMap: Record<string, string> = {
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
        'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/m4a': 'm4a', 'audio/x-m4a': 'm4a',
      };
      const inferredExt = (mimeType && extMap[mimeType]) || (extMap[(uri.split(';')[0] || '') as keyof typeof extMap]) || (ext || 'mp3');
      const hasKnownExt = knownAudioExts.has(ext);
      if (!hasKnownExt) {
        // Append inferred extension if missing or unknown
        baseName = baseName.replace(/\.+$/, '');
        baseName = `${baseName}.${inferredExt}`;
      }

      const safeName = sanitizeFilename(baseName);
      const dest = `${dir}${Date.now()}_${safeName}`;

      if (uri.startsWith('data:')) {
        console.log('ensurePermanentCopy - processing data URI...');
        const matches = uri.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          console.log('ensurePermanentCopy - writing base64 to:', dest);
          await FileSystem.writeAsStringAsync(dest, matches[2], { encoding: FileSystem.EncodingType.Base64 });
          const exists = await fileExistsAndNonZero(dest);
          if (exists) {
            console.log('ensurePermanentCopy - successfully created file:', dest);
            return dest;
          } else {
            console.error('ensurePermanentCopy - file creation failed for data URI');
          }
        } else {
          console.error('ensurePermanentCopy - invalid data URI format');
        }
        throw new Error('Failed to convert data URI to file');
      }

      if (uri.startsWith('file:')) {
        await FileSystem.copyAsync({ from: uri, to: dest });
        if (await fileExistsAndNonZero(dest)) return dest;
        return uri;
      }

      if (uri.startsWith('content:')) {
        try {
          await FileSystem.copyAsync({ from: uri, to: dest });
          if (await fileExistsAndNonZero(dest)) return dest;
        } catch {}
        // Fallback: StorageAccessFramework read as base64
        try {
          // @ts-ignore: SAF available on native platforms
          const base64 = await (FileSystem as any).StorageAccessFramework?.readAsStringAsync?.(uri, { encoding: FileSystem.EncodingType.Base64 });
          if (base64) {
            await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });
            if (await fileExistsAndNonZero(dest)) return dest;
          }
        } catch {}
        // Last resort: generic read as base64
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });
          if (await fileExistsAndNonZero(dest)) return dest;
        } catch {}
        return uri;
      }

      return uri;
    } catch (e) {
      console.warn('Failed to persist copy, using original URI', e);
      return uri;
    }
  }

  // Helper: persist a data: URI to a permanent file and return a file:// path
  async function persistDataUri(dataUri: string, suggestedName?: string, mimeType?: string) {
    try {
      console.log('persistDataUri - starting conversion...');
      const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        console.error('persistDataUri - invalid data URI format');
        throw new Error('Invalid data URI format');
      }
      
      // Check if we're in a web environment
      const isWeb = typeof window !== 'undefined' && !FileSystem.documentDirectory;
      
      if (isWeb) {
        // For web: use localStorage or just return a blob URL
        console.log('persistDataUri - web environment detected, using blob URL');
        try {
          // Convert base64 to blob
          const base64 = matches[2];
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const resolvedMime = mimeType || matches[1] || 'audio/mpeg';
          const blob = new Blob([bytes], { type: resolvedMime });
          const blobUrl = URL.createObjectURL(blob);
          
          console.log('persistDataUri - created blob URL:', blobUrl);
          return blobUrl;
        } catch (error) {
          console.warn('persistDataUri - blob creation failed, using original data URI:', error);
          return dataUri; // Fallback to original data URI for web
        }
      }
      
      // Native environment: use file system
      const dir = `${FileSystem.documentDirectory}customAudio/`;
      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        console.log('persistDataUri - created directory:', dir);
      } catch (dirError) {
        console.log('persistDataUri - directory already exists or error:', dirError);
      }
      
      const resolvedMime = mimeType || matches[1] || 'application/octet-stream';
      console.log('persistDataUri - resolved MIME:', resolvedMime);
      
      const extMap: Record<string, string> = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/aac': 'aac',
        'audio/ogg': 'ogg',
        'audio/m4a': 'm4a',
        'audio/x-m4a': 'm4a',
      };
      const inferredExt = extMap[resolvedMime] || 'mp3'; // Default to mp3
      
      // Create safe filename
      let baseName = suggestedName || `audio_${Date.now()}`;
      if (!baseName.includes('.')) {
        baseName = `${baseName}.${inferredExt}`;
      }
      const safeFileName = sanitizeFilename(baseName);
      const finalPath = `${dir}${Date.now()}_${safeFileName}`;
      
      console.log('persistDataUri - writing to:', finalPath);
      const base64 = matches[2];
      await FileSystem.writeAsStringAsync(finalPath, base64, { encoding: FileSystem.EncodingType.Base64 });
      
      // Verify file was created successfully
      const exists = await fileExistsAndNonZero(finalPath);
      if (!exists) {
        console.error('persistDataUri - file was not created or is empty');
        throw new Error('Failed to create file from data URI');
      }
      
      console.log('persistDataUri - successfully created file:', finalPath);
      return finalPath;
    } catch (e) {
      console.error('persistDataUri - failed to convert data URI:', e);
      // For web environments, fallback to using the original data URI
      if (typeof window !== 'undefined') {
        console.warn('persistDataUri - using fallback for web environment');
        return dataUri;
      }
      throw new Error(`Failed to convert data URI to file: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

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
    if (selectedValue.startsWith('data:') || selectedValue.startsWith('blob:')) {
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
        console.log('Picked file:', file.name, 'URI:', file.uri, 'MIME:', (file as any).mimeType);
        
        // CRITICAL: Never store data URIs directly - always convert to file URIs first
        let finalUri = file.uri;
        
        if (finalUri.startsWith('data:')) {
          console.log('Converting data URI to file URI...');
          try {
            finalUri = await persistDataUri(finalUri, file.name, (file as any).mimeType);
            console.log('Converted data URI to:', finalUri);
            
            // Double-check the conversion worked
            if (finalUri.startsWith('data:')) {
              console.error('persistDataUri failed - still returned data URI');
              Alert.alert('File Error', 'Failed to convert the selected file. Please try a different file or try again.');
              return;
            }
          } catch (error) {
            console.error('persistDataUri error:', error);
            Alert.alert('File Error', `Could not convert the selected file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return;
          }
        } else if (finalUri.startsWith('content:') || !finalUri.startsWith('file:')) {
          console.log('Converting content/other URI to permanent file...');
          try {
            finalUri = await ensurePermanentCopy(finalUri, file.name, (file as any).mimeType);
            console.log('Converted to permanent file:', finalUri);
          } catch (error) {
            console.error('ensurePermanentCopy error:', error);
            Alert.alert('File Error', `Could not copy the selected file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return;
          }
        }
        
        // Double-check: ensure we have a playable URI before storing
        const isWeb = typeof window !== 'undefined';
        const isValidUri = finalUri.startsWith('file:') || 
                          finalUri.startsWith('blob:') || 
                          (isWeb && finalUri.startsWith('data:'));
                          
        if (!isValidUri) {
          console.error('Final URI is not a valid playable URI:', finalUri);
          Alert.alert('File Error', 'Could not convert the selected file to a playable format. Please try a different file.');
          return;
        }
        
        const safeName = (file.name && file.name.trim().length > 0)
          ? file.name
          : decodeURIComponent((finalUri.split('/').pop() || 'Custom audio'));
        console.log('Safe name:', safeName);
        
        // Verify file exists before adding to storage (skip for web blob URLs)
        if (finalUri.startsWith('file:')) {
          const exists = await fileExistsAndNonZero(finalUri);
          if (!exists) {
            console.error('Final file does not exist or is empty:', finalUri);
            Alert.alert('File Error', 'The selected file could not be copied properly. Please try again.');
            return;
          }
        } else if (finalUri.startsWith('blob:') || finalUri.startsWith('data:')) {
          console.log('Skipping file existence check for blob/data URI (web environment)');
        }
        
        console.log('File verified, size check passed. Adding to storage...');
        
        // Add to both workout and break custom lists so it shows in both modals
        const keysToUpdate: Array<'custom_workoutMusic' | 'custom_breakMusic'> = ['custom_workoutMusic', 'custom_breakMusic'];
        for (const k of keysToUpdate) {
          console.log(`Adding to ${k}: ${safeName} -> ${finalUri}`);
          await StorageService.addCustomAudio(k as any, { label: safeName, uri: finalUri });
        }
        
        // Debug: verify contents after write
        try {
          const [cw, cb] = await Promise.all([
            StorageService.getCustomAudio('custom_workoutMusic' as any),
            StorageService.getCustomAudio('custom_breakMusic' as any),
          ]);
          console.log('=== STORAGE VERIFICATION ===');
          console.log('custom_workoutMusic count:', cw.length);
          console.log('custom_workoutMusic items:', cw.map((x) => `${x.label} -> ${x.uri}`));
          console.log('custom_breakMusic count:', cb.length);
          console.log('custom_breakMusic items:', cb.map((x) => `${x.label} -> ${x.uri}`));
          console.log('=== END VERIFICATION ===');
        } catch (e) {
          console.error('Failed to verify storage:', e);
        }
        
        await saveSelection(finalUri, safeName);
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

  const handleValueChange = async (labelToStore: string) => {
    await saveSelection(labelToStore, labelToStore);
    setModalVisible(false);
  };

  // Find the selected sound object or build from URI
  const findSelectedSound = async () => {
    if (!selectedValue) return null as any;
    
    // Handle blob, data, file, content, and http URIs
    if (
      selectedValue.startsWith('file:') ||
      selectedValue.startsWith('content:') ||
      selectedValue.startsWith('http') ||
      selectedValue.startsWith('blob:') ||
      selectedValue.startsWith('data:')
    ) {
      // For web environments, handle blob and data URIs directly
      if (selectedValue.startsWith('blob:')) {
        console.log('findSelectedSound - using blob URI directly:', selectedValue);
        return { uri: selectedValue } as any;
      }
      
      if (selectedValue.startsWith('data:')) {
        // For web, use data URI directly if it's small enough
        const isWeb = typeof window !== 'undefined';
        if (isWeb) {
          console.log('findSelectedSound - using data URI directly for web');
          return { uri: selectedValue } as any;
        } else {
          // For native, convert data URI to file
          const persisted = await persistDataUri(selectedValue, selectedLabel);
          return { uri: persisted } as any;
        }
      }
      
      if (selectedValue.startsWith('content:')) {
        const playable = await ensurePermanentCopy(selectedValue, selectedLabel);
        return { uri: playable } as any;
      }
      
      return { uri: selectedValue } as any;
    }
    
    // Handle preset audio options
    const music = options.find((item) => item.label === selectedValue);
    return music ? (music.value as any) : null;
  };

  // Play sound and show slider
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
        sound = await findSelectedSound();
      }

      if (!sound) {
        Alert.alert('Playback', 'No source to play. Please select an item.');
        return;
      }

      if (typeof sound === 'string') {
        sound = { uri: sound };
      }

      if (typeof sound === 'object' && sound?.uri) {
        // Handle different URI types for web vs native
        const isWeb = typeof window !== 'undefined';
        
        if (sound.uri.startsWith('blob:')) {
          console.log('handlePlay - using blob URI for playback:', sound.uri);
          // Use blob URI directly - don't convert it
        } else if (sound.uri.startsWith('data:') && isWeb) {
          console.log('handlePlay - using data URI for web playback');
          // Use data URI directly for web
        } else if (sound.uri.startsWith('data:') || sound.uri.startsWith('content:')) {
          console.log('handlePlay - converting URI for native playback');
          const playable = await ensurePermanentCopy(sound.uri, selectedLabel);
          sound = { uri: playable };
        }
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
      try {
        await playback.loadAsync(sound);
      } catch (e: any) {
        if (typeof sound === 'object' && (sound?.uri?.startsWith('data:') || sound?.uri?.startsWith('content:'))) {
          const playable = await ensurePermanentCopy(sound.uri, selectedLabel);
          await playback.loadAsync({ uri: playable });
        } else {
          throw e;
        }
      }
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

  // Selecting an item: if custom (URI) save URI+label, else save label
  const onSelectItem = async (item: DataKey) => {
    if (item.value === '__PICK_LOCAL__') {
      await handlePickLocal();
      return;
    }
    const isUri = typeof item.value === 'string' && (item.value.startsWith('file:') || item.value.startsWith('content:') || item.value.startsWith('http') || item.value.startsWith('data:') || item.value.startsWith('blob:'));
    if (isUri) {
      let uri = item.value as string;
      if (uri.startsWith('content:') || uri.startsWith('data:')) {
        try {
          const playable = uri.startsWith('data:')
            ? await persistDataUri(uri, item.label)
            : await ensurePermanentCopy(uri, item.label);
          if (playable && playable !== uri) {
            // Update both workout and break lists
            const keysToUpdate: Array<'custom_workoutMusic' | 'custom_breakMusic'> = ['custom_workoutMusic', 'custom_breakMusic'];
            for (const k of keysToUpdate) {
              try { await StorageService.removeCustomAudio(k as any, uri); } catch {}
              await StorageService.addCustomAudio(k as any, { label: item.label, uri: playable });
            }
            await loadCustomOptions();
            uri = playable;
          }
        } catch (e: any) {
          console.warn('Failed to convert custom URI, using original', e);
          Alert.alert('Conversion failed', e?.message || 'Using original file reference');
        }
      } else {
        // For blob, file, and http URIs, just ensure item exists in both lists
        const keysToUpdate: Array<'custom_workoutMusic' | 'custom_breakMusic'> = ['custom_workoutMusic', 'custom_breakMusic'];
        for (const k of keysToUpdate) {
          await StorageService.addCustomAudio(k as any, { label: item.label, uri });
        }
      }
      await saveSelection(uri, item.label);
    } else {
      await handleValueChange(item.label);
    }
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
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{label}</Text>
                <FlatList
                  data={options}
                  keyExtractor={(item, index) => `${item.label}-${item.value}-${index}`}
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
    backgroundColor: 'rgb(31, 39, 44)',
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
    maxWidth: 260,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ModalPicker;
