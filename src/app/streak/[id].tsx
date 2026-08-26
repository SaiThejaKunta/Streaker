// ============================================================
// STREAKER — Streak Detail View
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStreakStore } from '../../../store/useStreakStore';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  Card,
  Avatar,
  Badge,
  CoinDisplay,
  ProgressBar,
  SectionHeader,
  Divider,
  Button,
} from '../../../components/ui';
import { COLORS } from '../../../utils/constants';
import {
  getCurrentDayNumber,
  getStreakProgress,
  formatDateDisplay,
  getToday,
} from '../../../utils/helpers';

type Tab = 'calendar' | 'members' | 'leaderboard';

export default function StreakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getStreakById, getCalendarDays, getStreakMembers, getTodayCheckInStatus, deleteStreak } =
    useStreakStore();
  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?.id || '';
  const [activeTab, setActiveTab] = useState<Tab>('calendar');

  const streak = getStreakById(id!);
  if (!streak) {
    return (
      <View className="flex-1 bg-[#0F0F1A] items-center justify-center">
        <Text className="text-white text-lg">Streak not found</Text>
      </View>
    );
  }

  const currentDay = getCurrentDayNumber(streak.start_date);
  const progress = getStreakProgress(streak.start_date, streak.target_days);
  const calendarDays = getCalendarDays(streak.id, userId);
  const members = getStreakMembers(streak.id);
  const checkInStatus = getTodayCheckInStatus(streak.id, userId);

  // Leaderboard sorted by coins earned
  const leaderboard = [...members]
    .sort((a, b) => b.coins_earned - a.coins_earned)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A2E] items-center justify-center border border-[#2A2A45] mb-4"
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-5xl mb-3">{streak.emoji}</Text>
            <Text className="text-white text-2xl font-bold">{streak.name}</Text>
            {streak.description ? (
              <Text className="text-gray-400 text-sm mt-1 text-center">
                {streak.description}
              </Text>
            ) : null}
            <View className="flex-row items-center gap-2 mt-2">
              <Badge
                label={streak.is_group ? 'Group' : 'Solo'}
                variant="info"
              />
              <Badge
                label={streak.is_public ? 'Public' : 'Private'}
                variant="default"
              />
              <Badge
                label={streak.status}
                variant={streak.status === 'active' ? 'success' : 'warning'}
              />
            </View>
          </View>
        </View>

        {/* Progress Ring / Stats */}
        <View className="px-5 mb-4">
          <Card>
            <View className="items-center mb-4">
              {/* Circular progress representation */}
              <View className="w-32 h-32 rounded-full border-8 border-[#2A2A45] items-center justify-center mb-3 relative">
                <View
                  className="absolute inset-0 rounded-full border-8 border-orange-500"
                  style={{
                    borderColor: COLORS.accentOrange,
                    opacity: progress / 100,
                  }}
                />
                <View className="items-center">
                  <Text className="text-white text-3xl font-bold">
                    {currentDay}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    of {streak.target_days}
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={progress}
                showLabel
                height={8}
                className="w-full"
              />
            </View>

            <View className="flex-row">
              <View className="flex-1 items-center">
                <Text className="text-gray-400 text-xs">Started</Text>
                <Text className="text-white text-sm font-medium mt-1">
                  {formatDateDisplay(streak.start_date)}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-400 text-xs">Buy-in</Text>
                <CoinDisplay amount={streak.coin_buy_in} size="sm" />
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-400 text-xs">Members</Text>
                <Text className="text-white text-sm font-medium mt-1">
                  {members.length}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Check-in Button */}
        {!checkInStatus && streak.status === 'active' && (
          <View className="px-5 mb-4">
            <Button
              title="Check In Now 🔥"
              onPress={() => router.push({ pathname: '/streak/check-in', params: { id: streak.id } } as any)}
              fullWidth
              size="lg"
            />
          </View>
        )}
        {checkInStatus === 'verified' && (
          <View className="px-5 mb-4">
            <View className="bg-green-500/10 border border-green-500/30 py-4 rounded-2xl items-center flex-row justify-center">
              <Text className="text-xl mr-2">✅</Text>
              <Text className="text-green-400 font-bold text-base">
                Checked in for today!
              </Text>
            </View>
          </View>
        )}
        {checkInStatus === 'pending' && (
          <View className="px-5 mb-4">
            <View className="bg-amber-500/10 border border-amber-500/30 py-4 rounded-2xl items-center flex-row justify-center">
              <Text className="text-xl mr-2">⏳</Text>
              <Text className="text-amber-400 font-bold text-base">
                Pending Verification...
              </Text>
            </View>
          </View>
        )}

        {/* Tab Switcher */}
        <View className="px-5 mb-3">
          <View className="flex-row gap-2">
            {(['calendar', 'members', 'leaderboard'] as Tab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  activeTab === tab
                    ? 'bg-orange-500'
                    : 'bg-[#1A1A2E] border border-[#2A2A45]'
                }`}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  className={`text-xs font-semibold capitalize ${
                    activeTab === tab ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {tab === 'calendar' ? '📅 Calendar' : tab === 'members' ? '👥 Members' : '🏆 Board'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <View className="px-5">
            <Card>
              <View className="flex-row flex-wrap gap-1.5">
                {calendarDays.map((day, i) => {
                  const colors = {
                    completed: 'bg-green-500',
                    missed: 'bg-red-500/60',
                    frozen: 'bg-blue-400/60',
                    today: 'bg-orange-500 border-2 border-orange-300',
                    upcoming: 'bg-[#252542]',
                  };
                  const icons = {
                    completed: '✅',
                    missed: '❌',
                    frozen: '❄️',
                    today: '📍',
                    upcoming: '',
                  };
                  return (
                    <View
                      key={i}
                      className={`w-9 h-9 rounded-lg items-center justify-center ${colors[day.status]}`}
                    >
                      {icons[day.status] ? (
                        <Text className="text-xs">{icons[day.status]}</Text>
                      ) : (
                        <Text className="text-gray-500 text-[10px]">{i + 1}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <View className="flex-row items-center justify-center mt-4 gap-3">
                <View className="flex-row items-center gap-1">
                  <View className="w-3 h-3 rounded-sm bg-green-500" />
                  <Text className="text-gray-400 text-xs">Done</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-3 h-3 rounded-sm bg-red-500/60" />
                  <Text className="text-gray-400 text-xs">Missed</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-3 h-3 rounded-sm bg-orange-500" />
                  <Text className="text-gray-400 text-xs">Today</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-3 h-3 rounded-sm bg-[#252542]" />
                  <Text className="text-gray-400 text-xs">Upcoming</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View className="px-5">
            {members.map((member) => (
              <Card key={member.id} className="mb-2">
                <View className="flex-row items-center">
                  <Avatar
                    uri={member.user?.id === userId ? currentUser?.avatar_url : member.user?.avatar_url}
                    name={member.user?.display_name || '?'}
                    size="md"
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white font-semibold">
                        {member.user?.display_name}
                      </Text>
                      {!member.is_active && (
                        <Badge label="Eliminated" variant="danger" size="sm" />
                      )}
                      {member.today_checked_in && (
                        <Text className="text-xs">✅</Text>
                      )}
                    </View>
                    <Text className="text-gray-400 text-xs mt-0.5">
                      🔥 {member.current_streak_count}d streak · Earned {member.coins_earned} 🪙
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <View className="px-5">
            {leaderboard.map((member) => {
              const medal =
                member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : member.rank === 3 ? '🥉' : '';
              return (
                <Card key={member.id} className="mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-gray-400 font-bold text-lg w-8">
                      {medal || `#${member.rank}`}
                    </Text>
                    <Avatar
                      uri={member.user?.id === userId ? currentUser?.avatar_url : member.user?.avatar_url}
                      name={member.user?.display_name || '?'}
                      size="sm"
                      className="mr-3"
                    />
                    <View className="flex-1">
                      <Text className="text-white font-semibold">
                        {member.user?.display_name}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {member.current_streak_count}d streak
                      </Text>
                    </View>
                    <CoinDisplay amount={member.coins_earned} size="sm" />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Delete Streak Button (Creator Only) */}
        {streak.created_by === userId && (
          <View className="px-5 mt-4 mb-8">
            <TouchableOpacity
              className="bg-red-500/10 border border-red-500/30 rounded-xl py-3 items-center"
              onPress={() => {
                Alert.alert(
                  'Delete Streak',
                  streak.is_group
                    ? 'Are you sure you want to permanently delete this group streak? All members will be refunded their coins.'
                    : 'Are you sure you want to permanently delete this streak?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteStreak(streak.id);
                          router.replace('/(tabs)/home');
                        } catch (e: any) {
                          Alert.alert('Error', e.message);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Text className="text-red-400 font-bold">Delete Streak</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
