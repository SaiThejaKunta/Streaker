// ============================================================
// STREAKER — Login Screen
// ============================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { Input, Button } from '../../../components/ui';
import { useAuthStore } from '../../../store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    await login({ email: email.trim(), password });
    // Navigate to home after successful login
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
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
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-5xl mb-4">🔥</Text>
            <Text className="text-white text-3xl font-bold">Welcome Back</Text>
            <Text className="text-gray-400 text-base mt-2">
              Sign in to continue your streaks
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-sm text-center">{error}</Text>
            </View>
          )}

          {/* Form */}
          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={(t) => { clearError(); setEmail(t); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => { clearError(); setPassword(t); }}
            secureTextEntry
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            className="mt-2"
          />

          {/* Forgot Password */}
          <TouchableOpacity className="mt-4 items-center">
            <Text className="text-blue-400 text-sm">Forgot Password?</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-gray-400">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
              <Text className="text-orange-400 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
    </KeyboardAwareScrollView>
  );
}
