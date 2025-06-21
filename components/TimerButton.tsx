
import commonStyles from '@/app/styles';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';

const TimerButton = ({
  onPress,
  disabled,
  text,
  style,
  maxWidth,
  small,
  isSelected,
}: {
  onPress: () => void;
  disabled?: boolean;
  text: string;
  style?: StyleProp<ViewStyle>;
  maxWidth?: boolean;
  small?: boolean;
  isSelected?: boolean;
}) => {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress} 
      style={{ width: maxWidth ? '100%' : 'auto' }}
    >
      {({ pressed }) => (
        <LinearGradient
          style={[
            disabled && commonStyles.buttonDisabled,
            !disabled && !small && commonStyles.button,
            small && commonStyles.buttonSmall,
            small && pressed && commonStyles.buttonSmallPressed,
            { borderWidth: 2, borderColor: 'transparent' },
            isSelected && {
              borderColor: Colors.glow,
              borderWidth: 2,
              shadowColor: Colors.glow,
              shadowOpacity: 1,
              shadowRadius: 1,
              boxShadow: `0px 0px 5px 1px ${Colors.glow}`,
              elevation: 6, 
            },
            style,
          ]}
          colors={
            disabled
              ? ['rgb(23, 31, 35)', 'rgb(23, 31, 35)']
              : pressed
              ? [ 'rgb(26, 36, 41)', 'rgb(26, 36, 41)']
              : ['rgb(49, 67, 77)', 'rgb(38, 48, 54)', 'rgb(28, 37, 43)']
          }
        >
          <Text style={[commonStyles.buttonText, { paddingLeft: 5, paddingRight: 5, fontSize: small ? 12 : 14 }]}>
            {text}
          </Text>
        </LinearGradient>
      )}
    </Pressable>
  );
};

export default TimerButton;
