// ============================================================
// STREAKER — Forgot Password Screen
// ============================================================

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { Input, Button } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { isValidEmail } from '../../../utils/helpers';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  // error is shared store state, so a failed login would otherwise render its
  // "Invalid login credentials" here before the user has typed anything.
  useEffect(() => {
    clearError();
  }, []);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) return;
    if (await requestPasswordReset(trimmed)) setSent(true);
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
          <Text className="text-5xl mb-4">🔑</Text>
          <Text className="text-white text-3xl font-bold">Reset Password</Text>
          <Text className="text-gray-400 text-base mt-2 text-center">
            {sent
              ? 'Check your inbox for the link'
              : "Enter your email and we'll send you a reset link"}
          </Text>
        </View>

        {sent ? (
          <>
            <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              {/* Deliberately does not confirm whether an account exists -
                  resetPasswordForEmail succeeds either way, and saying
                  otherwise would turn this screen into an account checker. */}
              <Text className="text-green-400 text-sm text-center">
                If <Text className="font-semibold">{email.trim()}</Text> has an account, a reset
                link is on its way.
              </Text>
              <Text className="text-gray-400 text-xs text-center mt-2">
                Open the link on this device so it can hand you back to the app.
              </Text>
            </View>

            <Button
              title="Back to Sign In"
              variant="outline"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
              className="mt-6"
            />
          </>
        ) : (
          <>
            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={(t) => {
                clearError();
                setEmail(t);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Button
              title="Send Reset Link"
              onPress={handleSend}
              loading={isLoading}
              disabled={!isValidEmail(email.trim())}
              fullWidth
              className="mt-2"
            />

            <View className="flex-row items-center justify-center mt-8">
              <Text className="text-gray-400">Remembered it? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text className="text-orange-400 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}
