import { Platform } from 'react-native';
import { Slot, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/appshell';

export default function AppLayout() {
  if (Platform.OS === 'web') {
    return (
      <AppShell>
        <Slot />
      </AppShell>
    );
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="applied-jobs"
        options={{
          title: 'Applied',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="briefcase-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}