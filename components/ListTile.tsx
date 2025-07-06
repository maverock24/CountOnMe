import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import commonStyles from '@/app/styles';
import Colors from '@/constants/Colors';

import { useTranslation } from 'react-i18next';
import TimerButton from './TimerButton';

const ListTile = ({
  isSelected,
  title,
  value,
  onPressTile,
  onPressBtn,
  currentIndex,
}: {
  isSelected?: boolean;
  title: string;
  value: string | null;
  onPressTile?: () => void;
  onPressBtn?: () => void;
  currentIndex?: number;
}) => {
  const [workoutStage, setWorkoutStage] = useState(currentIndex || 0);
  const { t } = useTranslation();
  
  const exerciseData = value?.split('|') || [];
  const workoutData = exerciseData[0] || '';
  const intensityData = exerciseData[1] || '';
  const calorysData = exerciseData[2] || '';

  useEffect(() => {
    if (currentIndex !== undefined) {
      setWorkoutStage(currentIndex);
    }
  }, [currentIndex]);


  let filledStars = 0;
  switch (intensityData) {
    case 'low':
      filledStars = 1;
      break;
    case 'medium':
      filledStars = 2;
      break;
    case 'high':
      filledStars = 3;
      break; 
    default:
      filledStars = 0; 
  }

  const totalStars = 3;

  return (
    <Pressable
      style={{
        paddingBottom: 0,
        paddingTop: 0,
      }}
      onPress={onPressTile}
    >
      <LinearGradient
        style={[
          commonStyles.button,
          { flexDirection: 'row', flex: 1, borderWidth: 3, borderColor: 'transparent' },
          isSelected && {
            borderColor: Colors.glow,
            borderWidth: 2,
            shadowColor: Colors.glow,
            shadowOpacity: 1,
            shadowRadius: 1,
            boxShadow: `0px 0px 5px 1px ${Colors.glow}`,
            elevation: 6,
          },
        ]}
        colors={['rgb(49, 67, 77)', 'rgb(38, 48, 54)', 'rgb(28, 37, 43)']}
      >
        <>
          <View style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            {/* Info row: mock values for calories and training level, now below the title */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottomColor: '#b0e0e6',
                borderBottomWidth: 1,
                width: '100%',
                paddingBottom: 5,
              }}
            >
              <Text style={commonStyles.listItemTitle}>{title}</Text>
              <Text style={{ fontSize: 12, color: '#b0e0e6', marginBottom: 5 }}>{t('calories_colon')} {calorysData}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 12, color: '#b0e0e6', marginRight: 5 }}>{t('level_colon')}</Text>
                {[...Array(totalStars)].map((_, i) => (
                  <FontAwesome
                    key={i}
                    name={i < filledStars ? 'star' : 'star-o'}
                    size={14}
                    color={i < filledStars ? 'white' : '#b0e0e6'}
                    style={{ marginLeft: 1, marginRight: 1 }}
                  />
                ))}
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
      </LinearGradient>
    </Pressable>
  );
};
export default ListTile;
