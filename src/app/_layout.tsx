// ============================================================
// STREAKER — Root Layout (Auth Gate + Hydration)
// ============================================================

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import * as Updates from 'expo-updates';
import { useAuthStore } from '../../store/useAuthStore';
import { useStreakStore } from '../../store/useStreakStore';

import '../global.css';

type UpdateStatus = 'idle' | 'downloading' | 'ready';

function useOTAUpdateCheck() {
  const [status, setStatus] = useState<UpdateStatus>('idle');

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) return;

        setStatus('downloading');
        await Updates.fetchUpdateAsync();
        setStatus('ready');

        setTimeout(() => {
          Updates.reloadAsync();
        }, 1200);
      } catch (e) {
        console.error('OTA update check failed:', e);
      }
    })();
  }, []);

  return status;
}

function UpdateStatusBanner({ status }: { status: UpdateStatus }) {
  if (status === 'idle') return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 56,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A2E',
        borderWidth: 1,
        borderColor: '#2A2A45',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        zIndex: 999,
      }}
    >
      {status === 'downloading' && (
        <ActivityIndicator size="small" color="#FF6B35" style={{ marginRight: 8 }} />
      )}
      <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '500' }}>
        {status === 'downloading' ? 'Downloading update…' : '✓ Updated — restarting…'}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const { loadStreaks } = useStreakStore();
  const updateStatus = useOTAUpdateCheck();

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
        <UpdateStatusBanner status={updateStatus} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <UpdateStatusBanner status={updateStatus} />
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
          name="streak/check-in"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="streak/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
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
