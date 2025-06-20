import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [userIdInitialized, setUserIdInitialized] = useState(false);

  // Initialize user ID on component mount
  useEffect(() => {
    const initializeUserId = async () => {
      try {
        const existingUserId = await AsyncStorage.getItem('userId');
        if (!existingUserId) {
          const newUserId = generateUserId();
          await AsyncStorage.setItem('userId', newUserId);
          console.log('New user ID generated:', newUserId);
        }
        setUserIdInitialized(true);
      } catch (error) {
        console.error('Error initializing user ID:', error);
        // Fallback to a temporary ID if storage fails
        const tempId = generateUserId();
        await AsyncStorage.setItem('userId', tempId);
        setUserIdInitialized(true);
      }
    };

    initializeUserId();
  }, []);

  // Generate a random user ID
  const generateUserId = () => {
    return `user_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  };

  if (!userIdInitialized) {
    return null; // Or return a loading indicator
  }

  return (
    <Tabs
      screenOptions={{
      tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarBackground: TabBarBackground,
      tabBarStyle: Platform.select({
        ios: {
        // Use a transparent background on iOS to show the blur effect
        position: 'absolute',
        },
        default: {},
      }),
      }}>
      <Tabs.Screen
      name="map"
      options={{
        title: 'Map',
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="mappin.and.ellipse" color={color} />,
      }}
      />
      
      <Tabs.Screen
      name="bookmark"
      options={{
        title: 'Bookmarks',
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="bookmark.fill" color={color} />,
      }}
      />
    
      <Tabs.Screen
      name="myspot"
      options={{
        title: 'My Spot',
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
      }}
      />
    </Tabs>
  );
}
