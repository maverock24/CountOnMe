import { Text, View } from '@/components/Themed';
import TimerButton from '@/components/TimerButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform, // Import Platform
  Alert, // Import Alert for user feedback
} from 'react-native';
import commonStyles from '../styles';

// Helper type for webkit browsers
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export default function TabOneScreen() {
  const [count, setCount] = useState(0);
  const [sliderValue, setSliderValue] = useState<number | null>(null); // Start as null until loaded
  const [remaining, setRemaining] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // Represents dB on native, 0-255 on web
  const [recording, setRecording] = useState<Audio.Recording | null>(null); // Native recording object
  const [buttonText, setButtonText] = useState('Mic on');
  const [micOn, setMicOn] = useState(false);

  const repititions = [5, 10, 15, 200];

  // --- State and Refs for Web Audio API ---
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [mediaStreamSource, setMediaStreamSource] = useState<MediaStreamAudioSourceNode | null>(
    null
  );
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null); // For getByteFrequencyData
  const isMountedRef = useRef(true); // To prevent state updates after unmount

  // --- On Mount / Unmount Effect ---
  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      // --- Load Threshold ---
      let initialThreshold = -50; // Default threshold
      try {
        const storedThreshold = await AsyncStorage.getItem('audioThreshold');
        if (storedThreshold !== null) {
          const parsed = parseFloat(storedThreshold);
          // Ensure the loaded value is within the slider's range
          const clampedValue = Math.max(-100, Math.min(0, parsed));
          if (!isNaN(clampedValue)) {
            initialThreshold = clampedValue;
            console.log('Loaded threshold:', clampedValue);
          } else {
            console.log('Failed to parse stored threshold, using default', initialThreshold);
          }
        } else {
          console.log('No threshold stored, using default', initialThreshold);
        }
      } catch (e) {
        console.error('Failed to load threshold from AsyncStorage', e);
      }
      // Set initial slider value only if component is still mounted
      if (isMountedRef.current) {
        setSliderValue(initialThreshold);
      }

      // --- Request Native Permissions on Mount (Optional) ---
      // Can be done here or deferred until Mic On is pressed
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn('Microphone permission not granted on native platform.');
            // Optionally disable the mic button or show a message
          }
        } catch (e) {
          console.error('Error requesting native audio permissions', e);
        }
      }
    })();

    // --- Cleanup on Unmount ---
    return () => {
      isMountedRef.current = false; // Mark as unmounted
      console.log('TabOneScreen unmounting...');
      // Ensure cleanup runs if the component unmounts while listening
      if (isListening) {
        stopListeningCleanup(); // Use the async cleanup function
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: Run only on mount and unmount

  // --- Counter Logic ---
  const handleCountUp = useCallback(() => {
    // Check mount status before setting state
    if (!isMountedRef.current) return;
    setCount((prevCount) => prevCount + 1);
    setRemaining((prevRemaining) => (prevRemaining > 0 ? prevRemaining - 1 : 0));
    // TODO: Implement cooldown here if needed
  }, []);

  const handleCountDown = () => {
    if (count !== 0) {
      setCount((prevCount) => prevCount - 1);
      // Only add back to remaining if it was set initially
      if (remaining > 0 && count <= remaining) {
        // Be careful logic here, maybe check initial remaining target
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

  // --- Audio Cleanup Function ---
  const stopListeningCleanup = async () => {
    console.log('Running cleanup...');
    if (!isMountedRef.current && Platform.OS !== 'web') {
      console.warn(
        'Cleanup called after unmount (native), potential issues if Audio module is unavailable.'
      );
      // On native, stopping audio after context loss might be problematic.
      // Expo handles some of this, but be aware.
    }

    // Native cleanup
    if (recording) {
      console.log('Stopping native recording...');
      try {
        await recording.stopAndUnloadAsync();
        if (isMountedRef.current) setRecording(null);
      } catch (error) {
        console.error('Error stopping/unloading native recording:', error);
      }
      // Potentially disable audio system - do this carefully
      // if other components might use audio
      // try {
      //     await Audio.setIsEnabledAsync(false);
      // } catch (e) { console.error("Error disabling audio system", e)}
    }

    // Web cleanup
    if (animationFrameRef.current) {
      console.log('Stopping web analysis loop...');
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStream) {
      console.log('Stopping web media stream tracks...');
      audioStream.getTracks().forEach((track) => track.stop());
      if (isMountedRef.current) setAudioStream(null);
    }
    if (mediaStreamSource) {
      console.log('Disconnecting web media stream source...');
      try {
        // Node disconnection can sometimes throw errors if context is already closed
        mediaStreamSource.disconnect();
      } catch (e) {
        console.error('Error disconnecting media stream source', e);
      }
      if (isMountedRef.current) setMediaStreamSource(null);
    }
    if (analyserNode) {
      if (isMountedRef.current) setAnalyserNode(null); // Clear analyser state ref
    }
    if (audioContext && audioContext.state !== 'closed') {
      console.log('Closing web audio context...');
      try {
        await audioContext.close();
        if (isMountedRef.current) setAudioContext(null);
      } catch (error) {
        console.error('Error closing web audio context:', error);
      }
    }
    dataArrayRef.current = null; // Clear buffer ref

    // Reset level only if mounted
    if (isMountedRef.current) {
      setAudioLevel(0);
    }
    console.log('Cleanup finished.');
  };

  // --- Native Recording Setup ---
  const setupNativeRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        // Add Android config if needed
        // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        // staysActiveInBackground: true, // If needed
        // playThroughEarpieceAndroid: false
      });

      console.log('Starting new native recording instance...');
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY, // Use a preset
        isMeteringEnabled: true, // Enable metering
        android: {
          // Example override if needed
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          numberOfChannels: 1,
        },
        ios: {
          // Example override if needed
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          numberOfChannels: 1,
        },
        // Web config is ignored here as we use Web Audio API directly
      });

      // Set interval for metering updates (adjust as needed for performance)
      newRecording.setProgressUpdateInterval(100); // e.g., 100ms

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) return; // Exit if not recording

        // Ensure state updates only happen if still listening and mounted
        if (isListening && isMountedRef.current && status.metering !== undefined) {
          setAudioLevel(status.metering); // Update level with dB value
          // console.log('Native Audio level (dB):', status.metering); // Log frequently if needed
        }
      });

      await newRecording.startAsync();
      console.log('Native recording started.');
      if (isMountedRef.current) {
        setRecording(newRecording); // Store recording object in state
      } else {
        console.warn('Native recording started but component unmounted, stopping.');
        await newRecording.stopAndUnloadAsync(); // Stop immediately if unmounted
      }
    } catch (error) {
      console.error('Failed to setup/start native recording:', error);
      Alert.alert('Error', 'Could not start microphone. Please check permissions and try again.');
      // Revert state if setup fails and component is mounted
      if (isMountedRef.current) {
        setIsListening(false);
        setMicOn(false);
        setButtonText('Mic on');
      }
      await stopListeningCleanup(); // Attempt cleanup
    }
  };

  // --- Web Audio API Setup ---
  const setupWebAudio = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Alert.alert('Error', 'Your browser does not support the necessary audio features.');
      if (isMountedRef.current) {
        setIsListening(false);
        setMicOn(false);
        setButtonText('Mic on');
      }
      return;
    }

    try {
      console.log('Requesting web media device access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isMountedRef.current) {
        // Check if unmounted between await and now
        console.warn('Component unmounted after getUserMedia success, stopping tracks.');
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      console.log('Creating web audio context...');
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();

      // Configure AnalyserNode
      analyser.fftSize = 256; // Lower value for less processing, adjust as needed
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength); // Store array buffer reference

      source.connect(analyser);
      // Do NOT connect analyser to context.destination unless you want echo/feedback

      // Store references if component is still mounted
      setAudioStream(stream);
      setAudioContext(context);
      setMediaStreamSource(source);
      setAnalyserNode(analyser);

      console.log('Web Audio setup complete. Starting analysis loop...');
      analyzeAudio(); // Start the analysis loop
    } catch (err) {
      console.error('Error accessing microphone or setting up Web Audio:', err);
      let message = 'Could not access microphone.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Microphone permission denied. Please enable it in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'No microphone found. Please ensure one is connected and enabled.';
        }
      }
      Alert.alert('Error', message);
      // Revert state if setup fails and component is mounted
      if (isMountedRef.current) {
        setIsListening(false);
        setMicOn(false);
        setButtonText('Mic on');
      }
      await stopListeningCleanup(); // Attempt cleanup
    }
  };

  // --- Web Audio Analysis Loop ---
  const analyzeAudio = () => {
    // Stop loop if analyser is gone, or component unmounted
    if (!analyserNode || !dataArrayRef.current || !isMountedRef.current || !isListening) {
      console.log('Stopping analysis loop condition met.');
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      return;
    }

    analyserNode.getByteFrequencyData(dataArrayRef.current);

    // --- Calculate Volume (Example: Max value) ---
    let maxVal = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      if (dataArrayRef.current[i] > maxVal) {
        maxVal = dataArrayRef.current[i];
      }
    }

    // --- Compare with Threshold ---
    // !!! CRITICAL: Tune this mapping !!!
    // Map sliderValue (-100 to 0) to a web threshold (0 to 255).
    // This example maps -100dB -> 50, 0dB -> 150. This is likely WRONG. Needs tuning!
    // A higher slider value (closer to 0) should mean LESS sensitive = HIGHER webThreshold.
    // A lower slider value (closer to -100) should mean MORE sensitive = LOWER webThreshold.
    const sensitivityFactor = 1.5; // Adjust this multiplier!
    const baseThreshold = 50; // Adjust minimum possible threshold
    const webThreshold = baseThreshold + ((sliderValue || 0) + 100) * sensitivityFactor; // Map -100 -> base, 0 -> base + 100*factor

    // console.log(`Web Audio Level (0-255): ${maxVal}, Threshold: ${webThreshold.toFixed(0)} (Slider: ${sliderValue})`); // Debug logging

    if (isMountedRef.current) {
      // Check mount status before state update
      setAudioLevel(maxVal); // Update level state (for potential display)
    }

    if (maxVal > webThreshold) {
      console.log(`Web Clap Detected! Level: ${maxVal}, Threshold: ${webThreshold.toFixed(0)}`);
      handleCountUp(); // Increment counter
      // !!! Add a cooldown here !!! E.g., set a flag, use setTimeout to reset it.
    }

    // Continue the loop only if still listening
    if (isListening) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } else {
      animationFrameRef.current = null; // Ensure loop reference is cleared if isListening turned false
    }
  };

  // --- Main Toggle Function ---
  const handleListen = async () => {
    if (isListening) {
      // === STOP LISTENING ===
      console.log('Stop button pressed.');
      // Update state immediately for responsiveness
      if (isMountedRef.current) {
        setIsListening(false);
        setMicOn(false);
        setButtonText('Mic on');
      }
      await stopListeningCleanup(); // Perform cleanup
    } else {
      // === START LISTENING ===
      console.log('Start button pressed.');
      if (isMountedRef.current) {
        // Update state immediately
        setMicOn(true);
        setIsListening(true);
        setButtonText('Mic off');
      } else {
        console.warn('Start listening called but component unmounted.');
        return; // Don't proceed if unmounted
      }

      if (Platform.OS === 'web') {
        // --- Start Web Audio ---
        console.log('Starting web audio...');
        await setupWebAudio();
      } else {
        // --- Start Native Audio ---
        console.log('Starting native audio...');
        try {
          // Ensure native permissions first
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Microphone access is needed to detect sound.');
            if (isMountedRef.current) {
              // Revert state if no permission
              setIsListening(false);
              setMicOn(false);
              setButtonText('Mic on');
            }
            return;
          }
          // Ensure Expo Audio system is enabled (might be needed if previously disabled)
          // await Audio.setIsEnabledAsync(true); // Usually not required unless explicitly disabled elsewhere
          await setupNativeRecording();
        } catch (error) {
          console.error('Error during native audio start sequence:', error);
          // State reversion handled within setupNativeRecording's catch block
        }
      }
    }
  };

  // --- Effect for Native Audio Trigger ---
  useEffect(() => {
    // Only run for NATIVE platform when listening and ready
    if (
      Platform.OS !== 'web' &&
      isListening &&
      recording && // Ensure native recording object exists
      sliderValue !== null // Ensure threshold is loaded
    ) {
      // audioLevel state is updated by the native onRecordingStatusUpdate callback
      if (audioLevel > sliderValue) {
        console.log(
          `Native Clap Detected! Level: ${audioLevel.toFixed(1)}, Threshold: ${sliderValue}`
        );
        handleCountUp();
        // !!! Add a cooldown here for native !!!
        // Avoid rapidly resetting audioLevel, use timestamp or boolean flag cooldown
        // setAudioLevel(-160); // Example: Force below threshold temporarily (crude cooldown)
      }
    }
    // Dependencies: Trigger ONLY when these change on NATIVE
  }, [audioLevel, isListening, recording, sliderValue, handleCountUp]); // Added handleCountUp to dependencies

  // --- Slider Change Handler ---
  const handleSliderChange = useCallback((value: number) => {
    if (isMountedRef.current) {
      setSliderValue(value); // Update state
    }
    // Save persistently
    AsyncStorage.setItem('audioThreshold', value.toString()).catch((err) =>
      console.error('Error saving threshold:', err)
    );
  }, []);

  // --- Render ---
  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.outerContainer}>
        {/* --- Sound Trigger Tile --- */}
        <Text style={commonStyles.tileTitle}>Sound trigger</Text>
        <View style={commonStyles.tile}>
          <View style={styles.innerWrapperTopTile}>
            <Text style={styles.sliderLabel}>Sensitivity Threshold</Text>
            <Text style={styles.sliderValueLabel}>
              {/* Show dB for native, maybe abstract term for web? */}
              {Platform.OS === 'web'
                ? `Level: ${sliderValue?.toFixed(0) ?? '...'}`
                : `${sliderValue?.toFixed(0) ?? '...'} dB`}
            </Text>
            <Slider
              value={sliderValue ?? -50} // Use loaded value or default
              disabled={sliderValue === null || isListening} // Disable while loading or listening
              style={styles.slider}
              minimumValue={-100}
              maximumValue={0}
              step={1}
              onValueChange={handleSliderChange} // More responsive UI update
              // onSlidingComplete={handleSliderChange} // Use this if only want to save on release
              thumbTintColor={micOn ? '#FF0000' : '#00bcd4'} // Change thumb color when active
              minimumTrackTintColor={micOn ? '#FF6666' : '#00bcd4'}
              maximumTrackTintColor="gray"
            />
            <Text style={styles.audioLevel}>
              {/* Display level appropriately based on platform */}
              {Platform.OS === 'web'
                ? `Current Web Level: ${audioLevel.toFixed(0)} / 255`
                : `Current Native Level: ${audioLevel.toFixed(1)} dB`}
            </Text>
            <TimerButton
              text={buttonText}
              onPress={handleListen}
              disabled={sliderValue === null} // Disable button until threshold loaded
              style={
                micOn
                  ? {
                      borderColor: '#FF0000', // Red border when mic is on
                      borderWidth: 2,
                      shadowColor: '#FF0000',
                      shadowOpacity: 0.8,
                      shadowRadius: 8,
                      // boxShadow: '0px 0px 8px 2px #FF0000', // Web specific shadow
                      elevation: 6, // Android
                    }
                  : {}
              }
            />
          </View>
        </View>

        {/* --- Counter Tile --- */}
        <Text style={commonStyles.tileTitle}>Counter</Text>
        <View
          style={[commonStyles.tile, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
        >
          <View style={styles.innerWrapperBottomTile}>
            {/* Repetitions Buttons */}
            <View style={{ backgroundColor: 'transparent', alignItems: 'center' }}>
              <View style={styles.buttonContainerReps}>
                {repititions.map((rep, index) => (
                  <TimerButton
                    key={index}
                    text={rep.toString()}
                    onPress={() => handleSetRemaining(rep)}
                    style={{ marginHorizontal: 5 }} // Add spacing
                  />
                ))}
              </View>
              <Text style={styles.remainingLabel}>Target Reps:</Text>
              <Text style={styles.remaining}>{remaining > 0 ? remaining : '-'}</Text>
            </View>

            {/* Counter Display and Controls */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.triangleLeft} onPress={handleCountDown}>
                {/* Can add an Icon inside if needed */}
              </TouchableOpacity>
              <Text style={styles.count}>{count}</Text>
              <TouchableOpacity style={styles.triangleRight} onPress={handleCountUp}>
                {/* Can add an Icon inside if needed */}
              </TouchableOpacity>
            </View>

            {/* Reset Button */}
            <TimerButton maxWidth={true} text="Reset" onPress={handleReset} />
          </View>
        </View>
      </View>
    </View>
  );
}

