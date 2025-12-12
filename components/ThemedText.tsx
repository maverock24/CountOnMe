import React from 'react';
import { Text as RNText, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ThemedTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'bold';
  // Backwards compatibility props (ignored - theme colors are used instead)
  lightColor?: string;
  darkColor?: string;
}

/**
 * ThemedText - A Text component that automatically uses the selected font from theme
 *
 * Usage:
 *   <ThemedText>Regular text</ThemedText>
 *   <ThemedText weight="bold">Bold text</ThemedText>
 *   <ThemedText weight="medium">Medium text</ThemedText>
 */
export const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  style,
  weight = 'regular',
  lightColor: _lightColor,
  darkColor: _darkColor,
  ...props
}) => {
  const { font, theme } = useTheme();

  // Get the appropriate font family based on weight
  const getFontFamily = (): string | undefined => {
    if (font.id === 'system') {
      return undefined; // Use system default
    }
    return font.weights[weight] || font.fontFamily;
  };

  const fontFamily = getFontFamily();

  const combinedStyle: TextStyle[] = [
    fontFamily ? { fontFamily } : {},
    { color: theme.colors.textPrimary }, // Default to theme text color
    StyleSheet.flatten(style) as TextStyle,
  ];

  return (
    <RNText style={combinedStyle} {...props}>
      {children}
    </RNText>
  );
};

export default ThemedText;
