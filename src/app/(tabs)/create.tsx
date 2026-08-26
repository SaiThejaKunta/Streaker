// ============================================================
// STREAKER — Create Streak Screen
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Input, Button, Card, CoinDisplay, Modal, Avatar } from '../../../components/ui';
import { useStreakStore } from '../../../store/useStreakStore';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  STREAK_CATEGORIES,
  TARGET_DAY_OPTIONS,
  calculateBuyIn,
  APP_CONFIG,
} from '../../../utils/constants';
import { supabase } from '../../../lib/supabase';
import type { User, CreateStreakForm } from '../../../types';

export default function CreateStreakScreen() {
  const router = useRouter();
  const { createStreak, isLoading } = useStreakStore();
  const user = useAuthStore((s) => s.user);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [availableFriends, setAvailableFriends] = useState<User[]>([]);
  const [form, setForm] = useState<CreateStreakForm>({
    name: '',
    emoji: '🔥',
    description: '',
    target_days: 30,
    is_group: false,
    is_public: true,
    reminder_time: '20:00',
    invitee_ids: [],
  });

  const buyIn = calculateBuyIn(form.target_days);
  const canAfford = (user?.coin_balance || 0) >= buyIn;

  React.useEffect(() => {
    async function loadFriends() {
      if (form.is_group && availableFriends.length === 0) {
        const { data } = await supabase.from('profiles').select('*').neq('id', user?.id || '').limit(20);
        if (data) setAvailableFriends(data as User[]);
      }
    }
    loadFriends();
  }, [form.is_group]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      Alert.alert('Missing name', 'Give your streak a name!');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmCreate = async () => {
    setShowConfirmModal(false);
    try {
      const newStreak = await createStreak(form);
      
      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset form
      setForm({
        name: '',
        emoji: '🔥',
        description: '',
        target_days: 30,
        is_group: false,
        is_public: true,
        reminder_time: '20:00',
        invitee_ids: [],
      });
      
      router.push(`/streak/${newStreak.id}` as any);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const toggleInvitee = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      invitee_ids: prev.invitee_ids.includes(userId)
        ? prev.invitee_ids.filter((id) => id !== userId)
        : [...prev.invitee_ids, userId],
    }));
  };

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <Text className="text-white text-2xl font-bold">Create Streak 🔥</Text>
          <Text className="text-gray-400 text-sm mt-1">
            Start a new habit and commit to it
          </Text>
        </View>

        <View className="px-5">
          {/* Streak Type */}
          <Card className="mb-4">
            <Text className="text-white font-semibold mb-3">Streak Type</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center border ${
                  !form.is_group
                    ? 'bg-orange-500/20 border-orange-500'
                    : 'bg-[#252542] border-[#2A2A45]'
                }`}
                onPress={() => setForm((p) => ({ ...p, is_group: false }))}
              >
                <Text className="text-2xl mb-1">🧍</Text>
                <Text className={`text-sm font-medium ${!form.is_group ? 'text-orange-400' : 'text-gray-400'}`}>
                  Solo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center border ${
                  form.is_group
                    ? 'bg-orange-500/20 border-orange-500'
                    : 'bg-[#252542] border-[#2A2A45]'
                }`}
                onPress={() => setForm((p) => ({ ...p, is_group: true }))}
              >
                <Text className="text-2xl mb-1">👥</Text>
                <Text className={`text-sm font-medium ${form.is_group ? 'text-orange-400' : 'text-gray-400'}`}>
                  Group
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Category / Emoji Picker */}
          <Card className="mb-4">
            <Text className="text-white font-semibold mb-3">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {STREAK_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  className={`px-3 py-2 rounded-xl border ${
                    form.emoji === cat.emoji
                      ? 'bg-orange-500/20 border-orange-500'
                      : 'bg-[#252542] border-[#2A2A45]'
                  }`}
                  onPress={() =>
                    setForm((p) => ({
                      ...p,
                      emoji: cat.emoji,
                      name: p.name || cat.label,
                    }))
                  }
                >
                  <Text className="text-center text-lg">{cat.emoji}</Text>
                  <Text className={`text-[10px] text-center mt-0.5 ${form.emoji === cat.emoji ? 'text-orange-400' : 'text-gray-400'}`}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Name & Description */}
          <Input
            label="Streak Name"
            placeholder="e.g., Morning Gym, Learn German"
            value={form.name}
            onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
          />
          <Input
            label="Description (optional)"
            placeholder="What's this streak about?"
            value={form.description}
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            multiline
          />

          {/* Target Days */}
          <Card className="mb-4">
            <Text className="text-white font-semibold mb-3">Target Days</Text>
            <View className="flex-row flex-wrap gap-2">
              {TARGET_DAY_OPTIONS.map((days) => (
                <TouchableOpacity
                  key={days}
                  className={`px-5 py-2.5 rounded-xl border ${
                    form.target_days === days
                      ? 'bg-orange-500/20 border-orange-500'
                      : 'bg-[#252542] border-[#2A2A45]'
                  }`}
                  onPress={() => setForm((p) => ({ ...p, target_days: days }))}
                >
                  <Text className={`font-semibold ${form.target_days === days ? 'text-orange-400' : 'text-gray-300'}`}>
                    {days}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Privacy Toggle */}
          <Card className="mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold">Public Streak</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  Visible on your profile & friends' feeds
                </Text>
              </View>
              <Switch
                value={form.is_public}
                onValueChange={(v) => setForm((p) => ({ ...p, is_public: v }))}
                trackColor={{ false: '#2A2A45', true: '#FF6B35' }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          {/* Group: Invite Friends */}
          {form.is_group && (
            <Card className="mb-4">
              <Text className="text-white font-semibold mb-3">
                Invite Friends ({form.invitee_ids.length} selected)
              </Text>
              {availableFriends.map((friend) => {
                const isSelected = form.invitee_ids.includes(friend.id);
                return (
                  <TouchableOpacity
                    key={friend.id}
                    className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500/50'
                        : 'bg-[#252542] border-transparent'
                    }`}
                    onPress={() => toggleInvitee(friend.id)}
                  >
                    <Avatar
                      uri={friend.avatar_url}
                      name={friend.display_name}
                      size="sm"
                      className="mr-3"
                    />
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium">
                        {friend.display_name}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        @{friend.username}
                      </Text>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        isSelected
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-gray-500'
                      }`}
                    >
                      {isSelected && (
                        <Text className="text-white text-xs">✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>
          )}

          {/* Coin Buy-In Info */}
          <Card className="mb-4 bg-amber-500/5 border-amber-500/30">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl mr-2">🪙</Text>
              <Text className="text-amber-400 font-bold text-lg">
                Coin Investment
              </Text>
            </View>
            <Text className="text-gray-300 text-sm leading-5">
              {form.is_group ? 'Each member invests ' : 'You invest '}
              <Text className="text-amber-400 font-bold">{buyIn} coins</Text>
              {' '}({form.target_days} days × 10 coins).
            </Text>
            <Text className="text-gray-400 text-xs mt-2">
              Complete daily to earn back + bonus. Miss a day and your remaining coins get shared!
            </Text>
            {!canAfford && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-3">
                <Text className="text-red-400 text-sm">
                  ⚠️ You need {buyIn - (user?.coin_balance || 0)} more coins for this streak
                </Text>
              </View>
            )}
          </Card>

          {/* Create Button */}
          <Button
            title={`Create & Invest ${buyIn} 🪙`}
            onPress={handleCreate}
            loading={isLoading}
            disabled={!canAfford || !form.name.trim()}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Streak"
      >
        <View className="items-center mb-4">
          <Text className="text-5xl mb-3">{form.emoji}</Text>
          <Text className="text-white text-xl font-bold">{form.name}</Text>
          <Text className="text-gray-400 mt-1">
            {form.target_days} days · {form.is_group ? 'Group' : 'Solo'} · {form.is_public ? 'Public' : 'Private'}
          </Text>
        </View>
        <View className="bg-amber-500/10 rounded-xl p-3 mb-4">
          <Text className="text-amber-400 text-center font-semibold">
            Investment: {buyIn} 🪙
          </Text>
        </View>
        <View className="flex-row gap-3">
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setShowConfirmModal(false)}
            className="flex-1"
          />
          <Button
            title="Let's Go! 🔥"
            onPress={confirmCreate}
            loading={isLoading}
            className="flex-1"
          />
        </View>
      </Modal>
    </View>
  );
}
