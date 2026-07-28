// ============================================================
// STREAKER — Mock Data for Development
// ============================================================
// This file provides realistic mock data so the app works
// without a Supabase backend. Replace with real API calls later.

import type {
  User, Streak, StreakMember, CheckIn, CoinTransaction,
  Activity, Invitation, LeaderboardEntry, UserStats
} from '../types';
import { generateId, getToday, addDays, formatDate } from './helpers';
import { COINS } from './constants';

// ---- Current User ----
export const MOCK_CURRENT_USER: User = {
  id: 'user-001',
  username: 'streaker_king',
  display_name: 'Alex Champion',
  avatar_url: null,
  bio: '🔥 Building habits, one day at a time',
  coin_balance: 1000,
  is_public: true,
  created_at: '2026-07-01T10:00:00Z',
  updated_at: '2026-07-28T10:00:00Z',
};

// ---- Friends ----
export const MOCK_USERS: User[] = [
  {
    id: 'user-002',
    username: 'fitness_freak',
    display_name: 'Sarah Miller',
    avatar_url: null,
    bio: '💪 Never miss a workout',
    coin_balance: 2350,
    is_public: true,
    created_at: '2026-06-15T08:00:00Z',
    updated_at: '2026-07-28T08:00:00Z',
  },
  {
    id: 'user-003',
    username: 'code_ninja',
    display_name: 'Raj Patel',
    avatar_url: null,
    bio: '💻 100 days of code or bust',
    coin_balance: 1800,
    is_public: true,
    created_at: '2026-06-20T09:00:00Z',
    updated_at: '2026-07-28T09:00:00Z',
  },
  {
    id: 'user-004',
    username: 'zen_master',
    display_name: 'Lisa Chen',
    avatar_url: null,
    bio: '🧘 Mindfulness daily',
    coin_balance: 3100,
    is_public: true,
    created_at: '2026-06-10T07:00:00Z',
    updated_at: '2026-07-28T07:00:00Z',
  },
  {
    id: 'user-005',
    username: 'book_worm',
    display_name: 'Mike Johnson',
    avatar_url: null,
    bio: '📚 Reading 1 book per week',
    coin_balance: 900,
    is_public: false,
    created_at: '2026-07-05T11:00:00Z',
    updated_at: '2026-07-28T11:00:00Z',
  },
];

// ---- Helper to generate check-ins for past days ----
function generateCheckIns(
  streakId: string,
  userId: string,
  startDate: string,
  daysDone: number,
  missedDays: number[] = []
): CheckIn[] {
  const checkIns: CheckIn[] = [];
  for (let i = 0; i < daysDone; i++) {
    if (missedDays.includes(i)) continue;
    const date = addDays(startDate, i);
    if (date > getToday()) break;
    checkIns.push({
      id: generateId(),
      streak_id: streakId,
      user_id: userId,
      check_in_date: date,
      proof_image_url: null,
      note: i === 0 ? 'Day 1! Let\'s go 🔥' : null,
      coins_earned: 10 + Math.floor(i / 7) * 2,
      created_at: `${date}T18:00:00Z`,
    });
  }
  return checkIns;
}

// ---- Streaks ----
const gymStartDate = addDays(getToday(), -12); // Started 12 days ago

export const MOCK_STREAKS: Streak[] = [
  {
    id: 'streak-001',
    creator_id: 'user-001',
    name: 'Morning Gym',
    emoji: '💪',
    description: 'Hit the gym every morning before work',
    target_days: 30,
    coin_buy_in: 300,
    is_group: true,
    is_public: true,
    reminder_time: '06:00',
    status: 'active',
    start_date: gymStartDate,
    end_date: null,
    created_at: `${gymStartDate}T10:00:00Z`,
  },
  {
    id: 'streak-002',
    creator_id: 'user-001',
    name: 'Learn German',
    emoji: '🌍',
    description: 'Duolingo + 30min study daily',
    target_days: 60,
    coin_buy_in: 0,
    is_group: false,
    is_public: true,
    reminder_time: '20:00',
    status: 'active',
    start_date: addDays(getToday(), -5),
    end_date: null,
    created_at: `${addDays(getToday(), -5)}T10:00:00Z`,
  },
  {
    id: 'streak-003',
    creator_id: 'user-003',
    name: '100 Days of Code',
    emoji: '💻',
    description: 'Code for at least 1 hour every day',
    target_days: 100,
    coin_buy_in: 1000,
    is_group: true,
    is_public: true,
    reminder_time: '21:00',
    status: 'active',
    start_date: addDays(getToday(), -20),
    end_date: null,
    created_at: `${addDays(getToday(), -20)}T10:00:00Z`,
  },
  {
    id: 'streak-004',
    creator_id: 'user-004',
    name: 'Daily Meditation',
    emoji: '🧘',
    description: '15 minutes of mindfulness meditation',
    target_days: 21,
    coin_buy_in: 210,
    is_group: true,
    is_public: true,
    reminder_time: '07:00',
    status: 'active',
    start_date: addDays(getToday(), -8),
    end_date: null,
    created_at: `${addDays(getToday(), -8)}T10:00:00Z`,
  },
];

