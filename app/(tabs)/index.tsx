import { useData } from '@/components/data.provider';
import { Text, View } from '@/components/Themed';
import TimerButton from '@/components/TimerButton';
import { TriangleLeft } from '@/components/TriangleLeft';
import { TriangleRight } from '@/components/TriangleRight';
import Slider from '@react-native-community/slider';
import {
  AudioModule,
  RecordingStatus as ExpoAudioRecordingStatus,
  RecordingPresets,
  useAudioRecorder,
} from 'expo-audio';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Platform,
  StyleSheet
} from 'react-native';
import commonStyles from '../styles';


declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}


interface NativeRecordingStatusWithMetering extends ExpoAudioRecordingStatus {
    metering?: number; 
}


let nativeStatusListenerHasLoggedNoMetering = false;

export default function TabOneScreen() {
  
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const repititions = [5, 10, 15, 200];

  const { storeItem,getStoredItem } = useData();

  const [sensitivitySetting, setSensitivitySetting] = useState<number>(50);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); 
  
  const [statusMessage, setStatusMessage] = useState('Press "Start Listening"');


  
  const isMountedRef = useRef(true);
  const isLoopActiveRef = useRef(false); 
  const lastTriggerTimestampRef = useRef<number>(0);

  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  
  const handleNativeStatusUpdate = useCallback((status: NativeRecordingStatusWithMetering) => {
    if (!isMountedRef.current || !nativeRecorder?.isRecording) {
        if (isMountedRef.current && audioLevel !== -160) setAudioLevel(-160);
        return;
    }
    if (status && typeof status.metering === 'number') {
      setAudioLevel(status.metering);
      nativeStatusListenerHasLoggedNoMetering = false;
    } else if (status && !nativeStatusListenerHasLoggedNoMetering) {
      console.warn("Native: Metering property missing or not a number:", status);
      nativeStatusListenerHasLoggedNoMetering = true;
    }
  }, [audioLevel]); 

  const nativeRecorder = Platform.OS !== 'web' ? useAudioRecorder(
    {
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
      android: { ...RecordingPresets.HIGH_QUALITY.android }, 
      ios: { ...RecordingPresets.HIGH_QUALITY.ios },       
    },
    handleNativeStatusUpdate
  ) : null;

  
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
      setSensitivitySetting(value);
    }
    const key = 'audioSensitivitySetting';
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value.toString()); }
      catch (e) { console.error("Web: Error saving sensitivity:", e); }
    } else {
      storeItem(key, value.toString())
        .catch((err) => console.error('Native: Error saving sensitivity:', err));
    }
  }, []);

  
  useEffect(() => {
    isMountedRef.current = true;
    let initialSensitivity = 50;
    (async () => {
      const key = 'audioSensitivitySetting';
      try {
        let storedValue: string | null = null;
        if (Platform.OS === 'web') {
          storedValue = localStorage.getItem(key);
        } else {
          storedValue = await getStoredItem(key);
        }
        if (storedValue !== null) {
          const parsed = parseFloat(storedValue);
          const clamped = Math.max(0, Math.min(100, parsed));
          if (!isNaN(clamped)) initialSensitivity = clamped;
        }
      } catch (e) { console.error('Failed to load sensitivity', e); }
      if (isMountedRef.current) setSensitivitySetting(initialSensitivity);
    })();

    if (Platform.OS !== 'web') {
      (async () => {
        const permStatus = await AudioModule.requestRecordingPermissionsAsync();
        if (!permStatus.granted) {
          Alert.alert('Permission Required', 'Microphone access is needed.');
        }
      })();
    }

    return () => {
      isMountedRef.current = false;
      if (Platform.OS === 'web') {
        isLoopActiveRef.current = false;
        if (isListening) stopListeningWeb();
      } else {
        if (nativeRecorder && nativeRecorder.isRecording) {
          nativeRecorder.stop()
            .then(() => console.log("Unmount: Native recorder stopped successfully."))
            .catch(e => console.error("Unmount: Error stopping native recorder:", e));
        } else {
            console.log("Unmount: Native recorder not active or not available at unmount time.");
        }
      }
    };
  }, []); 

  useEffect(() => {
    const COOLDOWN_MS = 100;
    if (!isListening || sensitivitySetting === null) return;
    const now = performance.now();
    if (now - lastTriggerTimestampRef.current <= COOLDOWN_MS) return;

    let triggered = false;
    if (Platform.OS === 'web') {
      if (isLoopActiveRef.current && audioLevel > 0) {
        const minThreshold = 1; const maxThreshold = 64;
        const webThreshold = Math.round(maxThreshold - (sensitivitySetting / 100) * (maxThreshold - minThreshold));
        if (audioLevel > webThreshold) {
          triggered = true;
        }
      }
    } else {
      if (nativeRecorder?.isRecording && audioLevel !== -160) {
        const minDbThreshold = -70; const maxDbThreshold = -20;
        const nativeThreshold = Math.round(maxDbThreshold - (sensitivitySetting / 100) * (maxDbThreshold - minDbThreshold));
        if (audioLevel > nativeThreshold) {
          console.log(`Native Clap Detected! Level: ${audioLevel.toFixed(1)}dB, Threshold: ${nativeThreshold}dB.`);
          triggered = true;
        }
      }
    }
    if (triggered) {
      lastTriggerTimestampRef.current = now;
      handleCountUp();
    }
  }, [audioLevel, sensitivitySetting, isListening, handleCountUp, nativeRecorder]);

  const stopListeningWeb = async () => {
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
       stopListeningWeb();
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

  const startListeningNative = async () => {
    if (!nativeRecorder || !isMountedRef.current) {
        Alert.alert("Error", "Audio recorder not available.");
        return;
    }
     const perm = await AudioModule.getRecordingPermissionsAsync();
     if (!perm.granted) {
         Alert.alert("Permission Required", "Microphone permission is needed.");
         return;
     }
    try {
      setStatusMessage('Initializing native audio...');
      if(isMountedRef.current) setAudioLevel(-160);
      await nativeRecorder.prepareToRecordAsync({}); 
      await nativeRecorder.record();
      if (isMountedRef.current) setIsListening(true);
      nativeStatusListenerHasLoggedNoMetering = false;
      setStatusMessage('Listening (Native)...');
    } catch (error) {
      Alert.alert("Error", "Could not start native recording.");
      if (isMountedRef.current) setIsListening(false);
    }
  };

  const stopListeningNative = async () => {
    if (!isMountedRef.current) {
        return;
    }
    if (!nativeRecorder) {
        if(isListening && isMountedRef.current) setIsListening(false);
        setStatusMessage('Press "Start Listening"');
        setAudioLevel(-160);
        return;
    }

    
    if (!nativeRecorder.isRecording) {
        if (isListening && isMountedRef.current) setIsListening(false);
        setStatusMessage('Press "Start Listening"');
        setAudioLevel(-160);
        return;
    }

    try {
      setStatusMessage('Stopping native audio...');
      await nativeRecorder.stop();
      if (isMountedRef.current) {
        setIsListening(false);
        setAudioLevel(-160);
        setStatusMessage('Press "Start Listening"');
      }
    } catch (error) {
      console.error("Failed to stop native recording:", error);
      Alert.alert("Error", "Could not stop native recording cleanly.");
      if (isMountedRef.current) {
          setIsListening(false);
          setStatusMessage('Error stopping. Try again.');
          setAudioLevel(-160);
      }
    }
  };

   const toggleListening = () => {
    if (isListening) {
      if (Platform.OS === 'web') stopListeningWeb();
      else stopListeningNative();
    } else {
      if (Platform.OS === 'web') startListeningWeb();
      else startListeningNative();
    }
  };

  const currentPlatform = Platform.OS;
  let levelDisplayText = `${t('mic_level')}: ${audioLevel.toFixed(0)}`;
  if (currentPlatform === 'web') levelDisplayText += ' / 128';
  else if (currentPlatform as any !== 'web' && audioLevel > -159.9) levelDisplayText = `${t('mic_level')}: ${audioLevel.toFixed(1)} dB`;
  else if (currentPlatform as any  !== 'web') levelDisplayText = `${t('mic_level')}: --- dB`;

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        <Text style={commonStyles.tileTitle}>{t('sound_trigger')}</Text>{/* Updated Title */}
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
            {/* UI elements removed as per user's latest code structure */}
            <Slider
              value={sensitivitySetting ?? 50}
              disabled={isListening}
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              onValueChange={handleSliderChange}
              thumbTintColor={isListening ? 'rgb(80, 80, 80)' : 'rgb(124, 183, 174)'}
              minimumTrackTintColor={isListening ? 'grey' : 'rgb(74, 125, 118)'}
              maximumTrackTintColor="gray"
            />
            <Text style={styles.audioLevel}>{levelDisplayText}</Text>
            <TimerButton
              text={isListening ? t('stop_listening') : t('start_listening')}
              onPress={toggleListening}
              isSelected={isListening} 
            />
          </View>
        </View>

        <Text style={commonStyles.tileTitle}>{t('counter')}</Text>
        <View style={[commonStyles.tile, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
          <View style={styles.innerWrapperBottomTile}>
             <View style={{ backgroundColor: 'transparent', alignItems: 'center' }}>
                 <View style={styles.buttonContainerReps}>
                    {repititions.map((rep, index) => ( <TimerButton key={index} text={rep.toString()} onPress={() => handleSetRemaining(rep)} style={{ marginHorizontal: 5, width: 77 }} /> ))}
                 </View>
                 <Text style={styles.remainingLabel}>{t('target_reps')}:</Text><Text style={styles.remaining}>{remaining > 0 ? remaining : '-'}</Text>
             </View>
             <View style={styles.buttonContainer}>
                 {/* <TouchableOpacity style={styles.triangleLeft} onPress={handleCountDown} /> */}
                 <TriangleLeft size={80} onPress={handleCountDown} />
                 <Text style={styles.count}>{count}</Text>
                 {/* <TouchableOpacity style={styles.triangleRight} onPress={handleCountUp} /> */}
                 <TriangleRight size={80} onPress={handleCountUp} />
             </View>
             <TimerButton maxWidth={true} text={t('reset')} onPress={handleReset} style={{ marginTop: -20}} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    innerWrapperTopTile: { alignItems: 'center', justifyContent: 'center', width: '95%', paddingVertical: 15 },
    innerWrapperBottomTile: { flex: 1, flexDirection: 'column', justifyContent: 'space-around', width: '95%', alignItems: 'center', paddingVertical: 5, backgroundColor: 'transparent' }, 
    count: { fontSize: 110, fontWeight: 'bold', color: 'white', textAlign: 'center', minWidth: 150 },
    remainingLabel: { color: '#ccc', fontSize: 14, marginBottom: 2 },
    remaining: { color: 'white', fontSize: 24, fontWeight: 'bold', marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#fff', textAlign: 'center', width: 80, marginBottom: 15 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '95%', backgroundColor: 'transparent', marginVertical: 5, marginTop: -20 }, 
    buttonContainerReps: { display: 'flex', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', backgroundColor: 'transparent', marginBottom: 10 },
    sliderLabel: { fontSize: 14, color: '#ccc', marginBottom: 2 },
    sliderValueLabel: { fontSize: 12, color: '#aaa', marginBottom: 5 },
    statusText: { fontSize: 14, color: '#ddd', marginBottom: 15, fontStyle: 'italic', minHeight: 20 },
    slider: { width: '90%', height: 40, marginBottom: 15 },
    triangleLeft: { width: 0, height: 0, borderTopWidth: 40, borderRightWidth: 35, borderBottomWidth: 40, borderStyle: 'solid', backgroundColor: 'transparent', borderTopColor: 'transparent', borderRightColor: 'rgb(64, 85, 89)', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }, 
    triangleRight: { width: 0, height: 0, borderTopWidth: 40, borderLeftWidth: 35, borderBottomWidth: 40, borderStyle: 'solid', backgroundColor: 'transparent', borderTopColor: 'transparent', borderLeftColor: 'rgb(64, 85, 89)', borderBottomColor: 'transparent', borderRightColor: 'transparent' }, 
    audioLevel: { fontSize: 14, color: '#aaa', backgroundColor: 'transparent', marginTop: 0, marginBottom: 15, height: 20, textAlign: 'center' },
});
