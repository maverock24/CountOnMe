import React, { ReactNode } from 'react';
import { View, Text, ViewStyle, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import commonStyles from '../app/styles';
import { gradients, gradientDirections, addShineEffect } from '../app/utils/gradients';

interface GradientTileProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
  metalType?: keyof typeof gradients;
  shine?: boolean;
  shimmer?: boolean;
  direction?: keyof typeof gradientDirections;
  shineIntensity?: number;
}

const GradientTile: React.FC<GradientTileProps> = ({
  title,
  children,
  style,
  metalType = 'steel',
  shine = true,
  shimmer = false,
  direction = 'angledTop',
  shineIntensity = 0.3,
}) => {
  // Use metal gradient, with optional shine effect
  const colors = shine
    ? addShineEffect(gradients[metalType], shineIntensity)
    : gradients[metalType];

  const shimmerAnim = useRef(new Animated.Value(-100)).current;
  const [tileHeight, setTileHeight] = useState(0);

  // Get gradient direction
  const gradientAngle = gradientDirections[direction];
  const isVertical = direction === 'topToBottom';

  // Animate shimmer effect
  useEffect(() => {
    if (shimmer) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 250,
          duration: 2500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [shimmer, shimmerAnim]);

  return (
    <View
      style={[commonStyles.tile, style]}
      onLayout={(event) => {
        setTileHeight(event.nativeEvent.layout.height);
      }}
    >
      {/* Title outside the gradient area */}
      {title && <Text style={commonStyles.tileTitle}>{title}</Text>}

      {/* Top gradient layer */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors[0],
        }}
      />

      {/* Middle gradient layer (highlight/shine) */}
      <View
        style={{
          position: 'absolute',
          top: isVertical ? '30%' : 0,
          left: !isVertical ? '30%' : 0,
          right: !isVertical ? '30%' : 0,
          bottom: isVertical ? '30%' : 0,
          height: isVertical ? '40%' : '100%',
          width: !isVertical ? '40%' : '100%',
          backgroundColor: colors[1],
          opacity: 0.7,
        }}
      />

      {/* Bottom gradient layer */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          backgroundColor: colors[2] || colors[1],
          opacity: 0.9,
          borderBottomLeftRadius: 9,
          borderBottomRightRadius: 9,
        }}
      />

      {/* Bevel effect - top edge highlight */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1.5,
          backgroundColor: '#FFFFFF',
          opacity: 0.3,
          borderTopLeftRadius: 9,
          borderTopRightRadius: 9,
        }}
      />

      {/* Bevel effect - left edge highlight */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1.5,
          bottom: 0,
          backgroundColor: '#FFFFFF',
          opacity: 0.2,
          borderTopLeftRadius: 9,
          borderBottomLeftRadius: 9,
        }}
      />

      {/* Bevel effect - bottom edge shadow */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1.5,
          backgroundColor: '#000000',
          opacity: 0.3,
          borderBottomLeftRadius: 9,
          borderBottomRightRadius: 9,
        }}
      />

      {/* Content layer */}
      <View style={commonStyles.gradientContent}>{children}</View>
    </View>
  );
};

export default GradientTile;
