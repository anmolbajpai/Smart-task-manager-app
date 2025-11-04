import { Tabs } from 'expo-router';
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
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
