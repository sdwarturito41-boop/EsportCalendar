import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Radii } from '@/constants/theme';
import { Text } from './Text';

export interface TeamLogoProps {
  uri: string | null;
  name: string;
  size?: number;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ uri, name, size = 28 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  if (uri) {
    return (
      <View style={{ width: size, height: size }}>
        <Image source={{ uri }} style={styles.image} contentFit="contain" transition={200} />
      </View>
    );
  }
  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <Text variant="display.time" tone="primary" style={styles.fallbackText}>
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  fallback: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { lineHeight: 18 },
});
