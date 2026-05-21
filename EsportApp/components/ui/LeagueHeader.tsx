import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from './Text';
import { LiveChip } from './LiveChip';

export interface LeagueHeaderProps {
  name: string;
  imageUrl?: string | null;
  isFavorite?: boolean;
  hasLive?: boolean;
  onToggleFavorite?: () => void;
}

export const LeagueHeader: React.FC<LeagueHeaderProps> = ({
  name,
  imageUrl,
  isFavorite = false,
  hasLive = false,
  onToggleFavorite,
}) => {
  return (
    <View style={styles.row}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.logo} contentFit="contain" transition={200} />
      ) : (
        <View style={styles.logoPlaceholder} />
      )}
      <Text variant="ui.body" tone="primary" numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      {hasLive && <LiveChip />}
      <Pressable onPress={onToggleFavorite} hitSlop={8} style={styles.star}>
        <MaterialCommunityIcons
          name={isFavorite ? 'star' : 'star-outline'}
          size={18}
          color={isFavorite ? Colors.accent.indigo : Colors.border.subtle}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  logo: {
    width: 22,
    height: 22,
  },
  logoPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: Radii.sm,
    backgroundColor: Colors.border.subtle,
  },
  name: {
    flex: 1,
  },
  star: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
