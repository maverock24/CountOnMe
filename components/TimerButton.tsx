import commonStyles from '@/app/styles';
import React from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';

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
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        { width: maxWidth ? '100%' : 'auto' },
      ]}
    >
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.button,
          {
            padding: small ? 6 : 10,
            borderRadius: small ? 6 : 8,
            borderColor: theme.colors.buttonBorder,
            backgroundColor: theme.colors.buttonBackground,
            // Elevated look with layered shadows
            shadowColor: theme.colors.glow,
            shadowOffset: { width: 0, height: pressed ? 1 : 3 },
            shadowOpacity: pressed ? 0.2 : 0.35,
            shadowRadius: pressed ? 2 : 6,
            elevation: pressed ? 2 : 6,
          },
          // Top highlight for 3D effect
          !disabled && {
            borderTopColor: `${theme.colors.textPrimary}22`,
            borderTopWidth: 1,
          },
          pressed && {
            borderColor: theme.colors.borderActive,
            backgroundColor: `${theme.colors.buttonBackground}DD`,
            boxShadow: `0px 0px 12px ${theme.colors.glow}`,
          },
          disabled && [
            commonStyles.buttonDisabled,
            styles.buttonDisabled,
          ],
          isSelected && {
            borderColor: theme.colors.borderActive,
            boxShadow: `0px 0px 12px ${theme.colors.glow}, inset 0px 0px 8px ${theme.colors.glow}33`,
          },
          style,
        ]}
      >
        <ThemedText
          weight="bold"
          style={[
            commonStyles.buttonText,
            {
              paddingHorizontal: small ? 8 : 12,
              paddingVertical: small ? 2 : 4,
              fontSize: small ? 13 : 15,
              letterSpacing: 0.5,
              color: disabled ? `${theme.colors.textPrimary}66` : theme.colors.textPrimary,
              textShadowColor: disabled ? 'transparent' : `${theme.colors.glow}88`,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: disabled ? 0 : 4,
            },
          ]}
        >
          {text}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    borderTopWidth: 0,
  },
});

export default TimerButton;
