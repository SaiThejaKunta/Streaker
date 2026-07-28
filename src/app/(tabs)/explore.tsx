// ============================================================
// STREAKER — Explore / Social Screen
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Card,
  Avatar,
  Badge,
  CoinDisplay,
  SectionHeader,
  Divider,
} from '../../../components/ui';
import { MOCK_LEADERBOARD, MOCK_ACTIVITIES, MOCK_USERS } from '../../../utils/mockData';
import { STREAK_CATEGORIES, REACTION_EMOJIS } from '../../../utils/constants';
import { getRelativeTime } from '../../../utils/helpers';
import type { LeaderboardEntry, Activity } from '../../../types';

type Tab = 'leaderboard' | 'feed' | 'discover';

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      {/* Header */}
      <View className="px-5 pt-14 pb-4">
        <Text className="text-white text-2xl font-bold">Explore 🌍</Text>

        {/* Search */}
        <View className="flex-row items-center bg-[#1E1E35] border border-[#2A2A45] rounded-xl mt-4 px-4 py-2.5">
          <Text className="text-gray-500 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-white text-base"
            placeholder="Search users..."
            placeholderTextColor="#6B6B80"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tabs */}
        <View className="flex-row mt-4 gap-2">
          {(['leaderboard', 'feed', 'discover'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                activeTab === tab ? 'bg-orange-500' : 'bg-[#1A1A2E] border border-[#2A2A45]'
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                className={`text-sm font-semibold capitalize ${
                  activeTab === tab ? 'text-white' : 'text-gray-400'
                }`}
              >
                {tab === 'leaderboard' ? '🏆 Board' : tab === 'feed' ? '📱 Feed' : '🔍 Discover'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'discover' && <DiscoverTab />}
      </ScrollView>
    </View>
  );
}

// ---- Leaderboard ----
function LeaderboardTab() {
  return (
    <View className="px-5">
      <SectionHeader title="Global Leaderboard" />

      {/* Top 3 Podium */}
      <View className="flex-row items-end justify-center mb-6 gap-3">
        {[MOCK_LEADERBOARD[1], MOCK_LEADERBOARD[0], MOCK_LEADERBOARD[2]].map(
          (entry, i) => {
            const isFirst = i === 1;
            const medals = ['🥈', '🥇', '🥉'];
            return (
              <View
                key={entry.rank}
                className={`items-center ${isFirst ? 'mb-4' : ''}`}
              >
                <Text className="text-2xl mb-1">{medals[i]}</Text>
                <Avatar
                  uri={entry.user.avatar_url}
                  name={entry.user.display_name}
                  size={isFirst ? 'lg' : 'md'}
                />
                <Text className="text-white text-xs font-semibold mt-2" numberOfLines={1}>
                  {entry.user.display_name.split(' ')[0]}
                </Text>
                <CoinDisplay amount={entry.coins_earned} size="sm" />
              </View>
            );
          }
        )}
      </View>

      {/* Full List */}
      {MOCK_LEADERBOARD.map((entry) => (
        <LeaderboardRow key={entry.rank} entry={entry} />
      ))}
    </View>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const isCurrentUser = entry.user.id === 'user-001';
  return (
    <Card className={`mb-2 ${isCurrentUser ? 'border-orange-500/50' : ''}`}>
      <View className="flex-row items-center">
        <Text className="text-gray-400 font-bold text-lg w-8">
          #{entry.rank}
        </Text>
        <Avatar
          uri={entry.user.avatar_url}
          name={entry.user.display_name}
          size="sm"
          className="mr-3"
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-white font-semibold" numberOfLines={1}>
              {entry.user.display_name}
            </Text>
            {isCurrentUser && <Badge label="You" variant="info" size="sm" />}
          </View>
          <Text className="text-gray-400 text-xs mt-0.5">
            {entry.streak_count} streaks · {entry.completion_rate}% rate
          </Text>
        </View>
        <CoinDisplay amount={entry.coins_earned} size="sm" />
      </View>
    </Card>
  );
}

// ---- Activity Feed ----
function FeedTab() {
  const allUsers = [...MOCK_USERS, { id: 'user-001', display_name: 'Alex Champion', avatar_url: null, username: 'streaker_king', bio: '', coin_balance: 1000, is_public: true, created_at: '', updated_at: '' }];

  return (
    <View className="px-5">
      <SectionHeader title="Friends Activity" />
      {MOCK_ACTIVITIES.map((activity) => {
        const user = allUsers.find((u) => u.id === activity.user_id);
        if (!user) return null;

        return (
          <Card key={activity.id} className="mb-3">
            <View className="flex-row items-start">
              <Avatar
                uri={user.avatar_url}
                name={user.display_name}
                size="sm"
                className="mr-3 mt-0.5"
              />
              <View className="flex-1">
                <View className="flex-row items-center flex-wrap gap-1">
                  <Text className="text-white font-semibold text-sm">
                    {user.display_name}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {activity.type === 'check_in' && 'checked in'}
                    {activity.type === 'missed' && 'missed a day'}
                    {activity.type === 'milestone' && 'hit a milestone'}
                    {activity.type === 'streak_created' && 'created a streak'}
                  </Text>
                </View>

                {/* Activity-specific content */}
                {activity.type === 'check_in' && Boolean((activity.data as any)?.note) ? (
                  <Text className="text-gray-300 text-sm mt-1">
                    "{(activity.data as any).note}"
                  </Text>
                ) : null}
                {activity.type === 'milestone' && (
                  <View className="flex-row items-center mt-1 gap-1">
                    <Text className="text-amber-400 text-sm font-medium">
                      🏅 {(activity.data as any)?.badge}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      — {(activity.data as any)?.milestone} day milestone!
                    </Text>
                  </View>
                )}
                {activity.type === 'missed' && (
                  <Text className="text-red-400 text-sm mt-1">
                    😢 {(activity.data as any)?.message}
                  </Text>
                )}

                <Text className="text-gray-500 text-xs mt-2">
                  {getRelativeTime(activity.created_at)}
                </Text>

                {/* Reactions */}
                <View className="flex-row mt-2 gap-1.5">
                  {REACTION_EMOJIS.slice(0, 4).map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      className="bg-[#252542] px-2.5 py-1 rounded-full"
                    >
                      <Text className="text-sm">{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

// ---- Discover ----
function DiscoverTab() {
  return (
    <View className="px-5">
      <SectionHeader title="Trending Streak Categories" />
      <View className="flex-row flex-wrap gap-3">
        {STREAK_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            className="bg-[#1A1A2E] border border-[#2A2A45] rounded-2xl px-4 py-3 flex-row items-center gap-2"
          >
            <Text className="text-xl">{cat.emoji}</Text>
            <Text className="text-white text-sm font-medium">{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Divider className="my-6" />

      <SectionHeader title="People You May Know" />
      {MOCK_USERS.filter((u) => u.is_public).map((user) => (
        <Card key={user.id} className="mb-2">
          <View className="flex-row items-center">
            <Avatar
              uri={user.avatar_url}
              name={user.display_name}
              size="md"
              className="mr-3"
            />
            <View className="flex-1">
              <Text className="text-white font-semibold">{user.display_name}</Text>
              <Text className="text-gray-400 text-xs">@{user.username}</Text>
              {user.bio ? (
                <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                  {user.bio}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity className="bg-blue-500/20 border border-blue-500/40 px-4 py-2 rounded-xl">
              <Text className="text-blue-400 text-xs font-semibold">Add</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </View>
  );
}
