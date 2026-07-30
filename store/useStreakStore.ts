// ============================================================
// STREAKER — Streak Store (Zustand + Supabase)
// ============================================================

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Streak, StreakMember, CheckIn, CreateStreakForm, CalendarDay } from '../types';
import { getToday, buildCalendarDays } from '../utils/helpers';
import { calculateBuyIn, calculateDailyReward } from '../utils/constants';
import { useAuthStore } from './useAuthStore';

interface StreakState {
  streaks: Streak[];
  streakMembers: StreakMember[];
  checkIns: CheckIn[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStreaks: () => Promise<void>;
  getMyStreaks: () => Streak[];
  getStreakById: (id: string) => Streak | undefined;
  getStreakMembers: (streakId: string) => StreakMember[];
  getStreakCheckIns: (streakId: string) => CheckIn[];
  getUserCheckIns: (streakId: string, userId: string) => CheckIn[];
  getCalendarDays: (streakId: string, userId: string) => CalendarDay[];
  hasCheckedInToday: (streakId: string, userId: string) => boolean;
  getTodayCheckInStatus: (streakId: string, userId: string) => 'pending' | 'verified' | 'rejected' | null;
  createStreak: (form: CreateStreakForm) => Promise<Streak>;
  deleteStreak: (streakId: string) => Promise<void>;
  checkIn: (streakId: string, proofImageUrl?: string, note?: string) => Promise<CheckIn>;
  clearError: () => void;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  streaks: [],
  streakMembers: [],
  checkIns: [],
  isLoading: false,
  error: null,

  loadStreaks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ streaks: [], streakMembers: [], checkIns: [], isLoading: false });
        return;
      }

      // 1. Fetch memberships for current user
      const { data: myMemberships, error: memErr } = await supabase
        .from('streak_members')
        .select('*')
        .eq('user_id', user.id);
      
      if (memErr) throw memErr;

      // 2. Fetch the actual streaks they belong to
      const streakIds = myMemberships?.map((m: any) => m.streak_id) || [];
      let streaksData: any[] = [];
      let allMembersData: any[] = [];
      let checkInsData: any[] = [];

      if (streakIds.length > 0) {
        // Streaks
        const { data: sData, error: sErr } = await supabase
          .from('streaks')
          .select('*')
          .in('id', streakIds);
        if (sErr) throw sErr;
        streaksData = (sData || []).map((s: any) => ({
          ...s,
          start_date: s.created_at.split('T')[0],
          coin_buy_in: s.buy_in || 0
        }));

        // All members for those streaks (to show leaderboards/friends)
        const { data: mData, error: mErr } = await supabase
          .from('streak_members')
          .select('*, user:profiles(*)')
          .in('streak_id', streakIds);
        if (mErr) throw mErr;
        allMembersData = mData || [];

        // Check-ins for those streaks (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: cData, error: cErr } = await supabase
          .from('check_ins')
          .select('*')
          .in('streak_id', streakIds)
          .gte('created_at', thirtyDaysAgo.toISOString());
        if (cErr) throw cErr;
        
        // Map created_at to check_in_date for local compat
        checkInsData = (cData || []).map((c: any) => ({
          ...c,
          check_in_date: c.created_at.split('T')[0]
        }));
      }

      set({
        streaks: streaksData,
        streakMembers: allMembersData.map((m: any) => ({
          id: m.id,
          streak_id: m.streak_id,
          user_id: m.user_id,
          coins_invested: 0,
          coins_earned: 0,
          current_streak_count: m.current_count,
          longest_count: m.longest_count || 0,
          is_active: m.status === 'active',
          joined_at: m.joined_at,
          user: m.user
        })),
        checkIns: checkInsData,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('loadStreaks error', err);
      set({ error: err.message, isLoading: false });
    }
  },

  getMyStreaks: () => {
    const { streaks, streakMembers } = get();
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return [];
    const myStreakIds = new Set(
      streakMembers.filter((sm) => sm.user_id === userId).map((sm) => sm.streak_id)
    );
    return streaks
      .filter((s) => myStreakIds.has(s.id))
      .map((s) => ({
        ...s,
        members: streakMembers.filter((sm) => sm.streak_id === s.id),
        my_membership: streakMembers.find(
          (sm) => sm.streak_id === s.id && sm.user_id === userId
        ),
      }));
  },

  getStreakById: (id: string) => {
    const { streaks, streakMembers } = get();
    const streak = streaks.find((s) => s.id === id);
    if (!streak) return undefined;
    return {
      ...streak,
      members: streakMembers.filter((sm) => sm.streak_id === id),
    };
  },

  getStreakMembers: (streakId: string) => {
    const { streakMembers } = get();
    return streakMembers
      .filter((sm) => sm.streak_id === streakId)
      .map((sm) => ({
        ...sm,
        today_checked_in: get().hasCheckedInToday(streakId, sm.user_id),
      }));
  },

  getStreakCheckIns: (streakId: string) => {
    return get().checkIns.filter((ci) => ci.streak_id === streakId);
  },

  getUserCheckIns: (streakId: string, userId: string) => {
    return get().checkIns.filter(
      (ci) => ci.streak_id === streakId && ci.user_id === userId
    );
  },

  getCalendarDays: (streakId: string, userId: string) => {
    const streak = get().streaks.find((s) => s.id === streakId);
    if (!streak) return [];
    const userCheckIns = get().getUserCheckIns(streakId, userId);
    return buildCalendarDays(streak.created_at || getToday(), streak.target_days, userCheckIns);
  },

  hasCheckedInToday: (streakId: string, userId: string) => {
    const today = getToday();
    return get().checkIns.some(
      (ci) =>
        ci.streak_id === streakId &&
        ci.user_id === userId &&
        ci.check_in_date === today
    );
  },

  getTodayCheckInStatus: (streakId: string, userId: string) => {
    const today = getToday();
    const checkIn = get().checkIns.find(
      (ci) =>
        ci.streak_id === streakId &&
        ci.user_id === userId &&
        ci.check_in_date === today
    );
    return checkIn ? checkIn.status : null;
  },

  createStreak: async (form: CreateStreakForm) => {
    set({ isLoading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      const buyIn = form.is_group ? calculateBuyIn(form.target_days) : 0;
      if (user.coin_balance < buyIn) {
        throw new Error('Not enough coins for buy-in');
      }

      // 1. Create Streak
      const { data: streakData, error: streakErr } = await supabase
        .from('streaks')
        .insert({
          name: form.name,
          description: form.description,
          emoji: form.emoji,
          category: 'custom',
          target_days: form.target_days,
          is_group: form.is_group,
          buy_in: buyIn,
          created_by: user.id
        })
        .select()
        .single();
      
      if (streakErr) throw streakErr;

      // 2. Add Member
      const { data: memberData, error: memErr } = await supabase
        .from('streak_members')
        .insert({
          streak_id: streakData.id,
          user_id: user.id,
          role: 'creator',
          current_count: 0,
        })
        .select('*, user:profiles(*)')
        .single();

      if (memErr) throw memErr;

      // 3. Activity feed
      await supabase.from('activities').insert({
        user_id: user.id,
        streak_id: streakData.id,
        type: 'joined',
      });

      // 4. Create Invitations
      if (form.is_group && form.invitee_ids && form.invitee_ids.length > 0) {
        const invites = form.invitee_ids.map(inviteeId => ({
          streak_id: streakData.id,
          inviter_id: user.id,
          invitee_id: inviteeId,
          status: 'pending'
        }));
        
        const { error: inviteErr } = await supabase
          .from('invitations')
          .insert(invites);
          
        if (inviteErr) {
          console.error("Error sending invitations:", inviteErr);
        }
      }

      // Deduct coins if group buy-in
      if (buyIn > 0) {
        await useAuthStore.getState().updateCoinBalance(-buyIn);
      }

      // Format for local state
      const newStreak = {
        ...streakData,
        start_date: streakData.created_at.split('T')[0],
        coin_buy_in: streakData.buy_in || 0
      } as Streak;
      const newMember: StreakMember = {
        id: memberData.id,
        streak_id: memberData.streak_id,
        user_id: memberData.user_id,
        coins_invested: buyIn,
        coins_earned: 0,
        current_streak_count: 0,
        longest_count: 0,
        is_active: true,
        joined_at: memberData.joined_at,
        user: memberData.user
      };

      set((state) => ({
        streaks: [newStreak, ...state.streaks],
        streakMembers: [newMember, ...state.streakMembers],
        isLoading: false,
      }));

      return newStreak;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteStreak: async (streakId: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('delete_streak', { p_streak_id: streakId });
      
      if (error) throw error;

      // Update local state
      set((state) => ({
        streaks: state.streaks.filter((s) => s.id !== streakId),
        streakMembers: state.streakMembers.filter((m) => m.streak_id !== streakId),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  checkIn: async (streakId: string, proofImageUrl?: string, note?: string) => {
    set({ error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      const streak = get().streaks.find((s) => s.id === streakId);
      const member = get().streakMembers.find(
        (sm) => sm.streak_id === streakId && sm.user_id === user.id
      );

      if (!streak || !member) throw new Error('Streak not found');
      if (get().hasCheckedInToday(streakId, user.id)) {
        throw new Error('Already checked in today');
      }

      const newStreakCount = member.current_streak_count + 1;
      const coinsEarned = calculateDailyReward(newStreakCount, streak.is_group);

      const isGroup = streak.is_group;
      const initialStatus = isGroup ? 'pending' : 'verified';

      // 1. Insert Check-in
      const { data: checkInData, error: checkInErr } = await supabase
        .from('check_ins')
        .insert({
          streak_id: streakId,
          user_id: user.id,
          note: note,
          status: initialStatus
        })
        .select()
        .single();
      
      if (checkInErr) throw checkInErr;

      const newCheckIn: CheckIn = {
        ...checkInData,
        check_in_date: checkInData.created_at.split('T')[0],
      } as CheckIn;

      // Update local state for check-in immediately so UI reflects it
      set((state) => ({
        checkIns: [newCheckIn, ...state.checkIns]
      }));

      if (isGroup) {
        // Just insert a verification request activity, do NOT update counts/coins yet
        await supabase.from('activities').insert({
          user_id: user.id,
          streak_id: streakId,
          type: 'verification_request',
          data: { check_in_id: checkInData.id, note }
        });
      } else {
        // Solo streak: instantly verify
        // 2. Update Streak Member
        const { error: upMemErr } = await supabase
          .from('streak_members')
          .update({
            current_count: newStreakCount,
            longest_count: Math.max(member.longest_count || 0, newStreakCount)
          })
          .eq('id', member.id);
        
        if (upMemErr) throw upMemErr;

        // 3. Activity feed
        await supabase.from('activities').insert({
          user_id: user.id,
          streak_id: streakId,
          type: 'check_in',
          data: { note, coins: coinsEarned }
        });

        // Update local state for counts/coins
        set((state) => ({
          streakMembers: state.streakMembers.map((sm) =>
            sm.id === member.id
              ? {
                  ...sm,
                  current_streak_count: newStreakCount,
                  coins_earned: sm.coins_earned + coinsEarned,
                  longest_count: Math.max(sm.longest_count || 0, newStreakCount)
                }
              : sm
          ),
        }));

        // Update user coin balance
        await useAuthStore.getState().updateCoinBalance(coinsEarned);
      }

      return newCheckIn;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
