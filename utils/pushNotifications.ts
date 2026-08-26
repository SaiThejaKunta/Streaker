// ============================================================
// STREAKER — Push Notification Registration
// ============================================================

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface PushRegistrationResult {
  token: string | null;
  /** Non-null whenever token is null, so callers/debugging can see why. */
  error: string | null;
}

/**
 * Requests notification permission and returns an Expo push token. Never
 * throws - on any failure (permission denied, no projectId, API error),
 * token is null and error explains what happened.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { token: null, error: `PERMISSION_${finalStatus.toUpperCase()}` };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      return { token: null, error: 'MISSING_PROJECT_ID' };
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token, error: null };
  } catch (e) {
    return { token: null, error: `EXCEPTION: ${String(e)}`.slice(0, 500) };
  }
}
