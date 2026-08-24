// ============================================================
// STREAKER — Welcome / Onboarding Screen
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  type ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🔥',
    title: 'Build Streaks',
    subtitle: 'Track your daily habits and never miss a day',
    description:
      'Create custom streaks for anything — exercise, coding, reading, or any goal you want to crush.',
  },
  {
    id: '2',
    emoji: '👥',
    title: 'Challenge Friends',
    subtitle: 'Accountability makes you unstoppable',
    description:
      'Invite friends to group streaks. Put your virtual coins on the line. If someone misses — their coins get shared!',
  },
  {
    id: '3',
    emoji: '🪙',
    title: 'Earn & Flex',
    subtitle: 'Stack coins. Climb leaderboards. Show off.',
    description:
      'Every check-in earns coins. Prove it with photo proof. Flex your dedication to the world.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const renderSlide = ({ item }: { item: (typeof SLIDES)[0] }) => (
    <View style={{ width }} className="items-center justify-center px-8">
      <Text className="text-8xl mb-8">{item.emoji}</Text>
      <Text className="text-white text-3xl font-bold text-center mb-3">
        {item.title}
      </Text>
      <Text className="text-orange-400 text-lg font-medium text-center mb-4">
        {item.subtitle}
      </Text>
      <Text className="text-gray-400 text-base text-center leading-6 px-4">
        {item.description}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      {/* Logo Area */}
      <View className="items-center pt-16 pb-4">
        <Text className="text-white text-2xl font-bold tracking-widest">
          STREAKER
        </Text>
        <View className="h-0.5 w-16 bg-orange-500 mt-2 rounded-full" />
      </View>

      {/* Carousel */}
      <View className="flex-1 justify-center">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        />

        {/* Dots */}
        <View className="flex-row items-center justify-center mt-4 mb-8 gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`rounded-full ${
                i === currentIndex
                  ? 'w-8 h-2 bg-orange-500'
                  : 'w-2 h-2 bg-gray-600'
              }`}
            />
          ))}
        </View>
      </View>

      {/* Bottom Buttons */}
      <View className="px-6 pb-12 gap-3">
        <TouchableOpacity
          className="bg-orange-500 py-4 rounded-2xl items-center"
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-gray-600 py-4 rounded-2xl items-center"
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text className="text-gray-300 text-lg font-medium">
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
