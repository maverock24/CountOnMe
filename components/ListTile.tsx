import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';

import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import { useData } from '@/components/data.provider';
import commonStyles from '@/app/styles';
import TimerButton from './TimerButton';
import Colors from '@/constants/Colors';
import { parse } from '@babel/core';

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

  const [ workoutStage, setWorkoutStage ] = useState(currentIndex || 0);

  useEffect(() => {
    if (currentIndex !== undefined) {
      setWorkoutStage(currentIndex);
    }
  }, [currentIndex]);

  return (
    <Pressable
      style={{
        flex: 1,
        width: '100%',
        paddingBottom: 0,
        paddingTop: 0,
      }}
      onPress={onPressTile}
    >
      <LinearGradient
        style={[
          commonStyles.button,
          { flexDirection: 'row', flex: 1, borderWidth: 2, borderColor: 'transparent' },
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
  <Text style={commonStyles.listItemTitle}>{title}</Text>
  {value &&
    value.split(';').map((time, index) => (
      <Text key={index} style={isSelected && index === workoutStage ? commonStyles.listItemValueText : commonStyles.listItemValue}>
        {(parseFloat(time) / 60).toString()}
      </Text>
    ))
  }
</>
        {onPressBtn && <TimerButton text="Delete" onPress={onPressBtn} small />}
      </LinearGradient>
    </Pressable>
  );
};
export default ListTile;
