// ============================================================
// STREAKER — Root Layout (Auth Gate + Hydration)
// ============================================================

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useStreakStore } from '../../store/useStreakStore';

import '../global.css';

export default function RootLayout() {
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const { loadStreaks } = useStreakStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadStreaks();
    }
  }, [isAuthenticated]);

  // Show splash while hydrating auth state from AsyncStorage
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F1A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔥</Text>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F0F1A' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="streak/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="streak/check-in"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="profile/[userId]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="settings"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}
