import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Client-only wrapper for Slider to avoid useLayoutEffect SSR warnings
export const ClientOnlySlider = (props: any) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only render on client side for web to avoid SSR warnings
    if (Platform.OS === 'web') {
      setIsClient(true);
    } else {
      // For native platforms, render immediately
      setIsClient(true);
    }
  }, []);

  if (!isClient && Platform.OS === 'web') {
    // Return a placeholder div on web until client-side hydration
    return null;
  }

  return <Slider {...props} />;
};