// --- Styles ---
const { height } = Dimensions.get('window');
// Use slightly smaller padding values for potentially smaller web viewports if needed
const paddingTopTile = height * 0.01;
const paddingBottomTile = height > 700 ? height * 0.03 : height * 0.01; // Adjusted for potentially smaller screens

const styles = StyleSheet.create({
  innerWrapperTopTile: {
    paddingBottom: paddingTopTile,
    paddingTop: paddingTopTile,
    width: '95%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center', // Center items vertically too
  },
  innerWrapperBottomTile: {
    flex: 1, // Take available space
    flexDirection: 'column',
    justifyContent: 'space-around', // Distribute space
    width: '95%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingVertical: 10, // Add some vertical padding
  },
  // Removed duplicate title style
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: '#eee', // Give it a subtle color
  },
  count: {
    // marginTop: -30, // Removed negative margin, rely on flexbox alignment
    fontSize: 110, // Slightly smaller to fit better
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    minWidth: 150, // Ensure space for 3 digits
  },
  remainingLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  remaining: {
    color: 'white',
    fontSize: 24, // Larger remaining count
    fontWeight: 'bold',
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    textAlign: 'center',
    width: 80, // Wider for target reps
    marginBottom: 15, // Space below remaining count
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute space evenly
    alignItems: 'center', // Align items vertically
    width: '95%', // Use slightly more width
    backgroundColor: 'transparent',
    marginVertical: 20, // Add vertical margin
  },
  buttonContainerReps: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap', // Allow buttons to wrap on smaller screens
    backgroundColor: 'transparent',
    marginBottom: 10, // Reduced margin
  },
  // Removed unused button styles
  sliderLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  sliderValueLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 5,
  },
  slider: {
    width: '90%',
    height: 40, // Standard height
    marginBottom: 10, // Add margin below slider
  },
  // Removed unused sliderText style
  triangleLeft: {
    // marginTop: -10, // Removed negative margin
    width: 0,
    height: 0,
    borderTopWidth: 40, // Smaller triangle
    borderRightWidth: 35, // Smaller triangle
    borderBottomWidth: 40, // Smaller triangle
    borderStyle: 'solid',
    backgroundColor: 'transparent', // Needed for transparent borders
    borderTopColor: 'transparent',
    borderRightColor: 'rgb(34, 132, 152)', // Use the theme color or a specific one
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent', // Important for triangle shape
  },
  triangleRight: {
    // marginTop: -10, // Removed negative margin
    width: 0,
    height: 0,
    borderTopWidth: 40, // Smaller triangle
    borderLeftWidth: 35, // Smaller triangle
    borderBottomWidth: 40, // Smaller triangle
    borderStyle: 'solid',
    backgroundColor: 'transparent', // Needed for transparent borders
    borderTopColor: 'transparent',
    borderLeftColor: 'rgb(34, 132, 152)', // Use the theme color or a specific one
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent', // Important for triangle shape
  },
  audioLevel: {
    fontSize: 12, // Smaller font size
    color: '#aaa', // Dimmer color
    backgroundColor: 'transparent',
    marginTop: 5, // Add space above mic button
    height: 20, // Give it fixed height to prevent layout shifts
    textAlign: 'center',
  },
});
