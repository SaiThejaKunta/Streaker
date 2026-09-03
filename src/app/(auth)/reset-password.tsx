// ============================================================
// STREAKER — Reset Password Screen (opened by the emailed link)
// ============================================================
//
// Supabase sends a recovery link pointing at Linking.createURL('/reset-password')
// (see useAuthStore.requestPasswordReset). Tapping it opens the app here, with
// the recovery token in either the query string or the URL fragment depending
// on the client's auth flowType - expo-router only surfaces query params, never
// the fragment, so this reads the whole URL and hands it to parseRecoveryLink.
//
// useLinkingURL (not the deprecated useURL) because it seeds its state
// synchronously from the current linking URL. On a warm start the OS delivers
// the URL while this screen is still mounting, so a hook that only subscribes
// to future events would miss it and spin forever.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { useLinkingURL } from 'expo-linking';
import { Input, Button } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { isValidPassword, parseRecoveryLink } from '../../../utils/helpers';

type Stage = 'redeeming' | 'ready' | 'unusable' | 'done';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const url = useLinkingURL();
  const {
    redeemRecoveryLink,
    completePasswordReset,
    abandonPasswordRecovery,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const [stage, setStage] = useState<Stage>('redeeming');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Keyed off the URL rather than the stage: a second link tapped while this
  // screen is still mounted has to supersede the first outcome, instead of
  // being swallowed behind an "expired" message from the previous one.
  const handledUrlRef = useRef<string | null>(null);
  const redeemedRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    clearError();
  }, []);

  useEffect(() => {
    // A null URL means "not delivered yet", not "no link".
    if (!url || url === handledUrlRef.current) return;
    handledUrlRef.current = url;

    const link = parseRecoveryLink(url);
    if (!link) {
      setStage('unusable');
      return;
    }

    let cancelled = false;
    setStage('redeeming');
    redeemRecoveryLink(link).then((ok) => {
      if (cancelled) return;
      redeemedRef.current = redeemedRef.current || ok;
      setStage(ok ? 'ready' : 'unusable');
    });
    return () => {
      cancelled = true;
    };
  }, [url, redeemRecoveryLink, clearError]);

  // Leaving without choosing a password - back button, "send a new link", or
  // swiping the screen away - must not leave the redeemed session persisted.
  useEffect(
    () => () => {
      if (redeemedRef.current && !completedRef.current) {
        void abandonPasswordRecovery();
      }
    },
    [abandonPasswordRecovery]
  );

  const mismatch = confirmation.length > 0 && password !== confirmation;
  const canSubmit = isValidPassword(password) && password === confirmation;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (await completePasswordReset(password)) {
      completedRef.current = true;
      setStage('done');
    }
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-[#0F0F1A]"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
      extraHeight={150}
    >
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-12">
          <Text className="text-5xl mb-4">{stage === 'done' ? '✅' : '🔑'}</Text>
          <Text className="text-white text-3xl font-bold">
            {stage === 'done' ? 'Password Updated' : 'Choose a New Password'}
          </Text>
        </View>

        {stage === 'redeeming' && (
          <View className="items-center">
            <ActivityIndicator color="#FF6B35" />
            <Text className="text-gray-400 text-sm mt-3">Checking your reset link…</Text>
          </View>
        )}

        {stage === 'unusable' && (
          <>
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <Text className="text-red-400 text-sm text-center">
                {error || 'This reset link is invalid or has expired.'}
              </Text>
              <Text className="text-gray-400 text-xs text-center mt-2">
                Reset links can only be used once, and expire shortly after they're sent.
              </Text>
            </View>
            <Button
              title="Send a New Link"
              onPress={() => {
                clearError();
                router.replace('/(auth)/forgot-password');
              }}
              fullWidth
              className="mt-6"
            />
          </>
        )}

        {stage === 'ready' && (
          <>
            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            )}

            <Input
              label="New Password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(t) => {
                clearError();
                setPassword(t);
              }}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label="Confirm New Password"
              placeholder="Type it again"
              value={confirmation}
              onChangeText={(t) => {
                clearError();
                setConfirmation(t);
              }}
              secureTextEntry
              autoCapitalize="none"
              error={mismatch ? 'Passwords do not match' : undefined}
            />

            <Button
              title="Update Password"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!canSubmit}
              fullWidth
              className="mt-2"
            />
          </>
        )}

        {stage === 'done' && (
          <>
            <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <Text className="text-green-400 text-sm text-center">
                Sign in with your new password to pick your streaks back up.
              </Text>
            </View>
            <Button
              title="Sign In"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
              className="mt-6"
            />
          </>
        )}

        {stage !== 'done' && (
          <View className="flex-row items-center justify-center mt-8">
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text className="text-gray-400">Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}
