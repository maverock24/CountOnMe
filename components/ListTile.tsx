import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';

import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import { useData } from '@/components/data.provider';
import commonStyles from '@/app/styles';
import TimerButton from './TimerButton';
import Colors from '@/constants/Colors';

const ListTile = ({
  isSelected,
  title,
  value,
  onPressTile,
  onPressBtn,
}: {
  isSelected?: boolean;
  title: string;
  value: string | null;
  onPressTile?: () => void;
  onPressBtn?: () => void;
}) => {
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
            elevation: 6, // Android
          },
        ]}
        colors={['rgb(49, 67, 77)', 'rgb(38, 48, 54)', 'rgb(28, 37, 43)']}
      >
        <Text style={commonStyles.listItemTitle}>{title}</Text>
        <Text style={commonStyles.listItemValue}>
          {value
            ?.split(';')
            .map((time) => parseFloat(time) / 60)
            .join(' | ')}
        </Text>
        {onPressBtn && <TimerButton text="Delete" onPress={onPressBtn} small />}
      </LinearGradient>
    </Pressable>
  );
};
export default ListTile;
