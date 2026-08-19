// ============================================================
// STREAKER — TypeScript Types & Interfaces
// ============================================================

// ---- User ----
export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  coin_balance: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Friendship ----
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  // Joined fields
  friend?: User;
}

// ---- Streak ----
export type StreakStatus = 'active' | 'completed' | 'failed';
export type StreakType = 'solo' | 'group';

export interface Streak {
  id: string;
  created_by: string;
  name: string;
  emoji: string;
  description: string | null;
  target_days: number;
  coin_buy_in: number;
  is_group: boolean;
  is_public: boolean;
  reminder_time: string | null; // HH:MM format
  status: StreakStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  // Joined fields
  creator?: User;
  members?: StreakMember[];
  my_membership?: StreakMember;
}

// ---- Streak Member ----
export interface StreakMember {
  id: string;
  streak_id: string;
  user_id: string;
  coins_invested: number;
  coins_earned: number;
  current_streak_count: number;
  longest_count: number;
  is_active: boolean;
  joined_at: string;
  // Joined fields
  user?: User;
  today_checked_in?: boolean;
}

// ---- Check-In ----
export interface CheckIn {
  id: string;
  streak_id: string;
  user_id: string;
  check_in_date: string;
  status: 'pending' | 'verified' | 'rejected';
  proof_image_url: string | null;
  note: string | null;
  coins_earned: number;
  created_at: string;
  // Joined fields
  user?: User;
  streak?: Streak;
  reactions?: Reaction[];
}

// ---- Coin Transaction ----
export type TransactionType =
  | 'buy_in'
  | 'daily_reward'
  | 'missed_penalty'
  | 'redistribution'
  | 'bonus'
  | 'signup_bonus';

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number; // positive = earned, negative = spent
  type: TransactionType;
  streak_id: string | null;
  description: string;
  created_at: string;
  // Joined fields
  streak?: Streak;
}

// ---- Invitation ----
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface Invitation {
  id: string;
  streak_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InvitationStatus;
  created_at: string;
  // Joined fields
  streak?: Streak;
  inviter?: User;
}

// ---- Activity ----
export type ActivityType =
  | 'check_in'
  | 'streak_created'
  | 'streak_joined'
  | 'verification_request'
  | 'milestone'
  | 'missed'
  | 'streak_completed'
  | 'achievement_unlocked';

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  streak_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
  // Joined fields
  user?: User;
  streak?: Streak;
}

// ---- Reaction ----
export interface Reaction {
  id: string;
  check_in_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  // Joined fields
  user?: User;
}

// ---- Achievement / Badge ----
export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  emoji: string;
  requirement: number;
  category: 'streak' | 'social' | 'coin' | 'special';
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

// ---- Streak Freeze ----
export interface StreakFreeze {
  id: string;
  streak_id: string;
  user_id: string;
  freeze_date: string;
  created_at: string;
}

// ---- UI / Form Types ----
export interface CreateStreakForm {
  name: string;
  emoji: string;
  description: string;
  target_days: number;
  is_group: boolean;
  is_public: boolean;
  reminder_time: string | null;
  invitee_ids: string[];
}

export interface RegisterForm {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

// ---- Calendar ----
export type DayStatus = 'completed' | 'missed' | 'frozen' | 'upcoming' | 'today';

export interface CalendarDay {
  date: string;
  status: DayStatus;
  check_in?: CheckIn;
}

// ---- Leaderboard ----
export interface LeaderboardEntry {
  rank: number;
  user: User;
  coins_earned: number;
  streak_count: number;
  completion_rate: number;
}

// ---- Stats ----
export interface UserStats {
  total_streaks: number;
  active_streaks: number;
  completed_streaks: number;
  longest_streak: number;
  total_coins_earned: number;
  total_check_ins: number;
  achievements_unlocked: number;
}

// ---- Notification ----
export interface StreakReminder {
  streak_id: string;
  streak_name: string;
  reminder_time: string;
  notification_id: string;
}
