import { Audio } from 'expo-av';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';

interface SoundPreviewProps {
  selectedSound: any; // This is the actual sound module from require()
}

const SoundPreview: React.FC<SoundPreviewProps> = ({ selectedSound }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const prevSoundRef = useRef<any>(null);

  // Stop sound if the selectedSound changes
  useEffect(() => {
    if (prevSoundRef.current !== selectedSound && sound) {
      const stopPrevious = async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
          setIsPlaying(false);
        } catch (e) {
          console.error('Error stopping previous sound:', e);
        }
      };
      stopPrevious();
    }
    prevSoundRef.current = selectedSound;
  }, [selectedSound, sound]);

  const playSound = async () => {
    try {
      // Stop any playing sound first
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        return;
      }

      // Safety check
      if (!selectedSound) {
        console.warn('No sound selected');
        return;
      }

      // Play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(selectedSound);
      setSound(newSound);

      // Monitor playback status
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound
            .unloadAsync()
            .catch((e) => console.error('Error unloading sound after finish:', e));
          setSound(null);
        }
      });

      await newSound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play sound:', error);
      setIsPlaying(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch((e) => console.error('Error unloading sound during cleanup:', e));
      }
    };
  }, [sound]);

  return (
    <TouchableOpacity onPress={playSound}>
      <FontAwesome name={isPlaying ? 'stop-circle' : 'play-circle'} size={32} color="#00bcd4" />
    </TouchableOpacity>
  );
};

export default SoundPreview;
