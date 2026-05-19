import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from './Text';

export interface LeagueHeaderProps {
  name: string;
  imageUrl?: string | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const LeagueHeader: React.FC<LeagueHeaderProps> = ({
  name,
  imageUrl,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <View style={styles.row}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.logo} contentFit="contain" transition={200} />
      ) : (
        <View style={styles.logoPlaceholder} />
      )}
      <Text variant="ui.caption" tone="primary" numberOfLines={1} style={styles.name}>
        {name}
      </Text>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  logo: {
    width: 18,
    height: 18,
  },
  logoPlaceholder: {
    width: 18,
    height: 18,
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
