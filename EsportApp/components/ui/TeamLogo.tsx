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

const IMAGE_HEADERS = {
  Referer: 'https://liquipedia.net/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export const TeamLogo: React.FC<TeamLogoProps> = ({ uri, name, size = 28 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {uri ? (
        <Image
          source={{ uri, headers: IMAGE_HEADERS }}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      ) : (
        <Text variant="display.time" tone="primary" style={styles.fallback}>
          {initial}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '85%', height: '85%' },
  fallback: { lineHeight: 18 },
});
