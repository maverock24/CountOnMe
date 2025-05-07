import { Text, View } from '@/components/Themed'; // Assuming RNW component shims
import TimerButton from '@/components/TimerButton'; // Assuming RNW component shims
import Slider from '@react-native-community/slider'; // Assuming RNW component shims
// --- NO EXPO MODULES for Audio ---
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Alert,    // For user feedback
  Button,   // Using standard button for start/stop
} from 'react-native';
import commonStyles from '../styles'; // Assuming commonStyles exists

// Helper type for webkit browsers
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export default function TabOneScreen() {
  // --- Counter State ---
  const [count, setCount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const repititions = [5, 10, 15, 200];

  // --- Web Audio Trigger State ---
  const [sliderValue, setSliderValue] = useState<number>(50); // Sensitivity 0-100
  const [isListening, setIsListening] = useState(false); // Tracks UI state
  const [audioLevel, setAudioLevel] = useState(0); // Peak deviation (0-128)
  const [statusMessage, setStatusMessage] = useState('Press "Start Listening"');

  // --- Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const isMountedRef = useRef(true);
  const isLoopActiveRef = useRef(false); // Controls if the analyzeAudio loop should run
  // --- Add Ref for Cooldown Timestamp ---
  const lastTriggerTimestampRef = useRef<number>(0);
  // ---

  // --- Callbacks (Defined BEFORE effects that use them) ---
  const handleCountUp = useCallback(() => {
    if (!isMountedRef.current) return;
    setCount((prevCount) => prevCount + 1);
    setRemaining((prevRemaining) => (prevRemaining > 0 ? prevRemaining - 1 : 0));
  }, []);

  const handleCountDown = useCallback(() => { /* ... unchanged ... */ }, [count, remaining]);
  const handleSetRemaining = useCallback((value: number) => { /* ... unchanged ... */ }, []);
  const handleReset = useCallback(() => { /* ... unchanged ... */ }, []);
  const handleSliderChange = useCallback((value: number) => { /* ... unchanged ... */ }, []);

  // --- Effects ---

  // Mount/Unmount Effect: Load threshold & basic cleanup setup
  useEffect(() => {
    isMountedRef.current = true;
    // Load threshold from localStorage
    let initialThreshold = 50;
    try {
      const storedThreshold = localStorage.getItem('audioThreshold');
      if (storedThreshold !== null) { /* ... parsing/clamping logic ... */
          const parsed = parseFloat(storedThreshold);
          const clampedValue = Math.max(0, Math.min(100, parsed));
          if (!isNaN(clampedValue)) initialThreshold = clampedValue;
       }
    } catch (e) { console.error('Failed to load threshold', e); }
    if (isMountedRef.current) setSliderValue(initialThreshold);

    // Cleanup function on unmount
    return () => {
      isMountedRef.current = false;
      console.log('TabOneScreen unmounting...');
      isLoopActiveRef.current = false;
      if (isListening) { stopListening(); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Triggering Effect: Reacts to audioLevel changes + COOLDOWN
   useEffect(() => {
    const COOLDOWN_MS = 300; // 0.3 seconds cooldown period

    // Check if loop should be active, threshold is loaded, and level detected
    if (
      isLoopActiveRef.current &&
      sliderValue !== null &&
      audioLevel > 0 // Basic check if any sound is present
    ) {
        // Calculate dynamic threshold based on slider (0-100 sensitivity)
        const minThreshold = 1;
        const maxThreshold = 64;
        const threshold = Math.round(maxThreshold - (sliderValue / 100) * (maxThreshold - minThreshold));

        // Check if level exceeds threshold
        if (audioLevel > threshold) {
            // --- COOLDOWN LOGIC ---
            const now = performance.now(); // Use high-resolution time

            if (now - lastTriggerTimestampRef.current > COOLDOWN_MS) {
                console.log(`Web Clap Detected! Level: ${audioLevel}, Threshold: ${threshold}. Triggering count.`);
                // Update timestamp *before* calling handler to start cooldown immediately
                lastTriggerTimestampRef.current = now;
                handleCountUp(); // Call the actual counter increment
            } else {
                // Optional: Log ignored triggers during cooldown
                // console.log(`Trigger ignored (cooldown). Level: ${audioLevel}, Threshold: ${threshold}`);
            }
            // --- END COOLDOWN LOGIC ---
        }
    }
  }, [audioLevel, sliderValue, handleCountUp]); // Dependencies: run when level or threshold changes


  // --- Web Audio Functions ---

  const stopListening = async () => {
    console.log('>>> stopListening function CALLED <<<');
    isLoopActiveRef.current = false; // Signal loop to stop *first*
    lastTriggerTimestampRef.current = 0; // <<< RESET Cooldown Timestamp

    if (!isMountedRef.current) { /* ... handle unmounted cleanup ... */
        console.warn("stopListening called but component unmounted.");
        audioStreamRef.current?.getTracks().forEach((track) => track.stop());
        if(audioContextRef.current && audioContextRef.current.state !== 'closed') {
             audioContextRef.current.close().catch(e => {});
         }
        return;
    };

    // Update UI State
    setIsListening(false);
    setStatusMessage('Press "Start Listening"');
    setAudioLevel(0);

    // Stop the animation frame loop
    if (animationFrameRef.current) {
      console.log("Cancelling animation frame...");
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media tracks
    console.log("Stopping media stream tracks...");
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Disconnect nodes
    console.log("Disconnecting nodes...");
    try { mediaStreamSourceRef.current?.disconnect(); } catch(e) {}
    try { analyserNodeRef.current?.disconnect(); } catch(e) {}

    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      console.log("Closing AudioContext...");
      await audioContextRef.current.close().catch(e => console.error("Error closing context:", e));
    } else { console.log("AudioContext already closed or null.") }

    // Clear refs
    audioStreamRef.current = null;
    mediaStreamSourceRef.current = null;
    analyserNodeRef.current = null;
    audioContextRef.current = null;
    dataArrayRef.current = null;

    console.log('Web Audio stopped and cleaned up.');
  };

  const startListening = async () => {
    if (!isMountedRef.current) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { /* ... browser support error ... */ return; }
    if (isListening || audioContextRef.current) { /* ... already listening error ... */ return; }

    let stream: MediaStream | null = null;
    try {
      // --- Get User Media (Permission) ---
      setStatusMessage('Requesting permission...');
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      if (!isMountedRef.current) { stream?.getTracks().forEach(track => track.stop()); audioStreamRef.current = null; return; }
    } catch (err) { /* ... error handling ... */
        console.error('Microphone access error:', err);
         if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) { setStatusMessage('Permission denied.'); Alert.alert('Permission Denied','...'); }
         else { setStatusMessage('Mic access error.'); Alert.alert('Error',`Could not access microphone: ...`); }
         audioStreamRef.current = null; return;
    }

    // --- Setup Web Audio API ---
    setStatusMessage('Initializing audio...');
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = context;
      if (context.state === 'suspended') { await context.resume(); }
      if (!isMountedRef.current) { if(context.state !== 'closed') await context.close(); audioContextRef.current = null; return; }
      if (context.state !== 'running') throw new Error(`AudioContext failed resume. State: ${context.state}`);

      const currentStream = audioStreamRef.current;
      if (!currentStream) throw new Error("AudioStream null.");

      const source = context.createMediaStreamSource(currentStream);
      mediaStreamSourceRef.current = source;
      const analyser = context.createAnalyser();
      analyserNodeRef.current = analyser;
      analyser.fftSize = 512;
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      source.connect(analyser);
      console.log('>>> Source connected to Analyser');

      // --- Start Loop and Set State ---
      setStatusMessage('Listening...');
      lastTriggerTimestampRef.current = 0; // Reset cooldown timestamp on start
      isLoopActiveRef.current = true;    // <<< Signal loop to run
      setIsListening(true);             // Update UI state
      setAudioLevel(0);
      analyzeAudio();                   // Start the loop

    } catch (err) { /* ... error handling & cleanup ... */
       console.error('Web Audio setup error:', err); setStatusMessage(`Audio setup error...`); Alert.alert('Audio Error', `...`);
       audioStreamRef.current?.getTracks().forEach((track) => track.stop());
       if(audioContextRef.current && audioContextRef.current.state !== 'closed') await audioContextRef.current.close().catch(e => {});
       audioStreamRef.current = null; mediaStreamSourceRef.current = null; analyserNodeRef.current = null; audioContextRef.current = null; dataArrayRef.current = null;
       if(isMountedRef.current){ setIsListening(false); setStatusMessage('Setup failed. Try again.'); setAudioLevel(0); }
       isLoopActiveRef.current = false;
    }
  };

  // --- Analysis Loop ---
  const analyzeAudio = () => {
    // Initial checks (refs, state, loop flag)
    if (!analyserNodeRef.current || !dataArrayRef.current || !audioContextRef.current || audioContextRef.current.state !== 'running' || !isMountedRef.current || !isLoopActiveRef.current ) {
        console.log(`Stopping analysis loop (Initial check failed): ... LoopActive: ${isLoopActiveRef.current}`);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        if(isListening && isMountedRef.current) setIsListening(false); // Correct UI state if loop stops unexpectedly
        isLoopActiveRef.current = false;
        return;
    }

    const analyser = analyserNodeRef.current;
    const dataArray = dataArrayRef.current;

    // Get data
    try { analyser.getByteTimeDomainData(dataArray); }
    catch (error) { /* ... handle error, stop loop ... */
        console.error("Error getting time domain data:", error);
        isLoopActiveRef.current = false;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        return;
     }

    // Calculate peak deviation
    let peakDeviation = 0;
    for (let i = 0; i < dataArray.length; i++) { /* ... calculation ... */
        const deviation = Math.abs(dataArray[i] - 128); if (deviation > peakDeviation) peakDeviation = deviation;
     }

    // Update state for UI display
    if (isMountedRef.current) { setAudioLevel(peakDeviation); }

    // Triggering logic is now handled by the useEffect watching audioLevel

    // Schedule next frame
    if (isLoopActiveRef.current && isMountedRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } else {
        console.log(`Stopping analysis loop (End condition): LoopActive: ${isLoopActiveRef.current}, Mounted: ${isMountedRef.current}`);
        animationFrameRef.current = null;
    }
  };

  // --- Toggle Function for Button ---
   const toggleListening = () => {
    if (isListening) { stopListening(); } else { startListening(); }
  };

  // --- Render ---
  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        {/* --- Sound Trigger Tile (Web Audio API) --- */}
        <Text style={commonStyles.tileTitle}>Sound trigger (Web)</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
             <Text style={styles.statusText}>{statusMessage}</Text>
                <Text style={styles.sliderLabel}>Sensitivity (0-100)</Text>
                <Text style={styles.sliderValueLabel}>
                    {`Current: ${sliderValue?.toFixed(0) ?? '...'}`}
                </Text>
                <Slider
                  value={sliderValue ?? 50}
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
                <Text style={styles.audioLevel}>
                  {`Mic Level: ${audioLevel.toFixed(0)} / 128`}
                </Text>
                <Button
                  title={isListening ? 'Stop Listening' : 'Start Listening'}
                  onPress={toggleListening}
                  color={isListening ? '#FF6666' : '#00bcd4'}
                />
          </View>
        </View>

        {/* --- Counter Tile --- */}
        <Text style={commonStyles.tileTitle}>Counter</Text>
        <View
          style={[
            commonStyles.tile,
            { flex: 1, alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <View style={styles.innerWrapperBottomTile}>
             {/* Repetitions */}
             <View style={{ backgroundColor: 'transparent', alignItems: 'center' }}>
                 <View style={styles.buttonContainerReps}>
                    {repititions.map((rep, index) => ( <TimerButton key={index} text={rep.toString()} onPress={() => handleSetRemaining(rep)} style={{ marginHorizontal: 5 }} /> ))}
                 </View>
                 <Text style={styles.remainingLabel}>Target Reps:</Text><Text style={styles.remaining}>{remaining > 0 ? remaining : '-'}</Text>
             </View>
             {/* Counter */}
             <View style={styles.buttonContainer}>
                 <TouchableOpacity style={styles.triangleLeft} onPress={handleCountDown} />
                 <Text style={styles.count}>{count}</Text>
                 <TouchableOpacity style={styles.triangleRight} onPress={handleCountUp} />
             </View>
             {/* Reset */}
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
    innerWrapperBottomTile: { flex: 1, flexDirection: 'column', justifyContent: 'space-around', width: '95%', alignItems: 'center', paddingVertical: 10, backgroundColor: 'transparent' },
    count: { fontSize: 110, fontWeight: 'bold', color: 'white', textAlign: 'center', minWidth: 150 },
    remainingLabel: { color: '#ccc', fontSize: 14, marginBottom: 2 },
    remaining: { color: 'white', fontSize: 24, fontWeight: 'bold', marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#fff', textAlign: 'center', width: 80, marginBottom: 15 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '95%', backgroundColor: 'transparent', marginVertical: 20 },
    buttonContainerReps: { display: 'flex', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', backgroundColor: 'transparent', marginBottom: 10 },
    sliderLabel: { fontSize: 14, color: '#ccc', marginBottom: 2 },
    sliderValueLabel: { fontSize: 12, color: '#aaa', marginBottom: 5 },
    slider: { width: '90%', height: 40, marginBottom: 15 },
    triangleLeft: { width: 0, height: 0, borderTopWidth: 40, borderRightWidth: 35, borderBottomWidth: 40, borderStyle: 'solid', backgroundColor: 'transparent', borderTopColor: 'transparent', borderRightColor: 'rgb(34, 132, 152)', borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
    triangleRight: { width: 0, height: 0, borderTopWidth: 40, borderLeftWidth: 35, borderBottomWidth: 40, borderStyle: 'solid', backgroundColor: 'transparent', borderTopColor: 'transparent', borderLeftColor: 'rgb(34, 132, 152)', borderBottomColor: 'transparent', borderRightColor: 'transparent' },
    audioLevel: { fontSize: 14, color: '#aaa', backgroundColor: 'transparent', marginTop: 0, marginBottom: 15, height: 20, textAlign: 'center' },
     statusText: { fontSize: 14, color: '#ddd', marginBottom: 15, fontStyle: 'italic', minHeight: 20 },
});