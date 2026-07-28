/**
 * STREAKER — Theme Constants
 * These are available for components that can't use NativeWind directly.
 */

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    bgPrimary: '#0F0F1A',
    bgCard: '#1A1A2E',
    bgCardHover: '#252542',
    bgInput: '#1E1E35',
    accentOrange: '#FF6B35',
    accentAmber: '#FFA726',
    accentBlue: '#4FC3F7',
    success: '#66BB6A',
    danger: '#EF5350',
    textPrimary: '#FAFAFA',
    textSecondary: '#9E9EAF',
    textMuted: '#6B6B80',
    border: '#2A2A45',
    borderLight: '#3A3A55',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
