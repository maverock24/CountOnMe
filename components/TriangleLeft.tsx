import React, { useState } from 'react';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { TouchableOpacity } from 'react-native';

interface TriangleLeftProps {
  size?: number;
  onPress?: () => void;
}

export function TriangleLeft({ size = 80, onPress }: TriangleLeftProps) {
  const [pressed, setPressed] = useState(false);

  // Outer triangle (shadow/bottom)handleCountUp
  const outerWidth = size * 0.95;
  const outerHeight = size;
  // Inner triangle (top surface)
  const innerWidth = size * 0.75;
  const innerHeight = size * 0.85;
  const offsetX = (outerWidth - innerWidth) / 2 + size * 0.02;
  const offsetY = (outerHeight - innerHeight) / 2;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Svg width={outerWidth} height={outerHeight} viewBox={`0 0 ${outerWidth} ${outerHeight}`}>
        <Defs>
          {/* Outer gradient (shadow) */}
          <LinearGradient id="outerGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="rgb(80, 99, 110)" />
            <Stop offset="0.5" stopColor="rgb(51, 63, 71)" />
            <Stop offset="1" stopColor="rgb(28, 37, 43)" />
          </LinearGradient>
          {/* Inner gradient (top surface) */}
          <LinearGradient id="innerGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="rgb(63, 86, 98)" />
            <Stop offset="0.5" stopColor="rgb(38, 48, 54)" />
            <Stop offset="1" stopColor="rgb(43, 55, 63)" />
          </LinearGradient>
        </Defs>
        {/* Outer triangle (shadow) */}
        <Polygon
          points={`${outerWidth},0 0,${outerHeight / 2} ${outerWidth},${outerHeight}`}
          fill="url(#outerGrad)"
        />
        {/* Inner triangle (top surface) - hidden when pressed */}
        {!pressed && (
          <Polygon
            pointerEvents="box-none"
            points={`
              ${offsetX + innerWidth},${offsetY}
              ${offsetX},${offsetY + innerHeight / 2}
              ${offsetX + innerWidth},${offsetY + innerHeight}
            `}
            fill="url(#innerGrad)"
          />
        )}
      </Svg>
    </TouchableOpacity>
  );
}
