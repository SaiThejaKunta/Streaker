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
import { STREAK_CATEGORIES, REACTION_EMOJIS } from '../../../utils/constants';
import { getRelativeTime } from '../../../utils/helpers';
import type { LeaderboardEntry, Activity, User } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { useActivityStore } from '../../../store/useActivityStore';

type Tab = 'leaderboard' | 'feed' | 'discover';

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<User[]>([]);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    let channel: any;

    try {
      if (activeTab === 'leaderboard') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('coin_balance', { ascending: false })
          .limit(50);
        
        if (data) {
          const lb = data.map((u, i) => ({
            rank: i + 1,
            user: u as User,
            streak_count: 0, // Would need aggregate query for real counts
            completion_rate: 100,
            coins_earned: u.coin_balance
          }));
          setLeaderboard(lb);
        }
      } else if (activeTab === 'feed') {
        const { data } = await supabase
          .from('activities')
          .select('*, user:profiles(*)')
          .order('created_at', { ascending: false })
          .limit(50);
        if (data) setActivities(data);

        // Realtime Subscription
        channel = supabase.channel(`explore_feed_${Date.now()}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'activities' },
            async (payload) => {
              // Fetch user details for the new activity
              const { data: userData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', payload.new.user_id)
                .single();
              
              const newActivity = { ...payload.new, user: userData };
              setActivities((prev) => [newActivity, ...prev]);
            }
          )
          .subscribe();
      } else if (activeTab === 'discover') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUser?.id || '')
          .limit(20);
        if (data) setDiscoverUsers(data as User[]);
      }
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  };

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
        {activeTab === 'leaderboard' && <LeaderboardTab data={leaderboard} currentUser={currentUser} />}
        {activeTab === 'feed' && <FeedTab activities={activities} setActivities={setActivities} />}
        {activeTab === 'discover' && <DiscoverTab users={discoverUsers} />}
      </ScrollView>
    </View>
  );
}

// ---- Leaderboard ----
function LeaderboardTab({ data, currentUser }: { data: LeaderboardEntry[], currentUser: User | null }) {
  if (data.length === 0) return <View className="px-5 py-10 items-center"><Text className="text-gray-500">Loading...</Text></View>;
  
  return (
    <View className="px-5">
      <SectionHeader title="Global Leaderboard" />

      {/* Top 3 Podium */}
      <View className="flex-row items-end justify-center mb-6 gap-3">
        {[data[1], data[0], data[2]].filter(Boolean).map(
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
      {data.map((entry) => (
        <LeaderboardRow key={entry.rank} entry={entry} currentUser={currentUser} />
      ))}
    </View>
  );
}

function LeaderboardRow({ entry, currentUser }: { entry: LeaderboardEntry, currentUser: User | null }) {
  const isCurrentUser = entry.user.id === currentUser?.id;
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
function FeedTab({ activities, setActivities }: { activities: any[], setActivities: (val: any) => void }) {
  const { verifyCheckIn, invitations, acceptInvitation, declineInvitation, loadInvitations } = useActivityStore();
  const currentUser = useAuthStore(s => s.user);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleVerify = async (id: string, approve: boolean) => {
    setLoadingId(id);
    try {
      await verifyCheckIn(id, approve);
      
      // Optimistically update the UI so it reflects instantly without waiting for a re-fetch
      setActivities(prev => prev.map(a => 
        a.id === id 
          ? { ...a, data: { ...a.data, completed: true, result: approve ? 'approved' : 'rejected' } }
          : a
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View className="px-5">
      {/* Invitations Section */}
      {invitations.length > 0 && (
        <View className="mb-6">
          <SectionHeader title="Pending Invites" />
          {invitations.map((inv) => (
            <Card key={inv.id} className="mb-3 bg-amber-500/10 border-amber-500/30">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <Avatar uri={inv.inviter?.avatar_url} name={inv.inviter?.display_name || 'User'} size="sm" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{inv.inviter?.display_name} invited you</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">to join "{inv.streak?.name}"</Text>
                  </View>
                </View>
                <Text className="text-2xl">{inv.streak?.emoji}</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="bg-[#252542] px-3 py-2 rounded-lg flex-1 items-center border border-gray-600"
                  onPress={() => declineInvitation(inv.id)}
                >
                  <Text className="text-gray-300 font-medium">Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-orange-500 px-3 py-2 rounded-lg flex-1 items-center"
                  onPress={() => acceptInvitation(inv.id)}
                >
                  <Text className="text-white font-medium">Accept</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      <SectionHeader title="Friends Activity" />
      {activities.length === 0 ? (
        <View className="py-10 items-center"><Text className="text-gray-500">No activity yet.</Text></View>
      ) : activities.map((activity) => {
        const user = activity.user;
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
                    {activity.type === 'verification_request' && 'needs verification'}
                    {activity.type === 'missed' && 'missed a day'}
                    {activity.type === 'milestone' && 'hit a milestone'}
                    {activity.type === 'streak_created' && 'created a streak'}
                    {activity.type === 'joined' && 'joined a streak'}
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
                {activity.type === 'verification_request' && !activity.data?.completed && activity.user_id !== currentUser?.id && (
                  <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                      className="bg-[#252542] px-3 py-1.5 rounded-lg flex-1 items-center border border-gray-600"
                      onPress={() => handleVerify(activity.id, false)}
                      disabled={loadingId === activity.id}
                    >
                      <Text className="text-gray-300 font-medium">Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-orange-500/20 px-3 py-1.5 rounded-lg flex-1 items-center border border-orange-500/50"
                      onPress={() => handleVerify(activity.id, true)}
                      disabled={loadingId === activity.id}
                    >
                      <Text className="text-orange-400 font-medium">Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {activity.type === 'verification_request' && activity.data?.completed && (
                  <Text className={`text-sm mt-2 font-medium ${activity.data.result === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                    {activity.data.result === 'approved' ? '✓ Verified by group' : '❌ Rejected by group'}
                  </Text>
                )}
                {activity.type === 'verification_request' && !activity.data?.completed && activity.user_id === currentUser?.id && (
                  <Text className="text-amber-400 text-sm mt-2">⏳ Waiting for group verification</Text>
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
function DiscoverTab({ users }: { users: User[] }) {
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
      {users.map((user) => (
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
