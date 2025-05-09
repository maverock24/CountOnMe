//timer button component
import commonStyles from '@/app/styles';
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
      onPress={onPress} // Add this line
      style={{ width: maxWidth ? '100%' : 'auto' }}
    >
      {({ pressed }) => (
        <LinearGradient
          style={[
            disabled && commonStyles.buttonDisabled,
            pressed && !small && { backgroundColor: 'rgba(0, 255, 42, 0.87)' },
            !disabled && !small && commonStyles.button,
            small && commonStyles.buttonSmall,
            small && pressed && commonStyles.buttonSmallPressed,
            { borderWidth: 2, borderColor: 'transparent' },
            isSelected && {
              borderColor: 'rgb(92, 150, 153)',
              borderWidth: 2,
              shadowColor: 'rgb(92, 150, 153)',
              shadowOpacity: 1,
              shadowRadius: 1,
              boxShadow: '0px 0px 5px 1px rgb(92, 150, 153)',
              elevation: 6, // Android
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
          <Text style={[commonStyles.buttonText, { paddingLeft: 10, paddingRight: 10 }]}>
            {text}
          </Text>
        </LinearGradient>
      )}
    </Pressable>
  );
};

export default TimerButton;
