import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ImageBackground, Pressable, StyleSheet } from 'react-native';
import {
  faAtom,
  faCog,
  faDumbbell,
  faGauge,
  faGears,
  faList,
  faStopwatch,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { EventEmitter } from 'events';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Icon } from 'react-native-vector-icons/Icon';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
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
  const image = require('../../assets/images/background1.jpeg');

  return (
    <ImageBackground
      source={image}
      resizeMode="cover"
      style={styles.imageContainer}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarStyle: { backgroundColor: 'black', height: 60 },
          tabBarLabelStyle: { fontSize: 14 },
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
            title: 'Counter',
            tabBarIcon: ({ color }) => <TabBarIcon size={22} iconName={faGauge} color={color} />,
            headerRight: () => (
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={25}
                      color={Colors[colorScheme ?? 'light'].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => <TabBarIcon size={29} iconName={faDumbbell} color={color} />,
          }}
        />
        <Tabs.Screen
          name="three"
          options={{
            title: 'Manager',
            tabBarIcon: ({ color }) => <TabBarIcon iconName={faList} color={color} />,
          }}
        />
        <Tabs.Screen
          name="five"
          options={{
            title: 'Trainer',
            tabBarIcon: ({ color }) => <TabBarIcon iconName={faAtom} color={color} />,
          }}
        />
        <Tabs.Screen
          name="four"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <TabBarIcon iconName={faGears} color={color} />,
          }}
        />
      </Tabs>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});