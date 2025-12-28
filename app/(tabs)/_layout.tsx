import {
    faAtom,
    faDumbbell,
    faGauge,
    faGears,
    faList,
    faSitemap,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { EventEmitter } from 'events';
import { Asset } from 'expo-asset';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Easing, ImageBackground, StyleSheet, View } from 'react-native';

import LoadingScreen from '@/components/LoadingScreen';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

// Background image asset
const backgroundImage = require('../../assets/images/background1.jpeg');

function TabBarIcon(props: { iconName: IconDefinition; color: string; size?: number }) {
  return (
    <FontAwesomeIcon size={28} style={{ marginBottom: -3 }} icon={props.iconName} {...props} />
  );
}

const pulseEventEmitter = new EventEmitter();

export function emitPulseEvent(isRunning: boolean) {
  pulseEventEmitter.emit('timerRunning', isRunning);
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  // Preload background image using expo-asset
  useEffect(() => {
    let isMounted = true;

    const preloadAssets = async () => {
      try {
        // Preload the background image
        await Asset.fromModule(backgroundImage).downloadAsync();

        // Small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));

        if (isMounted) {
          // Give a brief moment before hiding loading screen
          setTimeout(() => {
            if (isMounted) setIsLoading(false);
          }, 300);
        }
      } catch (error) {
        console.warn('Failed to preload background image:', error);
        // Still hide loading screen on error
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    preloadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Loading screen overlay */}
      <LoadingScreen visible={isLoading} message="INITIALIZING SYSTEM" />

      {/* Main content with background */}
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={styles.imageContainer}
      >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarStyle: { backgroundColor: 'black', height: 60 },
          tabBarLabelStyle: { fontSize: 12 },
          headerShown: false,
          animation: 'fade',
          transitionSpec: {
            animation: 'timing',
            config: { easing: Easing.bezier(0.42, 0, 0.58, 1) },
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('counter'),
            tabBarIcon: ({ color }) => <TabBarIcon size={22} iconName={faGauge} color={color} />,
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: t('workout'),
            tabBarIcon: ({ color }) => <TabBarIcon size={29} iconName={faDumbbell} color={color} />,
          }}
        />
        <Tabs.Screen
          name="three"
          options={{
            title: t('manager'),
            tabBarIcon: ({ color }) => <TabBarIcon iconName={faList} color={color} />,
          }}
        />
        <Tabs.Screen
          name="five"
          options={{
            title: t('trainer'),
            tabBarIcon: ({ color }) => <TabBarIcon iconName={faAtom} color={color} />,
          }}
        />
        <Tabs.Screen
          name="six"
          options={{
            title: t('progress'),
            tabBarIcon: ({ color }) => <TabBarIcon iconName={faSitemap} color={color} />,
          }}
        />
        <Tabs.Screen
          name="four"
          options={{
            title: t('settings'),
            tabBarIcon: ({ color }) => <TabBarIcon iconName={faGears} color={color} />,
          }}
        />
      </Tabs>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
