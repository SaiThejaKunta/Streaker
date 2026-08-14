// ============================================================
// STREAKER — Register Screen
// ============================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { Input, Button } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';
import { isValidEmail, isValidPassword, isValidUsername } from '../../../utils/helpers';
import { COINS } from '../../../utils/constants';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    display_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.display_name.trim()) newErrors.display_name = 'Name is required';
    if (!isValidUsername(form.username)) {
      newErrors.username = 'Username: 3-20 chars, letters, numbers, underscores';
    }
    if (!isValidEmail(form.email)) newErrors.email = 'Invalid email address';
    if (!isValidPassword(form.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    await register({
      email: form.email.trim(),
      password: form.password,
      username: form.username.trim().toLowerCase(),
      display_name: form.display_name.trim(),
    });
    // After successful registration, navigate to home
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  };

  const updateField = (key: string, value: string) => {
    clearError();
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setForm((prev) => ({ ...prev, [key]: value }));
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
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-5xl mb-4">🔥</Text>
            <Text className="text-white text-3xl font-bold">Join STREAKER</Text>
            <Text className="text-gray-400 text-base mt-2">
              Start building life-changing habits
            </Text>
          </View>

          {/* Coin Bonus Banner */}
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex-row items-center">
            <Text className="text-3xl mr-3">🪙</Text>
            <View className="flex-1">
              <Text className="text-amber-400 font-bold text-base">
                {COINS.SIGNUP_BONUS} Free Coins!
              </Text>
              <Text className="text-amber-200/70 text-xs mt-0.5">
                Start your journey with coins to invest in streaks
              </Text>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-sm text-center">{error}</Text>
            </View>
          )}

          {/* Form */}
          <Input
            label="Display Name"
            placeholder="How should we call you?"
            value={form.display_name}
            onChangeText={(t) => updateField('display_name', t)}
            error={errors.display_name}
            autoCapitalize="words"
          />
          <Input
            label="Username"
            placeholder="your_unique_username"
            value={form.username}
            onChangeText={(t) => updateField('username', t)}
            error={errors.username}
            autoCapitalize="none"
          />
          <Input
            label="Email"
            placeholder="your@email.com"
            value={form.email}
            onChangeText={(t) => updateField('email', t)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            placeholder="Min 6 characters"
            value={form.password}
            onChangeText={(t) => updateField('password', t)}
            error={errors.password}
            secureTextEntry
          />

          <Button
            title="Create Account 🚀"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            className="mt-2"
          />

          {/* Login Link */}
          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-gray-400">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text className="text-orange-400 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
    </KeyboardAwareScrollView>
  );
}
