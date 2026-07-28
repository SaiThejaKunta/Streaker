// ============================================================
// STREAKER — Utility Helpers
// ============================================================

import { MOTIVATIONAL_QUOTES, COINS, APP_CONFIG } from './constants';
import type { DayStatus, CalendarDay, CheckIn } from '../types';

// ---- Date Helpers ----

/**
 * Get today's date in YYYY-MM-DD format (local timezone).
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * Format a Date object to YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date object (local timezone).
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get the number of days between two date strings (inclusive).
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Add days to a date string.
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Check if a date string is today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}

/**
 * Check if a date string is in the past (before today).
 */
export function isPast(dateStr: string): boolean {
  return dateStr < getToday();
}

/**
 * Check if a date string is in the future (after today).
 */
export function isFuture(dateStr: string): boolean {
  return dateStr > getToday();
}

/**
 * Format a date string for display: "Jul 28, 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string for short display: "Jul 28"
 */
export function formatDateShort(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get relative time string: "2h ago", "3d ago", "just now"
 */
export function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDateShort(formatDate(then));
}

/**
 * Get the day name: "Monday", "Tuesday", etc.
 */
export function getDayName(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Get all dates in a month as an array of YYYY-MM-DD strings.
 */
export function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(formatDate(new Date(year, month, d)));
  }
  return dates;
}

/**
 * Get the first day of the week (0=Sun) for a given month.
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ---- Streak Helpers ----

/**
 * Calculate the current day number of a streak (1-based).
 */
export function getCurrentDayNumber(startDate: string): number {
  const today = getToday();
  if (today < startDate) return 0;
  return daysBetween(startDate, today);
}

/**
 * Calculate the progress percentage of a streak.
 */
export function getStreakProgress(startDate: string, targetDays: number): number {
  const currentDay = getCurrentDayNumber(startDate);
  return Math.min(Math.round((currentDay / targetDays) * 100), 100);
}

/**
 * Build calendar data for a streak.
 */
export function buildCalendarDays(
  startDate: string,
  targetDays: number,
  checkIns: CheckIn[],
  frozenDates: string[] = []
): CalendarDay[] {
  const today = getToday();
  const checkInMap = new Map(checkIns.map((ci) => [ci.check_in_date, ci]));
  const frozenSet = new Set(frozenDates);
  const days: CalendarDay[] = [];

  for (let i = 0; i < targetDays; i++) {
    const date = addDays(startDate, i);
    let status: DayStatus;
    const checkIn = checkInMap.get(date);

    if (date === today) {
      status = checkIn ? 'completed' : 'today';
    } else if (date > today) {
      status = 'upcoming';
    } else if (frozenSet.has(date)) {
      status = 'frozen';
    } else if (checkIn) {
      status = 'completed';
    } else {
      status = 'missed';
    }

    days.push({ date, status, check_in: checkIn });
  }

  return days;
}

// ---- Coin Helpers ----

/**
 * Format coin amount with sign: "+150 🪙" or "-50 🪙"
 */
export function formatCoins(amount: number, showSign = true): string {
  const sign = showSign && amount > 0 ? '+' : '';
  return `${sign}${amount} 🪙`;
}

/**
 * Format large numbers: 1000 → "1K", 10000 → "10K"
 */
export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toString();
}

/**
 * Calculate how many coins a member would lose if they miss a day.
 * Returns the per-member redistribution amount.
 */
export function calculateRedistribution(
  remainingCoins: number,
  activeMembersCount: number
): number {
  if (activeMembersCount <= 1) return 0;
  return Math.floor(remainingCoins / (activeMembersCount - 1));
}

// ---- Quote Helper ----

/**
 * Get the motivational quote for today (deterministic based on date).
 */
export function getTodaysQuote(): { text: string; author: string } {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}

// ---- Validation ----

/**
 * Validate a username (alphanumeric + underscores, 3-20 chars).
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password (min 6 chars).
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

// ---- Misc ----

/**
 * Generate a random UUID (v4-ish) for mock data.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get initials from a display name: "John Doe" → "JD"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