// ---- Streak Members ----
export const MOCK_STREAK_MEMBERS: StreakMember[] = [
  // Morning Gym (4 members)
  { id: 'sm-001', streak_id: 'streak-001', user_id: 'user-001', coins_invested: 300, coins_earned: 130, current_streak_count: 12, is_active: true, joined_at: `${gymStartDate}T10:00:00Z` },
  { id: 'sm-002', streak_id: 'streak-001', user_id: 'user-002', coins_invested: 300, coins_earned: 130, current_streak_count: 12, is_active: true, joined_at: `${gymStartDate}T10:05:00Z` },
  { id: 'sm-003', streak_id: 'streak-001', user_id: 'user-003', coins_invested: 300, coins_earned: 100, current_streak_count: 9, is_active: true, joined_at: `${gymStartDate}T10:10:00Z` },
  { id: 'sm-004', streak_id: 'streak-001', user_id: 'user-004', coins_invested: 300, coins_earned: 80, current_streak_count: 0, is_active: false, joined_at: `${gymStartDate}T10:15:00Z` },

  // Learn German (solo)
  { id: 'sm-005', streak_id: 'streak-002', user_id: 'user-001', coins_invested: 0, coins_earned: 25, current_streak_count: 5, is_active: true, joined_at: `${addDays(getToday(), -5)}T10:00:00Z` },

  // 100 Days of Code (3 members)
  { id: 'sm-006', streak_id: 'streak-003', user_id: 'user-003', coins_invested: 1000, coins_earned: 220, current_streak_count: 20, is_active: true, joined_at: `${addDays(getToday(), -20)}T10:00:00Z` },
  { id: 'sm-007', streak_id: 'streak-003', user_id: 'user-001', coins_invested: 1000, coins_earned: 180, current_streak_count: 17, is_active: true, joined_at: `${addDays(getToday(), -20)}T10:05:00Z` },
  { id: 'sm-008', streak_id: 'streak-003', user_id: 'user-005', coins_invested: 1000, coins_earned: 150, current_streak_count: 14, is_active: true, joined_at: `${addDays(getToday(), -20)}T10:10:00Z` },

  // Daily Meditation (3 members)
  { id: 'sm-009', streak_id: 'streak-004', user_id: 'user-004', coins_invested: 210, coins_earned: 86, current_streak_count: 8, is_active: true, joined_at: `${addDays(getToday(), -8)}T10:00:00Z` },
  { id: 'sm-010', streak_id: 'streak-004', user_id: 'user-002', coins_invested: 210, coins_earned: 86, current_streak_count: 8, is_active: true, joined_at: `${addDays(getToday(), -8)}T10:05:00Z` },
  { id: 'sm-011', streak_id: 'streak-004', user_id: 'user-001', coins_invested: 210, coins_earned: 70, current_streak_count: 6, is_active: true, joined_at: `${addDays(getToday(), -8)}T10:10:00Z` },
];

// ---- Check-ins ----
export const MOCK_CHECK_INS: CheckIn[] = [
  ...generateCheckIns('streak-001', 'user-001', gymStartDate, 12),
  ...generateCheckIns('streak-001', 'user-002', gymStartDate, 12),
  ...generateCheckIns('streak-001', 'user-003', gymStartDate, 12, [3, 7, 10]),
  ...generateCheckIns('streak-002', 'user-001', addDays(getToday(), -5), 5),
  ...generateCheckIns('streak-003', 'user-001', addDays(getToday(), -20), 20, [5, 12, 15]),
  ...generateCheckIns('streak-004', 'user-001', addDays(getToday(), -8), 8, [3, 6]),
];

