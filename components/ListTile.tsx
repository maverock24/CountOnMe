import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import commonStyles from '@/app/styles';
import { WorkoutItem } from '@/components/data/types';
import Colors from '@/constants/Colors';

import { useTranslation } from 'react-i18next';
import TimerButton from './TimerButton';

const ListTile = ({
  isSelected,
  title,
  value,
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
  workoutItem?: WorkoutItem;
  onPressTile?: () => void;
  onPressBtn?: () => void;
  currentIndex?: number;
  onLongPress?: () => void;
  style?: any;
}) => {
  const [workoutStage, setWorkoutStage] = useState(currentIndex || 0);
  const { t } = useTranslation();
  
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
    
    // Use calories from WorkoutItem
    caloriesData = workoutItem.calories?.toString() || '';
  } else {
    // Legacy format: pipe-separated data
    const exerciseData = value?.split('|') || [];
    workoutData = exerciseData[0] || '';
    intensityData = exerciseData[1] || '';
    caloriesData = exerciseData[2] || '';
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
    <Pressable
      style={[
        commonStyles.listTile,
        {
          flexDirection: 'row',
          flex: 1,
          borderWidth: 1,
        },
        isSelected && {
          borderColor: 'rgb(2, 248, 240)',
          borderWidth:1,
          shadowColor: Colors.glow,
          shadowOpacity: 1,
          shadowRadius: 1,
          boxShadow: '0px 0px 8px rgba(0, 162, 212, 0.5)',
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
                borderBottomColor: '#b0e0e6',
                borderBottomWidth: 1,
                width: '100%',
                paddingBottom: 5,
              }}
            >
              <Text style={commonStyles.listItemTitle}>{title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {(workoutItem?.calories !== undefined && workoutItem?.calories !== null) || caloriesData ? (
                  <Text style={{ fontSize: 14, color: '#b0e0e6', marginRight: 10 }}>
                    {t('calories_colon')} {caloriesData}
                  </Text>
                ) : null}
                {workoutItem?.level && levelDisplay && (
                  <Text style={{ fontSize: 14, color: '#b0e0e6', marginRight: 5 }}>
                    {levelDisplay}
                  </Text>
                )}
                {intensityData && (
                  [...Array(totalStars)].map((_, i) => (
                    <FontAwesome
                      key={i}
                      name={i < filledStars ? 'star' : 'star-o'}
                      size={14}
                      color={i < filledStars ? 'white' : '#b0e0e6'}
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
                workoutData.split(';').map((time, index) => (
                  <Text
                    key={index}
                    style={
                      isSelected && index === workoutStage
                        ? commonStyles.listItemValueText
                        : commonStyles.listItemValue
                    }
                  >
                    {(parseFloat(time) / 60).toString()}
                  </Text>
                ))}
            </View>
          </View>
        </>
        {onPressBtn && <TimerButton text="Delete" onPress={onPressBtn} small />}
    </Pressable>
  );
};
export default ListTile;
