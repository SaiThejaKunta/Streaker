// ============================================================
// STREAKER — Profile Screen (Public/Private Toggle)
// ============================================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { useStreakStore } from '../../../store/useStreakStore';
import {
  Card,
  Avatar,
  Badge,
  CoinDisplay,
  SectionHeader,
  ProgressBar,
  Divider,
  Button,
} from '../../../components/ui';
import { MOCK_USER_STATS, MOCK_TRANSACTIONS } from '../../../utils/mockData';
import { ACHIEVEMENTS, COLORS } from '../../../utils/constants';
import { formatDateDisplay, formatCoins, getRelativeTime, formatNumber } from '../../../utils/helpers';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { getMyStreaks } = useStreakStore();
  const [viewMode, setViewMode] = useState<'public' | 'private'>('public');
  const stats = MOCK_USER_STATS;
  const myStreaks = getMyStreaks();
  const unlockedBadges = ACHIEVEMENTS.slice(0, stats.achievements_unlocked);

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-5 pt-14 pb-2 flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Profile</Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.push('/settings' as any)}
              className="w-9 h-9 rounded-full bg-[#1A1A2E] items-center justify-center border border-[#2A2A45]"
            >
              <Text className="text-sm">⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Header Card */}
        <View className="px-5 mt-4">
          <Card>
            <View className="items-center">
              <Avatar
                uri={user?.avatar_url}
                name={user?.display_name || '?'}
                size="xl"
              />
              <Text className="text-white text-xl font-bold mt-3">
                {user?.display_name}
              </Text>
              <Text className="text-gray-400 text-sm">@{user?.username}</Text>
              {user?.bio ? (
                <Text className="text-gray-300 text-sm mt-2 text-center px-4">
                  {user.bio}
                </Text>
              ) : null}

              {/* Coin Balance */}
              <View className="mt-3">
                <CoinDisplay amount={user?.coin_balance || 0} size="lg" />
              </View>

              {/* Stats Row */}
              <View className="flex-row mt-4 pt-4 border-t border-[#2A2A45] w-full">
                <View className="flex-1 items-center">
                  <Text className="text-white text-xl font-bold">{stats.active_streaks}</Text>
                  <Text className="text-gray-400 text-xs">Active</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-white text-xl font-bold">{stats.completed_streaks}</Text>
                  <Text className="text-gray-400 text-xs">Completed</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-white text-xl font-bold">{stats.longest_streak}d</Text>
                  <Text className="text-gray-400 text-xs">Best Streak</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-white text-xl font-bold">{stats.total_check_ins}</Text>
                  <Text className="text-gray-400 text-xs">Check-ins</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* View Mode Toggle */}
        <View className="px-5 mt-4">
          <View className="flex-row bg-[#1A1A2E] rounded-xl p-1 border border-[#2A2A45]">
            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-lg items-center ${viewMode === 'public' ? 'bg-orange-500' : ''}`}
              onPress={() => setViewMode('public')}
            >
              <Text className={`text-sm font-semibold ${viewMode === 'public' ? 'text-white' : 'text-gray-400'}`}>
                🌍 Public View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-lg items-center ${viewMode === 'private' ? 'bg-orange-500' : ''}`}
              onPress={() => setViewMode('private')}
            >
              <Text className={`text-sm font-semibold ${viewMode === 'private' ? 'text-white' : 'text-gray-400'}`}>
                🔒 Private View
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Achievements */}
        <View className="px-5 mt-5">
          <SectionHeader title="🏅 Achievements" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = unlockedBadges.some((b) => b.key === achievement.key);
                return (
                  <View
                    key={achievement.key}
                    className={`w-20 items-center p-3 rounded-2xl border ${
                      isUnlocked
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#1A1A2E] border-[#2A2A45] opacity-40'
                    }`}
                  >
                    <Text className="text-2xl">{achievement.emoji}</Text>
                    <Text className="text-white text-[10px] font-medium mt-1 text-center" numberOfLines={2}>
                      {achievement.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Streak Heatmap (simplified) */}
        <View className="px-5 mt-5">
          <SectionHeader title="🟩 Streak Heatmap" />
          <Card>
            <View className="flex-row flex-wrap gap-1.5">
              {Array.from({ length: 52 * 7 }, (_, i) => {
                // Simulated heatmap: random intensity
                const rand = Math.random();
                const intensity =
                  rand > 0.7
                    ? 'bg-green-500'
                    : rand > 0.5
                    ? 'bg-green-600/60'
                    : rand > 0.3
                    ? 'bg-green-700/40'
                    : 'bg-[#252542]';
                // Only show last 90 days for mobile
                if (i >= 90) return null;
                return (
                  <View
                    key={i}
                    className={`w-2.5 h-2.5 rounded-sm ${intensity}`}
                  />
                );
              })}
            </View>
            <View className="flex-row items-center justify-end mt-3 gap-1">
              <Text className="text-gray-500 text-xs mr-1">Less</Text>
              <View className="w-2.5 h-2.5 rounded-sm bg-[#252542]" />
              <View className="w-2.5 h-2.5 rounded-sm bg-green-700/40" />
              <View className="w-2.5 h-2.5 rounded-sm bg-green-600/60" />
              <View className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              <Text className="text-gray-500 text-xs ml-1">More</Text>
            </View>
          </Card>
        </View>

        {/* Private: Coin Transaction History */}
        {viewMode === 'private' && (
          <View className="px-5 mt-5">
            <SectionHeader title="🪙 Coin History" />
            {MOCK_TRANSACTIONS.slice(0, 6).map((tx) => (
              <View
                key={tx.id}
                className="flex-row items-center py-3 border-b border-[#2A2A45]"
              >
                <View className="w-9 h-9 rounded-full bg-[#1A1A2E] items-center justify-center mr-3 border border-[#2A2A45]">
                  <Text className="text-sm">
                    {tx.amount > 0 ? '📈' : '📉'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm" numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {getRelativeTime(tx.created_at)}
                  </Text>
                </View>
                <CoinDisplay amount={tx.amount} showSign size="sm" />
              </View>
            ))}
          </View>
        )}

        {/* Public: Active Streaks */}
        {viewMode === 'public' && (
          <View className="px-5 mt-5">
            <SectionHeader title="🔥 Active Streaks" />
            {myStreaks
              .filter((s) => s.is_public)
              .map((streak) => (
                <Card key={streak.id} className="mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-xl mr-3">{streak.emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{streak.name}</Text>
                      <Text className="text-gray-400 text-xs">
                        {streak.target_days} day target · {streak.is_group ? 'Group' : 'Solo'}
                      </Text>
                    </View>
                    <Badge
                      label={`${streak.my_membership?.current_streak_count || 0}d`}
                      variant="success"
                    />
                  </View>
                </Card>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
