import { Text, View } from '@/components/Themed';
import TimerButton from '@/components/TimerButton';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For Native storage
import Slider from '@react-native-community/slider';
import {
    useAudioRecorder,
    AudioModule,
    RecordingPresets,
    RecordingStatus as ExpoAudioRecordingStatus,
} from 'expo-audio';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Button,
  Platform, // Import Platform
} from 'react-native';
import commonStyles from '../styles';

// Helper type for webkit browsers (Web Audio API)
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// Type for status updates from expo-audio (assuming metering property)
interface NativeRecordingStatusWithMetering extends ExpoAudioRecordingStatus {
    metering?: number; // dB
}

// Helper flag for logging (to prevent console spam)
let nativeStatusListenerHasLoggedNoMetering = false;

export default function TabOneScreen() {
  // --- Counter State ---
  const [count, setCount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const repititions = [5, 10, 15, 200];

  // --- Shared Audio Trigger State ---
  const [sensitivitySetting, setSensitivitySetting] = useState<number>(50); // 0-100
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // Platform-dependent value
  const [statusMessage, setStatusMessage] = useState('Press "Start Listening"');

  // --- Refs ---
  const isMountedRef = useRef(true);
  const isLoopActiveRef = useRef(false); // For Web Audio RAF loop
  const lastTriggerTimestampRef = useRef<number>(0);

  // --- Web Audio API Refs (only used on Web) ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // --- Native (expo-audio) Hook ---
  // Define the status listener callback for useAudioRecorder
  const handleNativeStatusUpdate = useCallback((status: NativeRecordingStatusWithMetering) => {
    if (!isMountedRef.current || !nativeRecorder?.isRecording) {
        // If no longer recording or unmounted, ensure level is reset
        if (isMountedRef.current && audioLevel !== -160) setAudioLevel(-160);
        return;
    }

    // console.log("Native Status Update:", status); // DEBUG
    if (status && typeof status.metering === 'number') {
      setAudioLevel(status.metering);
      nativeStatusListenerHasLoggedNoMetering = false;
    } else if (status && !nativeStatusListenerHasLoggedNoMetering) {
      console.warn("Native: Metering property missing or not a number:", status);
      nativeStatusListenerHasLoggedNoMetering = true;
    }
  }, [/* nativeRecorder?.isRecording might be needed if the hook instance is stable */]); // nativeRecorder comes from below

  const nativeRecorder = Platform.OS !== 'web' ? useAudioRecorder(
    {
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true, // Critical for native
      // Remove numberOfChannels, just spread the preset
      android: { ...RecordingPresets.HIGH_QUALITY.android },
      ios: { ...RecordingPresets.HIGH_QUALITY.ios },
    },
    handleNativeStatusUpdate // Pass the listener
  ) : null; // Only initialize hook on native

  // --- Callbacks ---
  const handleCountUp = useCallback(() => {
    if (!isMountedRef.current) return;
    setCount((prevCount) => prevCount + 1);
    setRemaining((prevRemaining) => (prevRemaining > 0 ? prevRemaining - 1 : 0));
  }, []);

  const handleCountDown = useCallback(() => {
    if (count > 0) {
      setCount((prevCount) => prevCount - 1);
      if (remaining >= 0) setRemaining((prevRemaining) => prevRemaining + 1);
    }
   }, [count, remaining]);

  const handleSetRemaining = useCallback((value: number) => {
    setCount(0);
    setRemaining(value);
   }, []);

  const handleReset = useCallback(() => {
    setCount(0);
    setRemaining(0);
  }, []);

  const handleSliderChange = useCallback((value: number) => {
    if (isMountedRef.current) {
      setSensitivitySetting(value); // Update shared sensitivity
    }
    // Persist based on platform
    if (Platform.OS === 'web') {
      try { localStorage.setItem('audioSensitivitySetting', value.toString()); }
      catch (e) { console.error("Web: Error saving sensitivity:", e); }
    } else {
      AsyncStorage.setItem('audioSensitivitySetting', value.toString())
        .catch((err) => console.error('Native: Error saving sensitivity:', err));
    }
  }, []);

  // --- Effects ---
  // Mount/Unmount Effect: Load sensitivity & Native Permissions
  useEffect(() => {
    isMountedRef.current = true;
    let initialSensitivity = 50;

    // Load sensitivity setting
    (async () => {
      const key = 'audioSensitivitySetting';
      try {
        let storedValue: string | null = null;
        if (Platform.OS === 'web') {
          storedValue = localStorage.getItem(key);
        } else {
          storedValue = await AsyncStorage.getItem(key);
        }
        if (storedValue !== null) {
          const parsed = parseFloat(storedValue);
          const clamped = Math.max(0, Math.min(100, parsed));
          if (!isNaN(clamped)) initialSensitivity = clamped;
        }
      } catch (e) { console.error('Failed to load sensitivity', e); }
      if (isMountedRef.current) setSensitivitySetting(initialSensitivity);
    })();

    // Request Native Permissions on mount (if not web)
    if (Platform.OS !== 'web') {
      (async () => {
        console.log("Requesting native recording permissions (expo-audio)...");
        const permStatus = await AudioModule.requestRecordingPermissionsAsync();
        if (!permStatus.granted) {
          console.warn('Native microphone permission denied');
          Alert.alert('Permission Required', 'Microphone access is needed.');
        }
      })();
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      console.log('TabOneScreen unmounting...');
      if (Platform.OS === 'web') {
        isLoopActiveRef.current = false; // For web RAF loop
        if (isListening) stopListeningWeb();
      } else {
        if (nativeRecorder && nativeRecorder.isRecording) {
          console.warn("Unmounting native while recording - attempting stop");
          nativeRecorder.stop().catch(e => console.error("Error stopping native on unmount:", e));
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeRecorder]); // Add nativeRecorder as dep for its methods in cleanup

  // Triggering Effect (Platform-Specific Logic)
  useEffect(() => {
    const COOLDOWN_MS = 300;
    if (!isListening || sensitivitySetting === null) return; // Only run if listening & sensitivity set

    const now = performance.now();
    if (now - lastTriggerTimestampRef.current <= COOLDOWN_MS) {
      // console.log("Trigger ignored (cooldown)");
      return;
    }

    let triggered = false;

    if (Platform.OS === 'web') {
      if (isLoopActiveRef.current && audioLevel > 0) {
        const minThreshold = 1;  // Web: peak deviation (0-128)
        const maxThreshold = 64;
        const webThreshold = Math.round(maxThreshold - (sensitivitySetting / 100) * (maxThreshold - minThreshold));
        if (audioLevel > webThreshold) {
          console.log(`Web Clap Detected! Level: ${audioLevel}, Threshold: ${webThreshold}. Triggering count.`);
          triggered = true;
        }
      }
    } else { // Native (iOS/Android)
      if (nativeRecorder?.isRecording && audioLevel !== -160) { // audioLevel is dB (-160 to 0)
        // Map sensitivity (0-100) to dB threshold.
        // 0 sensitivity = -20dB (harder to trigger)
        // 100 sensitivity = -70dB (easier to trigger)
        const minDbThreshold = -70; // Most sensitive
        const maxDbThreshold = -20; // Least sensitive
        const nativeThreshold = Math.round(maxDbThreshold - (sensitivitySetting / 100) * (maxDbThreshold - minDbThreshold));

        if (audioLevel > nativeThreshold) {
          console.log(`Native Clap Detected! Level: ${audioLevel.toFixed(1)}dB, Threshold: ${nativeThreshold}dB. Triggering count.`);
          triggered = true;
        }
      }
    }

    if (triggered) {
      lastTriggerTimestampRef.current = now;
      handleCountUp();
    }
  }, [audioLevel, sensitivitySetting, isListening, handleCountUp, nativeRecorder]);


  // --- Web Audio Functions (Only for Platform.OS === 'web') ---
  const stopListeningWeb = async () => {
    console.log('>>> stopListeningWeb CALLED <<<');
    isLoopActiveRef.current = false; lastTriggerTimestampRef.current = 0;
    if (!isMountedRef.current) { return; };
    setIsListening(false); setStatusMessage('Press "Start Listening"'); setAudioLevel(0);
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    try { mediaStreamSourceRef.current?.disconnect(); } catch(e) {}
    try { analyserNodeRef.current?.disconnect(); } catch(e) {}
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close().catch(e => console.error("Web: Error closing context:", e));
    }
    audioStreamRef.current = null; mediaStreamSourceRef.current = null; analyserNodeRef.current = null; audioContextRef.current = null; dataArrayRef.current = null;
    console.log('Web Audio stopped and cleaned up.');
   };

  const startListeningWeb = async () => {
    if (!isMountedRef.current) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { Alert.alert('Error', 'Browser not supported.'); return; }
    if (isListening || audioContextRef.current) { console.log("Web: Already listening."); return; }
    let stream: MediaStream | null = null;
    try {
      setStatusMessage('Requesting permission...'); stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream; if (!isMountedRef.current) { stream?.getTracks().forEach(t => t.stop()); audioStreamRef.current = null; return; }
    } catch (err) {
        console.error('Web: Mic access error:', err);
        if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) { setStatusMessage('Permission denied.'); Alert.alert('Permission Denied','Please allow microphone access.'); }
        else { setStatusMessage('Mic access error.'); Alert.alert('Error',`Could not access microphone.`); }
        audioStreamRef.current = null; return;
    }
    setStatusMessage('Initializing web audio...');
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)(); audioContextRef.current = context;
      if (context.state === 'suspended') { await context.resume(); }
      if (!isMountedRef.current || context.state !== 'running') { if(context.state !== 'closed') await context.close(); audioContextRef.current = null; throw new Error("Context not running"); }
      const currentStream = audioStreamRef.current; if (!currentStream) throw new Error("Stream null.");
      const source = context.createMediaStreamSource(currentStream); mediaStreamSourceRef.current = source;
      const analyser = context.createAnalyser(); analyserNodeRef.current = analyser;
      analyser.fftSize = 512; const bufferLength = analyser.frequencyBinCount; dataArrayRef.current = new Uint8Array(bufferLength);
      source.connect(analyser);
      setStatusMessage('Listening (Web)...'); lastTriggerTimestampRef.current = 0; isLoopActiveRef.current = true; setIsListening(true); setAudioLevel(0);
      analyzeAudioWeb();
    } catch (err) {
       console.error('Web Audio setup error:', err); setStatusMessage(`Web Audio setup error.`); Alert.alert('Audio Error', `Failed to init web audio.`);
       stopListeningWeb(); // Attempt full cleanup on error
    }
  };

  const analyzeAudioWeb = () => {
    if (!analyserNodeRef.current || !dataArrayRef.current || !audioContextRef.current || audioContextRef.current.state !== 'running' || !isMountedRef.current || !isLoopActiveRef.current ) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null;
        if(isListening && isMountedRef.current) setIsListening(false); isLoopActiveRef.current = false; return;
    }
    const analyser = analyserNodeRef.current; const dataArray = dataArrayRef.current;
    try { analyser.getByteTimeDomainData(dataArray); } catch (error) { isLoopActiveRef.current = false; if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; return; }
    let peakDeviation = 0; for (let i = 0; i < dataArray.length; i++) { const d = Math.abs(dataArray[i] - 128); if (d > peakDeviation) peakDeviation = d; }
    if (isMountedRef.current) { setAudioLevel(peakDeviation); }
    if (isLoopActiveRef.current && isMountedRef.current) { animationFrameRef.current = requestAnimationFrame(analyzeAudioWeb); }
    else { animationFrameRef.current = null; }
  };


  // --- Native (expo-audio) Functions ---
  const startListeningNative = async () => {
    if (!nativeRecorder || !isMountedRef.current) {
        Alert.alert("Error", "Audio recorder not available.");
        return;
    }
     // Check permissions again just before starting
     const perm = await AudioModule.getRecordingPermissionsAsync();
     if (!perm.granted) {
         Alert.alert("Permission Required", "Microphone permission is needed. Please grant it and try again.");
         return;
     }

    try {
      setStatusMessage('Initializing native audio...');
      if(isMountedRef.current) setAudioLevel(-160); // Reset level
      await nativeRecorder.prepareToRecordAsync({
        // isMeteringEnabled: true, // This is set in useAudioRecorder options
      });
      console.log('Starting native recording (expo-audio)...');
      await nativeRecorder.record();
      if (isMountedRef.current) setIsListening(true); // Update UI state
      nativeStatusListenerHasLoggedNoMetering = false; // Reset log flag
      setStatusMessage('Listening (Native)...');
    } catch (error) {
      console.error("Failed to start native recording:", error);
      Alert.alert("Error", "Could not start native recording.");
      if (isMountedRef.current) setIsListening(false);
    }
  };

  const stopListeningNative = async () => {
    if (!nativeRecorder || !isMountedRef.current) return;
    try {
      setStatusMessage('Stopping native audio...');
      console.log('Stopping native recording (expo-audio)...');
      await nativeRecorder.stop();
      console.log('Native recording stopped. URI:', nativeRecorder.uri);
      if (isMountedRef.current) {
        setIsListening(false);
        setAudioLevel(-160); // Reset level
        setStatusMessage('Press "Start Listening"');
      }
    } catch (error) {
      console.error("Failed to stop native recording:", error);
      Alert.alert("Error", "Could not stop native recording cleanly.");
      if (isMountedRef.current) setIsListening(false); // Ensure UI state reset
    }
  };

  // --- Main Toggle Function ---
   const toggleListening = () => {
    if (isListening) {
      if (Platform.OS === 'web') stopListeningWeb();
      else stopListeningNative();
    } else {
      if (Platform.OS === 'web') startListeningWeb();
      else startListeningNative();
    }
  };

  // --- Render ---
  const currentPlatform = Platform.OS;
  let levelDisplayText = `Mic Level: ${audioLevel.toFixed(0)}`;
  if (currentPlatform === 'web') levelDisplayText += ' / 128';
  else if (currentPlatform as any !== 'web' && audioLevel > -159) levelDisplayText = `Mic Level: ${audioLevel.toFixed(1)} dB`;
  else if (currentPlatform as any !== 'web') levelDisplayText = 'Mic Level: --- dB';

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        {/* --- Sound Trigger Tile --- */}
        <Text style={commonStyles.tileTitle}>Sound trigger</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
                <Slider
                  value={sensitivitySetting ?? 50}
                  disabled={isListening}
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  onValueChange={handleSliderChange}
                  thumbTintColor={isListening ? '#FF0000' : '#00bcd4'}
                  minimumTrackTintColor={isListening ? '#FF6666' : '#00bcd4'}
                  maximumTrackTintColor="gray"
                />
                <Text style={styles.audioLevel}>{levelDisplayText}</Text>
                <TimerButton
                  text={isListening ? 'Stop Listening' : 'Start Listening'}
                  onPress={toggleListening}
                  isSelected={isListening ? true : false}
                  // Optionally disable if permissions were permanently denied, based on perm state
                />
          </View>
        </View>

        {/* --- Counter Tile --- */}
        <Text style={commonStyles.tileTitle}>Counter</Text>
        <View style={[commonStyles.tile, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
          <View style={styles.innerWrapperBottomTile}>
             {/* ... (Counter JSX as before) ... */}
             <View style={{ backgroundColor: 'transparent', alignItems: 'center' }}>
                 <View style={styles.buttonContainerReps}>
                    {repititions.map((rep, index) => ( <TimerButton key={index} text={rep.toString()} onPress={() => handleSetRemaining(rep)} style={{ marginHorizontal: 5 }} /> ))}
                 </View>
                 <Text style={styles.remainingLabel}>Target Reps:</Text><Text style={styles.remaining}>{remaining > 0 ? remaining : '-'}</Text>
             </View>
             <View style={styles.buttonContainer}>
                 <TouchableOpacity style={styles.triangleLeft} onPress={handleCountDown} />
                 <Text style={styles.count}>{count}</Text>
                 <TouchableOpacity style={styles.triangleRight} onPress={handleCountUp} />
             </View>
             <TimerButton maxWidth={true} text="Reset" onPress={handleReset} />
          </View>
        </View>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
    innerWrapperTopTile: { alignItems: 'center', justifyContent: 'center', width: '95%', paddingVertical: 15 },
    innerWrapperBottomTile: { flex: 1, flexDirection: 'column', justifyContent: 'space-around', width: '95%', alignItems: 'center', paddingVertical: 5, backgroundColor: 'transparent' },
    count: { fontSize: 110, fontWeight: 'bold', color: 'white', textAlign: 'center', minWidth: 150 },
    remainingLabel: { color: '#ccc', fontSize: 14, marginBottom: 2 },
    remaining: { color: 'white', fontSize: 24, fontWeight: 'bold', marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#fff', textAlign: 'center', width: 80, marginBottom: 15 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '95%', backgroundColor: 'transparent', marginVertical: 5 },
    buttonContainerReps: { display: 'flex', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', backgroundColor: 'transparent', marginBottom: 10 },
    sliderLabel: { fontSize: 14, color: '#ccc', marginBottom: 2 }, // This was missing in your provided render, re-added for context
    sliderValueLabel: { fontSize: 12, color: '#aaa', marginBottom: 5 }, // This was missing in your provided render, re-added for context
    slider: { width: '90%', height: 40, marginBottom: 15 },
    triangleLeft: { width: 0, height: 0, borderTopWidth: 40, borderRightWidth: 35, borderBottomWidth: 40, borderStyle: 'solid', backgroundColor: 'transparent', borderTopColor: 'transparent', borderRightColor: 'rgb(64, 85, 89)', borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
    triangleRight: { width: 0, height: 0, borderTopWidth: 40, borderLeftWidth: 35, borderBottomWidth: 40, borderStyle: 'solid', backgroundColor: 'transparent', borderTopColor: 'transparent', borderLeftColor: 'rgb(64, 85, 89)', borderBottomColor: 'transparent', borderRightColor: 'transparent' },
    audioLevel: { fontSize: 14, color: '#aaa', backgroundColor: 'transparent', marginTop: 0, marginBottom: 15, height: 20, textAlign: 'center' },
    statusText: { fontSize: 14, color: '#ddd', marginBottom: 15, fontStyle: 'italic', minHeight: 20 }, // This was missing in your provided render, re-added for context
});
