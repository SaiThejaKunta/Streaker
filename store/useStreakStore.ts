// ============================================================
// STREAKER — Streak Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type {
  Streak, StreakMember, CheckIn, CreateStreakForm, CalendarDay,
} from '../types';
import {
  MOCK_STREAKS, MOCK_STREAK_MEMBERS, MOCK_CHECK_INS,
  MOCK_CURRENT_USER, MOCK_USERS,
} from '../utils/mockData';
import {
  generateId, getToday, addDays, buildCalendarDays,
} from '../utils/helpers';
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
  createStreak: (form: CreateStreakForm) => Promise<Streak>;
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
    set({ isLoading: true });
    try {
      // TODO: Replace with Supabase query
      await new Promise((r) => setTimeout(r, 500));
      set({
        streaks: MOCK_STREAKS,
        streakMembers: MOCK_STREAK_MEMBERS,
        checkIns: MOCK_CHECK_INS,
        isLoading: false,
      });
    } catch (err: any) {
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
    const allUsers = [MOCK_CURRENT_USER, ...MOCK_USERS];
    return {
      ...streak,
      members: streakMembers
        .filter((sm) => sm.streak_id === id)
        .map((sm) => ({
          ...sm,
          user: allUsers.find((u) => u.id === sm.user_id),
        })),
    };
  },

  getStreakMembers: (streakId: string) => {
    const { streakMembers } = get();
    const allUsers = [MOCK_CURRENT_USER, ...MOCK_USERS];
    return streakMembers
      .filter((sm) => sm.streak_id === streakId)
      .map((sm) => ({
        ...sm,
        user: allUsers.find((u) => u.id === sm.user_id),
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
    return buildCalendarDays(streak.start_date, streak.target_days, userCheckIns);
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

  createStreak: async (form: CreateStreakForm) => {
    set({ isLoading: true });
    try {
      await new Promise((r) => setTimeout(r, 600));
      const userId = useAuthStore.getState().user?.id || 'user-001';
      const buyIn = form.is_group ? calculateBuyIn(form.target_days) : 0;

      const newStreak: Streak = {
        id: `streak-${generateId()}`,
        creator_id: userId,
        name: form.name,
        emoji: form.emoji,
        description: form.description || null,
        target_days: form.target_days,
        coin_buy_in: buyIn,
        is_group: form.is_group,
        is_public: form.is_public,
        reminder_time: form.reminder_time,
        status: 'active',
        start_date: getToday(),
        end_date: null,
        created_at: new Date().toISOString(),
      };

      const newMember: StreakMember = {
        id: `sm-${generateId()}`,
        streak_id: newStreak.id,
        user_id: userId,
        coins_invested: buyIn,
        coins_earned: 0,
        current_streak_count: 0,
        is_active: true,
        joined_at: new Date().toISOString(),
      };

      // Deduct coins
      if (buyIn > 0) {
        useAuthStore.getState().updateCoinBalance(-buyIn);
      }

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

  checkIn: async (streakId: string, proofImageUrl?: string, note?: string) => {
    try {
      await new Promise((r) => setTimeout(r, 400));
      const userId = useAuthStore.getState().user?.id || 'user-001';
      const streak = get().streaks.find((s) => s.id === streakId);
      const member = get().streakMembers.find(
        (sm) => sm.streak_id === streakId && sm.user_id === userId
      );

      if (!streak || !member) throw new Error('Streak not found');
      if (get().hasCheckedInToday(streakId, userId)) {
        throw new Error('Already checked in today');
      }

      const newStreakCount = member.current_streak_count + 1;
      const coinsEarned = calculateDailyReward(newStreakCount, streak.is_group);

      const newCheckIn: CheckIn = {
        id: `ci-${generateId()}`,
        streak_id: streakId,
        user_id: userId,
        check_in_date: getToday(),
        proof_image_url: proofImageUrl || null,
        note: note || null,
        coins_earned: coinsEarned,
        created_at: new Date().toISOString(),
      };

      // Update member's streak count and coins
      set((state) => ({
        checkIns: [newCheckIn, ...state.checkIns],
        streakMembers: state.streakMembers.map((sm) =>
          sm.id === member.id
            ? {
                ...sm,
                current_streak_count: newStreakCount,
                coins_earned: sm.coins_earned + coinsEarned,
              }
            : sm
        ),
      }));

      // Update user coin balance
      useAuthStore.getState().updateCoinBalance(coinsEarned);

      return newCheckIn;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
