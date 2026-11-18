import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../src/stores/authStore';
import { Onboarding } from '../../src/components/Onboarding';

interface TabIconProps {
  icon: string;
  focused: boolean;
  label: string;
}

function TabIcon({ icon, focused, label }: TabIconProps) {
  return (
    <View className="items-center gap-0.5">
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
      <Text
        className={`text-xs ${focused ? 'text-primary font-semibold' : 'text-light-text-muted dark:text-text-muted'}`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <>
    <Onboarding />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isLight ? '#FFFFFF' : '#1a1a1a',
          borderTopColor: isLight ? '#E5E5E5' : '#2e2e2e',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" focused={focused} label={t('home.title')} />
          ),
        }}
      />
      <Tabs.Screen
        name="repertoire"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎼" focused={focused} label={t('repertoire.title')} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👥" focused={focused} label={t('groups.title')} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" focused={focused} label={t('profile.title')} />
          ),
        }}
      />
    </Tabs>
    </>
  );
}
