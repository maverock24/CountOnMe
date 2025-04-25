import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import TimerButton from './TimerButton';

// --- Configuration ---
// Add your tutorial image sources here using require
const tutorialImages = [
  require('../assets/images/tutorial/tutorial_1.png'), // Replace with your actual paths
  require('../assets/images/tutorial/tutorial_2.png'),
  require('../assets/images/tutorial/tutorial_3.png'),
  // Add more images as needed
];
// --- End Configuration ---

const { width, height } = Dimensions.get('window');

interface TutorialModalProps {
  isVisible: boolean;
  onClose: () => void; // Callback function when the modal is closed
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isVisible, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNext = () => {
    if (currentImageIndex < tutorialImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      // If on the last image, the "Next" button acts as "Done"
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleClose = () => {
    setCurrentImageIndex(0); // Reset index for next time (optional)
    onClose(); // Call the parent's close handler
  };

  const isLastImage = currentImageIndex === tutorialImages.length - 1;

  return (
    <Modal
      animationType="slide"
      transparent={false} // You can make it true and style the backdrop
      visible={isVisible}
      onRequestClose={handleClose} // For Android back button
    >
      {/* SafeAreaView helps avoid notches and system UI */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContent}>
          {/* Optional: Close button at the top */}

          {/* <TimerButton style={styles.closeButtonTop} text="Skip" onPress={handleClose} /> */}

          {/* Image Display */}
          <View style={styles.imageContainer}>
            <Image
              source={tutorialImages[currentImageIndex]}
              style={styles.image}
              resizeMode="contain" // Adjust resizeMode as needed (contain, cover, stretch)
            />
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            {/* Previous Button (hidden on first image) */}
            <TimerButton
              text="Previous"
              onPress={handlePrevious}
              style={[
                styles.navButton,
                currentImageIndex === 0 && styles.navButtonHidden,
                { backgroundColor: 'transparent', width: 130 },
              ]} // Hide if first image
            />
            <Text style={styles.pageIndicator}>
              {currentImageIndex + 1} / {tutorialImages.length}
            </Text>
            {/* Next / Done Button */}
            <TimerButton
              text={isLastImage ? 'Done' : 'Next'}
              onPress={handleNext}
              style={[styles.navButton, { backgroundColor: 'transparent', width: 140 }]} // Transparent button
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#101418', // Modal background color
  },
  modalContent: {
    flex: 1,
    //alignItems: 'center',
    justifyContent: 'space-between', // Pushes content and nav buttons apart
    padding: 20,
  },
  closeButtonTop: {
    alignSelf: 'flex-end',
  },
  closeButtonTextTop: {
    fontSize: 16,
    color: '#007AFF', // iOS blue color
  },
  imageContainer: {
    flex: 1, // Takes up most of the space
    flexDirection: 'row',
    justifyContent: 'center', // Center image vertically in its container
    alignItems: 'center',
    width: '100%',
    // backgroundColor: 'lightblue', // For debugging layout
  },
  image: {
    width: width * 0.9, // Example: 90% of screen width
    height: '100%', // Example: 60% of screen height
    // Ensure resizeMode="contain" handles aspect ratio
  },
  pageIndicator: {
    fontSize: 14,
    color: '#888',
    marginVertical: 10,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 5,
  },
  navButton: {
    backgroundColor: '#007AFF', // iOS blue color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 100, // Ensure buttons have some minimum width
    alignItems: 'center',
  },
  navButtonHidden: {
    backgroundColor: 'transparent', // Make button invisible but keep space
    // You could also use opacity: 0 or conditionally render it
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TutorialModal;
