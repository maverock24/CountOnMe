import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { Pressable } from 'react-native';

interface TriangleRightProps {
  size?: number;
  onPress?: () => void;
}

export function TriangleRight({ size = 80, onPress }: TriangleRightProps) {
  // Outer triangle (shadow/bottom)
  const outerWidth = size * 0.95;
  const outerHeight = size;
  // Inner triangle (top surface)
  const innerWidth = size * 0.75;
  const innerHeight = size * 0.85;
  const offsetX = (outerWidth - innerWidth) / 2 + size * 0.02;
  const offsetY = (outerHeight - innerHeight) / 2;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
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
              <Stop offset="0" stopColor="rgb(44, 60, 68)" />
              <Stop offset="0.5" stopColor="rgb(38, 48, 54)" />
              <Stop offset="1" stopColor="rgb(43, 55, 63)" />
            </LinearGradient>
          </Defs>
          {/* Outer triangle (shadow) */}
          <Polygon
            points={`0,0 ${outerWidth},${outerHeight / 2} 0,${outerHeight}`}
            fill="url(#outerGrad)"
          />
          {/* Inner triangle (top surface) - hidden when pressed */}
          {!pressed && (
            <Polygon
              pointerEvents="box-none"
              points={`
                ${outerWidth - offsetX - innerWidth},${offsetY}
                ${outerWidth - offsetX},${offsetY + innerHeight / 2}
                ${outerWidth - offsetX - innerWidth},${offsetY + innerHeight}
              `}
              fill="url(#innerGrad)"
            />
          )}
        </Svg>
      )}
    </Pressable>
  );
}
