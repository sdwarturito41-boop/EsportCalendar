import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* Hide the default Expo index screen */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="matchs"
        options={{
          title: 'Matchs',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons 
                name={focused ? "sword-cross" : "sword-cross"} 
                size={focused ? 26 : 22} 
                color={color} 
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="ligues"
        options={{
          title: 'Ligues',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons 
                name={focused ? "trophy" : "trophy-outline"} 
                size={focused ? 26 : 22} 
                color={color} 
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="news"
        options={{
          title: 'Actus',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons 
                name={focused ? "newspaper-variant" : "newspaper-variant-outline"} 
                size={focused ? 26 : 22} 
                color={color} 
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons 
                name={focused ? "account" : "account-outline"} 
                size={focused ? 26 : 22} 
                color={color} 
              />
            </View>
          ),
        }}
      />

      {/* Hide the default Expo explore screen */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1E293B', // Dark Slate
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 24,
    borderTopWidth: 0,
    paddingBottom: 8,
    paddingTop: 8,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeIconContainer: {
    // Optional: add a subtle glow or background to the active icon
    alignItems: 'center',
    justifyContent: 'center',
  },
});
