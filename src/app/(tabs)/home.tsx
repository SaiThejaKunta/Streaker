// ============================================================
// STREAKER — Home Dashboard
// ============================================================

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { useStreakStore } from '../../../store/useStreakStore';
import {
  Card,
  CoinDisplay,
  SectionHeader,
  EmptyState,
  Badge,
} from '../../../components/ui';
import { StreakCard } from '../../../components/ui/StreakCard';
import { getTodaysQuote, formatNumber } from '../../../utils/helpers';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { loadStreaks, getMyStreaks, isLoading, checkIns } = useStreakStore();

  useFocusEffect(
    React.useCallback(() => {
      loadStreaks();
    }, [])
  );

  const myStreaks = getMyStreaks();
  const groupStreaks = myStreaks.filter((s) => s.is_group);
  const soloStreaks = myStreaks.filter((s) => !s.is_group);
  const quote = useMemo(() => getTodaysQuote(), []);
  
  const stats = useMemo(() => {
    let longest_streak = 0;
    let total_coins_earned = 0;
    
    myStreaks.forEach((s: any) => {
      const myMem = s.my_membership;
      if (myMem) {
        if (myMem.longest_count > longest_streak) longest_streak = myMem.longest_count;
        total_coins_earned += myMem.coins_earned;
      }
    });

    return {
      active_streaks: myStreaks.length,
      total_check_ins: checkIns.filter(c => c.user_id === user?.id).length,
      total_coins_earned,
      longest_streak,
      achievements_unlocked: 0,
    };
  }, [myStreaks, checkIns, user?.id]);

  const handleRefresh = () => {
    loadStreaks();
  };

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FF6B35"
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-400 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              <Text className="text-white text-2xl font-bold mt-1">
                Hey, {user?.display_name?.split(' ')[0] || 'Streaker'} 👋
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/settings' as any)}
              className="w-10 h-10 rounded-full bg-[#1A1A2E] items-center justify-center border border-[#2A2A45]"
            >
              <Text className="text-lg">⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coin Balance Card */}
        <View className="px-5 mb-5">
          <Card className="bg-gradient-to-r overflow-hidden">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  Your Balance
                </Text>
                <View className="flex-row items-center mt-2">
                  <Text className="text-3xl mr-2">🪙</Text>
                  <Text className="text-amber-400 text-3xl font-bold">
                    {user?.coin_balance?.toLocaleString() || '1,000'}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Badge label={`🔥 ${stats.longest_streak}d best`} variant="warning" size="md" />
              </View>
            </View>

            {/* Quick Stats Row */}
            <View className="flex-row mt-4 pt-4 border-t border-[#2A2A45]">
              <View className="flex-1 items-center">
                <Text className="text-white text-lg font-bold">{stats.active_streaks}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Active</Text>
              </View>
              <View className="w-px bg-[#2A2A45]" />
              <View className="flex-1 items-center">
                <Text className="text-white text-lg font-bold">{stats.total_check_ins}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Check-ins</Text>
              </View>
              <View className="w-px bg-[#2A2A45]" />
              <View className="flex-1 items-center">
                <Text className="text-white text-lg font-bold">{formatNumber(stats.total_coins_earned)}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Earned</Text>
              </View>
              <View className="w-px bg-[#2A2A45]" />
              <View className="flex-1 items-center">
                <Text className="text-white text-lg font-bold">{stats.achievements_unlocked}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Badges</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Daily Quote */}
        <View className="px-5 mb-5">
          <Card className="border-l-4 border-l-orange-500">
            <Text className="text-gray-300 text-sm italic leading-5">
              "{quote.text}"
            </Text>
            <Text className="text-gray-500 text-xs mt-2">— {quote.author}</Text>
          </Card>
        </View>

        {/* Group Streaks */}
        {groupStreaks.length > 0 && (
          <View className="px-5 mb-2">
            <SectionHeader
              title="👥 Group Streaks"
              action={{
                label: 'See All',
                onPress: () => {},
              }}
            />
            {groupStreaks.map((streak) => (
              <StreakCard key={streak.id} streak={streak} />
            ))}
          </View>
        )}

        {/* Solo Streaks */}
        {soloStreaks.length > 0 && (
          <View className="px-5 mb-2">
            <SectionHeader title="🧍 Solo Streaks" />
            {soloStreaks.map((streak) => (
              <StreakCard key={streak.id} streak={streak} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {myStreaks.length === 0 && (
          <View className="px-5">
            <EmptyState
              emoji="🔥"
              title="No Streaks Yet"
              description="Create your first streak and start building life-changing habits!"
              action={
                <TouchableOpacity
                  className="bg-orange-500 px-8 py-3 rounded-2xl"
                  onPress={() => router.push('/(tabs)/create' as any)}
                >
                  <Text className="text-white font-semibold">Create a Streak</Text>
                </TouchableOpacity>
              }
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