// ---- Coin Transactions ----
export const MOCK_TRANSACTIONS: CoinTransaction[] = [
  { id: 't-001', user_id: 'user-001', amount: 1000, type: 'signup_bonus', streak_id: null, description: 'Welcome to STREAKER! 🎉', created_at: '2026-07-01T10:00:00Z' },
  { id: 't-002', user_id: 'user-001', amount: -300, type: 'buy_in', streak_id: 'streak-001', description: 'Joined Morning Gym streak', created_at: `${gymStartDate}T10:00:00Z` },
  { id: 't-003', user_id: 'user-001', amount: 10, type: 'daily_reward', streak_id: 'streak-001', description: 'Day 1 check-in', created_at: `${gymStartDate}T18:00:00Z` },
  { id: 't-004', user_id: 'user-001', amount: -1000, type: 'buy_in', streak_id: 'streak-003', description: 'Joined 100 Days of Code', created_at: `${addDays(getToday(), -20)}T10:05:00Z` },
  { id: 't-005', user_id: 'user-001', amount: -210, type: 'buy_in', streak_id: 'streak-004', description: 'Joined Daily Meditation', created_at: `${addDays(getToday(), -8)}T10:10:00Z` },
  { id: 't-006', user_id: 'user-001', amount: 75, type: 'redistribution', streak_id: 'streak-001', description: 'Lisa Chen missed a day — coins redistributed', created_at: `${addDays(getToday(), -4)}T23:00:00Z` },
];

// ---- Activity Feed ----
export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-001', user_id: 'user-002', type: 'check_in', streak_id: 'streak-001',
    data: { note: 'Crushed leg day! 🦵', proof_image_url: null },
    created_at: `${getToday()}T07:30:00Z`,
  },
  {
    id: 'act-002', user_id: 'user-003', type: 'check_in', streak_id: 'streak-003',
    data: { note: 'Built a REST API today', proof_image_url: null },
    created_at: `${getToday()}T22:00:00Z`,
  },
  {
    id: 'act-003', user_id: 'user-004', type: 'missed', streak_id: 'streak-001',
    data: { message: 'Lisa Chen missed Day 9 of Morning Gym' },
    created_at: `${addDays(getToday(), -4)}T23:00:00Z`,
  },
  {
    id: 'act-004', user_id: 'user-001', type: 'milestone', streak_id: 'streak-001',
    data: { milestone: 7, badge: 'Week Warrior' },
    created_at: `${addDays(getToday(), -5)}T18:30:00Z`,
  },
  {
    id: 'act-005', user_id: 'user-001', type: 'streak_created', streak_id: 'streak-002',
    data: { streak_name: 'Learn German' },
    created_at: `${addDays(getToday(), -5)}T10:00:00Z`,
  },
  {
    id: 'act-006', user_id: 'user-002', type: 'check_in', streak_id: 'streak-004',
    data: { note: '15 min morning meditation complete 🧘', proof_image_url: null },
    created_at: `${getToday()}T07:15:00Z`,
  },
];

// ---- Invitations ----
export const MOCK_INVITATIONS: Invitation[] = [
  {
    id: 'inv-001',
    streak_id: 'streak-003',
    inviter_id: 'user-003',
    invitee_id: 'user-002',
    status: 'pending',
    created_at: `${addDays(getToday(), -1)}T15:00:00Z`,
  },
];

// ---- Leaderboard ----
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: MOCK_USERS[2], coins_earned: 3100, streak_count: 4, completion_rate: 95 }, // Lisa
  { rank: 2, user: MOCK_USERS[0], coins_earned: 2350, streak_count: 3, completion_rate: 92 }, // Sarah
  { rank: 3, user: MOCK_USERS[1], coins_earned: 1800, streak_count: 2, completion_rate: 88 }, // Raj
  { rank: 4, user: MOCK_CURRENT_USER, coins_earned: 1535, streak_count: 4, completion_rate: 85 }, // Alex (you)
  { rank: 5, user: MOCK_USERS[3], coins_earned: 900, streak_count: 1, completion_rate: 70 }, // Mike
];

// ---- User Stats ----
export const MOCK_USER_STATS: UserStats = {
  total_streaks: 6,
  active_streaks: 4,
  completed_streaks: 1,
  longest_streak: 20,
  total_coins_earned: 1535,
  total_check_ins: 42,
  achievements_unlocked: 3,
};
