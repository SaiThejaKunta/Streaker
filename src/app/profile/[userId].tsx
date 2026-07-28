// ============================================================
// STREAKER — View Other User's Profile
// ============================================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MOCK_USERS } from '../../../utils/mockData';
import { Card, Avatar, Badge, CoinDisplay, Button } from '../../../components/ui';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const user = MOCK_USERS.find((u) => u.id === userId);

  if (!user) {
    return (
      <View className="flex-1 bg-[#0F0F1A] items-center justify-center">
        <Text className="text-white text-lg">User not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A2E] items-center justify-center border border-[#2A2A45] mb-4"
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
        </View>

        {/* Profile */}
        <View className="items-center px-5 mb-6">
          <Avatar uri={user.avatar_url} name={user.display_name} size="xl" />
          <Text className="text-white text-xl font-bold mt-3">
            {user.display_name}
          </Text>
          <Text className="text-gray-400">@{user.username}</Text>
          {user.bio ? (
            <Text className="text-gray-300 text-sm mt-2 text-center">
              {user.bio}
            </Text>
          ) : null}
          <CoinDisplay amount={user.coin_balance} size="lg" className="mt-3" />
        </View>

        {/* Actions */}
        <View className="px-5 flex-row gap-3 mb-6">
          <Button title="Add Friend" variant="primary" className="flex-1" />
          <Button title="Challenge" variant="secondary" className="flex-1" />
        </View>

        {/* Public info banner */}
        {!user.is_public && (
          <View className="px-5">
            <Card className="items-center">
              <Text className="text-3xl mb-2">🔒</Text>
              <Text className="text-gray-400 text-center">
                This profile is private
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
