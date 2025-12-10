import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import commonStyles from '@/app/styles';
import { WorkoutItem } from '@/components/data/types';
import { roundToDecimals } from '@/utils/numberUtils';

import { useTranslation } from 'react-i18next';
import TimerButton from './TimerButton';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';

// Neon flicker animation - creates a broken/flickering neon tube effect
const useNeonFlicker = (isActive: boolean) => {
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      glowAnim.setValue(1);
      return;
    }

    // Create irregular flicker pattern like a broken neon tube
    const createFlickerSequence = () => {
      const flickerPatterns = [
        // Quick double flicker
        { toValue: 0.3, duration: 50 },
        { toValue: 1, duration: 30 },
        { toValue: 0.4, duration: 40 },
        { toValue: 1, duration: 60 },
        // Stable period
        { toValue: 0.95, duration: 800 },
        { toValue: 1, duration: 200 },
        // Single flicker
        { toValue: 0.2, duration: 30 },
        { toValue: 0.8, duration: 50 },
        { toValue: 1, duration: 100 },
        // Longer stable
        { toValue: 1, duration: 1200 },
        // Triple quick flicker
        { toValue: 0.35, duration: 25 },
        { toValue: 0.9, duration: 35 },
        { toValue: 0.25, duration: 30 },
        { toValue: 0.85, duration: 40 },
        { toValue: 0.3, duration: 25 },
        { toValue: 1, duration: 80 },
        // Medium stable
        { toValue: 0.92, duration: 600 },
        { toValue: 1, duration: 150 },
        // Dim and recover
        { toValue: 0.5, duration: 100 },
        { toValue: 0.7, duration: 200 },
        { toValue: 1, duration: 150 },
        // Long stable period
        { toValue: 1, duration: 1500 },
      ];

      const animations = flickerPatterns.map(({ toValue, duration }) =>
        Animated.timing(glowAnim, {
          toValue,
          duration,
          useNativeDriver: false,
        })
      );

      return Animated.sequence(animations);
    };

    // Loop the flicker animation
    const loopAnimation = Animated.loop(createFlickerSequence());
    loopAnimation.start();

    return () => {
      loopAnimation.stop();
      glowAnim.setValue(1);
    };
  }, [isActive, glowAnim]);

  // Interpolate for glow intensity and shadow radius
  const glowIntensity = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [2, 8, 15],
  });

  return { glowAnim, glowIntensity };
};

