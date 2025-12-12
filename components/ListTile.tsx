import { FontAwesome } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import commonStyles from '@/app/styles';
import { WorkoutItem } from '@/components/data/types';
import { roundToDecimals } from '@/utils/numberUtils';

import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import TimerButton from './TimerButton';

// Slow border glow pulsing effect - opacity pulses between 0.3 and 1
const useBorderGlowPulse = (isActive: boolean) => {
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!isActive) {
      glowAnim.setValue(0.3);
      return;
    }

    // Slow pulsing glow animation (2.5s per direction = 5s full cycle)
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, [isActive, glowAnim]);

  return glowAnim;
};

// YouTube video tutorial section - opens YouTube search in browser/app
const YouTubePlayer = ({ searchQuery }: { searchQuery: string }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Encode the search query for YouTube
  const encodedQuery = encodeURIComponent(`${searchQuery} exercise how to`);
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

  const openYouTube = () => {
    Linking.openURL(youtubeSearchUrl);
  };

  return (
    <View style={localStyles.youtubeContainer}>
      <ThemedText style={[localStyles.youtubeLabel, { color: theme.colors.primary }]}>
        {t('video_tutorial') || 'Video Tutorial'}
      </ThemedText>
      <TouchableOpacity
        style={[localStyles.youtubeButton, {
          backgroundColor: '#FF0000',
          borderColor: theme.colors.border,
        }]}
        onPress={openYouTube}
        activeOpacity={0.8}
      >
        <FontAwesome name="youtube-play" size={24} color="#fff" style={{ marginRight: 10 }} />
        <ThemedText style={localStyles.youtubeButtonText}>
          {t('watch_on_youtube') || 'Watch on YouTube'}
        </ThemedText>
      </TouchableOpacity>
      <ThemedText style={[localStyles.youtubeHint, { color: theme.colors.textMuted }]}>
        {t('youtube_hint') || `Search for "${searchQuery}" exercise tutorials`}
      </ThemedText>
    </View>
  );
};

const ListTile = ({
  isSelected,
  isCompleted,
  isLocked,
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
  isCompleted?: boolean;
  isLocked?: boolean;
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

  // Slow border glow pulsing effect for selected state
  const glowAnim = useBorderGlowPulse(!!isSelected);

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

  return (
    <>
    <View style={[commonStyles.listTile, { position: 'relative' }, style]}>
      {/* Animated glow border overlay */}
      {isSelected && (
        <Animated.View
          pointerEvents="none"
          style={[
            localStyles.glowOverlay,
            {
              borderColor: theme.colors.glow,
              opacity: glowAnim,
              ...Platform.select({
                web: {
                  boxShadow: `0px 0px 12px 2px ${theme.colors.glow}`,
                },
                default: {
                  shadowColor: theme.colors.glow,
                  shadowOpacity: 1,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                },
              }),
            },
          ]}
        />
      )}
      <View style={[localStyles.tileContent, {
        // Glass effect - semi-transparent matching progression tiles
        backgroundColor: isLocked
          ? `${theme.colors.surface}30`
          : isSelected
            ? `${theme.colors.selectedHighlight}DD`
            : `${theme.colors.surface}60`,
        borderColor: isLocked
          ? `${theme.colors.tileBorder}40`
          : isCompleted
            ? `${theme.colors.glow}80`
            : isSelected
              ? `${theme.colors.primary}90`
              : `${theme.colors.tileBorder}70`,
        borderWidth: isSelected ? 2 : 1,
        opacity: isLocked ? 0.6 : 1,
      }]}>
      <Pressable
        style={{ flex: 1, flexDirection: 'row' }}
        onPress={isLocked ? undefined : onPressTile}
        onLongPress={isLocked ? undefined : onLongPress}
        disabled={isLocked}
      >
        <>
          <View style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            {/* Info row: mock values for calories and training level, now below the title */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomColor: `white`,
                borderBottomWidth: 1,
                width: '100%',
                paddingBottom: 5,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText style={[commonStyles.listItemTitle, isCompleted && { color: theme.colors.textMuted }]}>{title}</ThemedText>
                {description ? (
                  <TouchableOpacity
                    onPress={() => setDescVisible(true)}
                    style={[localStyles.helpButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
                    accessibilityLabel={`Show description for ${title}`}
                  >
                    <ThemedText weight="medium" style={[localStyles.helpButtonText, { color: theme.colors.primary }]}>?</ThemedText>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isLocked && (
                  <View style={localStyles.lockedBadge}>
                    <FontAwesome name="lock" size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                    <ThemedText style={[localStyles.lockedText, { color: theme.colors.textMuted }]}>
                      {t('locked') || 'locked'}
                    </ThemedText>
                  </View>
                )}
                {isCompleted && !isLocked && (
                  <ThemedText style={[localStyles.completedText, { color: theme.colors.glow }]}>
                    {t('completed') || 'completed'}
                  </ThemedText>
                )}
                {!isLocked && ((workoutItem?.calories !== undefined && workoutItem?.calories !== null) || caloriesData) ? (
                  <ThemedText style={{ fontSize: 14, color: theme.colors.textMuted, marginRight: 10 }}>
                    {t('calories_colon')} {caloriesData}
                  </ThemedText>
                ) : null}
                {!isLocked && workoutItem?.level && levelDisplay && (
                  <ThemedText style={{ fontSize: 14, color: theme.colors.textMuted, marginRight: 5 }}>
                    {levelDisplay}
                  </ThemedText>
                )}
                {!isLocked && intensityData && (
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
                    <ThemedText
                      key={index}
                      style={
                        isSelected && index === workoutStage
                          ? commonStyles.listItemValueText
                          : commonStyles.listItemValue
                      }
                    >
                      {display}
                    </ThemedText>
                  );
                })}
            </View>
          </View>
        </>
        {onPressBtn && <TimerButton text="Delete" onPress={onPressBtn} small />}
      </Pressable>
      </View>
    </View>
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
              <ThemedText weight="bold" style={[localStyles.modalTitle, { color: theme.colors.textPrimary }]}>{title}</ThemedText>
              <ThemedText style={[localStyles.modalText, { color: theme.colors.textMuted }]}>{description}</ThemedText>

              {/* YouTube Video Player */}
              <YouTubePlayer searchQuery={title} />
            </ScrollView>
            <TouchableOpacity
              style={[localStyles.modalClose, { backgroundColor: theme.colors.buttonBackground }]}
              onPress={() => setDescVisible(false)}
            >
              <ThemedText weight="medium" style={[localStyles.modalCloseText, { color: theme.colors.primary }]}>{t('close') || 'Close'}</ThemedText>
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
  glowOverlay: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 11,
    borderWidth: 2,
    zIndex: 2,
  },
  tileContent: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingLeft: 12,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 10,
  },
  helpButton: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  helpButtonText: {
    fontSize: 14,
    lineHeight: 18,
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
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  youtubeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  youtubeHint: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  // Completed text style
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
    textTransform: 'lowercase',
  },
  // Locked badge style
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  lockedText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
});
