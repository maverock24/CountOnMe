import React from 'react';
import { Text as RNText, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ThemedTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'bold';
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
  ...props
}) => {
  const { font } = useTheme();

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
    StyleSheet.flatten(style) as TextStyle,
  ];

  return (
    <RNText style={combinedStyle} {...props}>
      {children}
    </RNText>
  );
};

export default ThemedText;
