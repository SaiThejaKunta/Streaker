// ============================================================
// STREAKER — Tab Navigation Layout
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS } from '../../../utils/constants';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-2">
      <Text className={`text-lg ${focused ? '' : 'opacity-50'}`}>{emoji}</Text>
      <Text
        className={`text-[10px] mt-0.5 font-medium ${focused ? 'text-orange-400' : 'text-gray-500'}`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#12121F',
          borderTopColor: '#2A2A45',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        } as ViewStyle,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.accentOrange,
        tabBarInactiveTintColor: '#6B6B80',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🌍" label="Explore" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-center -mt-4">
              <View className={`w-14 h-14 rounded-full items-center justify-center ${focused ? 'bg-orange-500' : 'bg-orange-500/80'}`}>
                <Text className="text-2xl">➕</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔔" label="Activity" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
