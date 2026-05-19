import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent.indigo,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="matchs"
        options={{
          title: 'Matchs',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="sword-cross" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ligues"
        options={{
          title: 'Ligues',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'trophy' : 'trophy-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Actus',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'newspaper-variant' : 'newspaper-variant-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bg.page,
    borderTopColor: Colors.border.subtle,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 60,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    gap: 2,
  },
  tabBarLabel: {
    fontFamily: 'Geist-Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
