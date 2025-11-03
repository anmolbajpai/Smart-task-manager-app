import { Tabs } from 'expo-router';
<<<<<<< HEAD
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
=======
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.grey,
        tabBarStyle: {
          backgroundColor: "black",
          borderTopWidth: 0,
          position: "absolute",
          elevation: 0,
          height: 40,
          paddingBottom: 8,
        },
      }}
    >
>>>>>>> origin/master
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
<<<<<<< HEAD
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      /> */}
    </Tabs>
  );
}
=======
          tabBarIcon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="task-manager"
        options={{
          title: '',
          tabBarIcon: ({ size, color }) => <Ionicons name="add" size={size} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="Alerts"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ size, color }) => 
            <Ionicons name="heart" size={size} color={color} />
          ,
        }}
      />
      
      
      

      <Tabs.Screen
        name="Settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => 
            <Ionicons name="settings" size={size} color={color} />
          ,
        }}
      />

    </Tabs>
  );
}
>>>>>>> origin/master