// YouTube embedded player component
const YouTubePlayer = ({ searchQuery }: { searchQuery: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  // Create YouTube search embed URL
  // Using YouTube's embed search feature with videoseries for search results
  const encodedQuery = encodeURIComponent(`${searchQuery} exercise how to`);

  // YouTube search results page URL for WebView
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

  // Get screen dimensions for responsive sizing
  const screenWidth = Dimensions.get('window').width;
  const videoWidth = Math.min(screenWidth - 76, 640); // Max 640px, with padding
  const videoHeight = (videoWidth * 9) / 16; // 16:9 aspect ratio

  return (
    <View style={[localStyles.youtubeContainer, { height: videoHeight + 40 }]}>
      <Text style={[localStyles.youtubeLabel, { color: theme.colors.primary }]}>
        Video Tutorial
      </Text>
      <View style={[localStyles.videoWrapper, { width: videoWidth, height: videoHeight }]}>
        {isLoading && (
          <View style={localStyles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[localStyles.loadingText, { color: theme.colors.textMuted }]}>
              Loading video...
            </Text>
          </View>
        )}
        <WebView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          source={{ uri: youtubeSearchUrl }}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          startInLoadingState={false}
          // Allow YouTube to work properly
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          userAgent={Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
            : undefined
          }
        />
      </View>
    </View>
  );
};

const ListTile = ({
  isSelected,
  title,
  value,
  description,
  workoutItem,
  onPressTile,
  onPressBtn,
  currentIndex,
  onLongPress,
  style,
}: {
  isSelected?: boolean;
  title: string;
  value: string | null;
  description?: string;
  workoutItem?: WorkoutItem;
  onPressTile?: () => void;
  onPressBtn?: () => void;
  currentIndex?: number;
  onLongPress?: () => void;
  style?: any;
}) => {
  const [workoutStage, setWorkoutStage] = useState(currentIndex || 0);
  const [descVisible, setDescVisible] = useState(false);
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Neon flicker effect for selected state
  const { glowAnim, glowIntensity } = useNeonFlicker(!!isSelected);

  // Handle both new WorkoutItem structure and legacy format
  let workoutData: string;
  let intensityData: string;
  let caloriesData: string;
  let levelDisplay: string;

  if (workoutItem) {
    // New WorkoutItem structure
    workoutData = workoutItem.workout;

    // Parse level data (format: "FitnessLevel-IntensityLevel")
    if (workoutItem.level) {
      const levelParts = workoutItem.level.split('-');
      const fitnessLevel = levelParts[0];
      const intensity = levelParts[1]?.toLowerCase();
      intensityData = intensity || '';

      // Create a user-friendly display format
      const fitnessLevelMap: { [key: string]: string } = {
        'Beginner': t('low'),
        'Intermediate': t('medium'),
        'Expert': t('high')
      };

      const intensityMap: { [key: string]: string } = {
        'light': t('low'),
        'moderate': t('medium'),
        'hard': t('high')
      };

      const displayFitness = fitnessLevelMap[fitnessLevel] || fitnessLevel;
      const displayIntensity = intensityMap[intensity] || intensity;

      levelDisplay = displayIntensity || displayFitness;
    } else {
      intensityData = '';
      levelDisplay = '';
    }

    // Use calories from WorkoutItem (round to 1 decimal for display)
    if (typeof workoutItem.calories === 'number') {
      caloriesData = roundToDecimals(workoutItem.calories, 1).toString();
    } else {
      caloriesData = '';
    }
  } else {
    // Legacy format: pipe-separated data
    const exerciseData = value?.split('|') || [];
    workoutData = exerciseData[0] || '';
    intensityData = exerciseData[1] || '';
    // Try to parse legacy calories and round for display
    const legacyCalories = exerciseData[2];
    if (legacyCalories !== undefined && legacyCalories !== null && legacyCalories !== '') {
      const parsed = parseFloat(legacyCalories as any);
      caloriesData = Number.isFinite(parsed) ? roundToDecimals(parsed, 1).toString() : legacyCalories;
    } else {
      caloriesData = '';
    }
    levelDisplay = intensityData; // Show only intensity for legacy items
  }

  useEffect(() => {
    if (currentIndex !== undefined) {
      setWorkoutStage(currentIndex);
    }
  }, [currentIndex]);


  let filledStars = 0;
  switch (intensityData) {
    case 'light':
    case 'low':
      filledStars = 1;
      break;
    case 'moderate':
    case 'medium':
      filledStars = 2;
      break;
    case 'hard':
    case 'high':
      filledStars = 3;
      break;
    default:
      filledStars = 0;
  }

  const totalStars = 3;

  // Create animated box shadow style for web
  const animatedBoxShadow = glowAnim.interpolate({
    inputRange: [0, 0.3, 0.5, 1],
    outputRange: [
      `0px 0px 4px ${theme.colors.glow}50`,
      `0px 0px 8px ${theme.colors.glow}70`,
      `0px 0px 12px ${theme.colors.glow}A0`,
      `0px 0px 18px ${theme.colors.glow}`,
    ],
  });

  return (
    <>
    <Animated.View
      style={[
        commonStyles.listTile,
        {
          flexDirection: 'row',
          flex: 1,
          borderWidth: 1,
          backgroundColor: theme.colors.listTileBackground,
          borderColor: theme.colors.tileBorder,
        },
        isSelected && {
          borderColor: theme.colors.borderActive,
          borderWidth: 2,
          shadowColor: theme.colors.glow,
          shadowOpacity: glowAnim,
          shadowRadius: glowIntensity,
          elevation: 8,
        },
        // Web-specific animated glow
        isSelected && {
          boxShadow: animatedBoxShadow,
        },
        style
      ]}
    >
      <Pressable
        style={{ flex: 1, flexDirection: 'row' }}
        onPress={onPressTile}
        onLongPress={onLongPress}
      >
        <>
          <View style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            {/* Info row: mock values for calories and training level, now below the title */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomColor: theme.colors.textMuted,
                borderBottomWidth: 1,
                width: '100%',
                paddingBottom: 5,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText style={commonStyles.listItemTitle}>{title}</ThemedText>
                {description ? (
                  <TouchableOpacity
                    onPress={() => setDescVisible(true)}
                    style={localStyles.helpButton}
                    accessibilityLabel={`Show description for ${title}`}
                  >
                    <Text style={localStyles.helpButtonText}>?</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {(workoutItem?.calories !== undefined && workoutItem?.calories !== null) || caloriesData ? (
                  <ThemedText style={{ fontSize: 14, color: theme.colors.textMuted, marginRight: 10 }}>
                    {t('calories_colon')} {caloriesData}
                  </ThemedText>
                ) : null}
                {workoutItem?.level && levelDisplay && (
                  <ThemedText style={{ fontSize: 14, color: theme.colors.textMuted, marginRight: 5 }}>
                    {levelDisplay}
                  </ThemedText>
                )}
                {intensityData && (
                  [...Array(totalStars)].map((_, i) => (
                    <FontAwesome
                      key={i}
                      name={i < filledStars ? 'star' : 'star-o'}
                      size={14}
                      color={i < filledStars ? theme.colors.textPrimary : theme.colors.textMuted}
                      style={{ marginLeft: 1, marginRight: 1 }}
                    />
                  ))
                )}
              </View>
            </View>

            <View
              style={{ flexDirection: 'row', width: '100%', paddingHorizontal: 15, marginTop: 10 }}
            >
              {workoutData &&
                workoutData.split(';').map((time, index) => {
                  const seconds = parseFloat(time);
                  const minutes = Number.isFinite(seconds) ? seconds / 60 : NaN;
                  const display = Number.isFinite(minutes) ? roundToDecimals(minutes, 1).toString() : time;
                  return (
                    <Text
                      key={index}
                      style={
                        isSelected && index === workoutStage
                          ? commonStyles.listItemValueText
                          : commonStyles.listItemValue
                      }
                    >
                      {display}
                    </Text>
                  );
                })}
            </View>
          </View>
        </>
        {onPressBtn && <TimerButton text="Delete" onPress={onPressBtn} small />}
      </Pressable>
    </Animated.View>
    {description ? (
      <Modal
        visible={descVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDescVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={[localStyles.modalBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <Text style={[localStyles.modalTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
              <Text style={[localStyles.modalText, { color: theme.colors.textMuted }]}>{description}</Text>

              {/* YouTube Video Player */}
              <YouTubePlayer searchQuery={title} />
            </ScrollView>
            <TouchableOpacity
              style={[localStyles.modalClose, { backgroundColor: theme.colors.buttonBackground }]}
              onPress={() => setDescVisible(false)}
            >
              <Text style={[localStyles.modalCloseText, { color: theme.colors.primary }]}>{t('close') || 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ) : null}
    </>
  );
};
export default ListTile;

const localStyles = StyleSheet.create({
  helpButton: {
    marginLeft: 8,
    backgroundColor: '#2a2e33',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b0e0e6',
  },
  helpButtonText: {
    color: '#b0e0e6',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    padding: 18,
    borderRadius: 10,
    width: '100%',
    maxWidth: 720,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  modalCloseText: {
    fontWeight: '600',
  },
  // YouTube player styles
  youtubeContainer: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  youtubeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  videoWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
  },
});
