import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';

import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import { useData } from '@/components/data.provider';
import commonStyles from '@/app/styles';
import TimerButton from './TimerButton';

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
          { flexDirection: 'row' },
          isSelected && {
            borderColor: '#00bcd4',
            borderWidth: 2,
            shadowColor: '#00bcd4',
            shadowOpacity: 1,
            shadowRadius: 1,
            boxShadow: '0px 0px 5px 1px #00bcd4',
            elevation: 6, // Android
          },
        ]}
        colors={['#394962', '#222b3a', '#222b3a', '#222b3a']}
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
