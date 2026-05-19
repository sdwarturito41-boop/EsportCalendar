import React from 'react';
import { View, Pressable, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from './Text';

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  imageUrl: string | null;
  url?: string;
}

export interface NewsCardProps {
  item: NewsItem;
  width?: number;
}

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}j`;
};

export const NewsCard: React.FC<NewsCardProps> = ({ item, width = 280 }) => {
  const handlePress = () => {
    if (item.url) Linking.openURL(item.url).catch(() => {});
  };
  return (
    <Pressable onPress={handlePress} style={[styles.card, { width }]}>
      <View style={[styles.imageWrap, { height: width * 0.5 }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text variant="ui.label" tone="accent">{item.category}</Text>
          <Text variant="ui.caption" tone="muted">{timeAgo(item.publishedAt)}</Text>
        </View>
        <Text variant="ui.body" tone="primary" numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    backgroundColor: Colors.bg.elevated,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%' },
  body: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontFamily: 'Geist-Bold',
    lineHeight: 20,
  },
});
