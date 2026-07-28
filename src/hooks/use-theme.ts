/**
 * STREAKER — Theme Hook
 * Always returns dark theme colors (STREAKER is dark-mode only)
 */

import { Colors } from '@/constants/theme';

export function useTheme() {
  // STREAKER is dark-mode by default
  return Colors.dark;
}
