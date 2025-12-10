import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import commonStyles from '@/app/styles';
import { WorkoutItem } from '@/components/data/types';
import { roundToDecimals } from '@/utils/numberUtils';

import { useTranslation } from 'react-i18next';
import TimerButton from './TimerButton';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';

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
    <Pressable
      style={[
        commonStyles.listTile,
        {
          flexDirection: 'row',
          flex: 1,
          borderWidth: 1,
        },
        isSelected && {
          borderColor: theme.colors.borderActive,
          borderWidth:1,
          shadowColor: theme.colors.glow,
          shadowOpacity: 1,
          shadowRadius: 1,
          boxShadow: `0px 0px 8px ${theme.colors.glow}`,
          elevation: 6,
        },
        style
      ]}
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
    {description ? (
      <Modal
        visible={descVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDescVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalBox}>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={localStyles.modalTitle}>{title}</Text>
              <Text style={localStyles.modalText}>{description}</Text>
            </ScrollView>
            <TouchableOpacity
              style={localStyles.modalClose}
              onPress={() => setDescVisible(false)}
            >
              <Text style={localStyles.modalCloseText}>Close</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#0f1112',
    padding: 18,
    borderRadius: 10,
    width: '100%',
    maxWidth: 720,
    borderWidth: 1,
    borderColor: '#2a2e33',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    color: '#b0e0e6',
    fontSize: 14,
    lineHeight: 20,
  },
  modalClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#202425',
  },
  modalCloseText: {
    color: '#b0e0e6',
  },
});
