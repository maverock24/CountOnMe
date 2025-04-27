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
}: {
  onPress: () => void;
  disabled?: boolean;
  text: string;
  style?: StyleProp<ViewStyle>;
  maxWidth?: boolean;
  small?: boolean;
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
          ]}
          colors={
            disabled
              ? ['#2d3749', '#2d3749', '#2d3749']
              : pressed
              ? ['rgb(32, 40, 52)', 'rgb(32, 40, 52)', 'rgb(32, 40, 52)']
              : ['#4c5e7c', '#2d3749', '#2d3749']
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
