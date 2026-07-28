// ============================================================
// STREAKER — Settings Screen
// ============================================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, Button, Divider } from '../../components/ui';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [publicProfile, setPublicProfile] = useState(user?.is_public ?? true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-5 pt-14 pb-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A2E] items-center justify-center border border-[#2A2A45] mr-4"
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Settings</Text>
        </View>

        <View className="px-5">
          {/* Notifications */}
          <Card className="mb-4">
            <Text className="text-white font-bold text-base mb-4">🔔 Notifications</Text>
            <SettingRow
              label="Streak Reminders"
              description="Get reminded to check in daily"
              value={notifications}
              onToggle={setNotifications}
            />
            <Divider />
            <SettingRow
              label="Friend Activity"
              description="When friends check in or miss"
              value={true}
              onToggle={() => {}}
            />
            <Divider />
            <SettingRow
              label="Invitations"
              description="When someone invites you to a streak"
              value={true}
              onToggle={() => {}}
            />
          </Card>

          {/* Appearance */}
          <Card className="mb-4">
            <Text className="text-white font-bold text-base mb-4">🎨 Appearance</Text>
            <SettingRow
              label="Dark Mode"
              description="Use dark theme (recommended)"
              value={darkMode}
              onToggle={setDarkMode}
            />
          </Card>

          {/* Privacy */}
          <Card className="mb-4">
            <Text className="text-white font-bold text-base mb-4">🔒 Privacy</Text>
            <SettingRow
              label="Public Profile"
              description="Allow others to see your streaks and stats"
              value={publicProfile}
              onToggle={(v) => {
                setPublicProfile(v);
                updateProfile({ is_public: v });
              }}
            />
          </Card>

          {/* Account */}
          <Card className="mb-4">
            <Text className="text-white font-bold text-base mb-4">👤 Account</Text>
            <TouchableOpacity className="py-3">
              <Text className="text-gray-300">Edit Profile</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity className="py-3">
              <Text className="text-gray-300">Change Password</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity className="py-3">
              <Text className="text-gray-300">Export Data</Text>
            </TouchableOpacity>
          </Card>

          {/* About */}
          <Card className="mb-6">
            <Text className="text-white font-bold text-base mb-4">ℹ️ About</Text>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-400">Version</Text>
              <Text className="text-gray-300">1.0.0</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-400">Made with</Text>
              <Text className="text-gray-300">🔥 by STREAKER team</Text>
            </View>
          </Card>

          {/* Logout */}
          <Button
            title="Logout"
            variant="danger"
            onPress={handleLogout}
            fullWidth
          />

          <TouchableOpacity className="items-center mt-6">
            <Text className="text-red-400/50 text-sm">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ---- Setting Row ----
function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <View className="flex-1 mr-4">
        <Text className="text-gray-200 text-sm font-medium">{label}</Text>
        <Text className="text-gray-500 text-xs mt-0.5">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#2A2A45', true: '#FF6B35' }}
        thumbColor="#fff"
      />
    </View>
  );
}
