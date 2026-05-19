import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from './Text';

export interface LeagueHeaderProps {
  name: string;
  stage?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const LeagueHeader: React.FC<LeagueHeaderProps> = ({
  name,
  stage,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <View style={styles.row}>
      <View style={styles.icon} />
      <View style={styles.info}>
        <Text variant="ui.caption" tone="primary" numberOfLines={1}>
          {name}
        </Text>
        {!!stage && (
          <>
            <Text variant="ui.caption" tone="muted"> · </Text>
            <Text variant="ui.caption" tone="muted" numberOfLines={1} style={styles.stage}>
              {stage}
            </Text>
          </>
        )}
      </View>
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
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  icon: {
    width: 16,
    height: 16,
    borderRadius: Radii.sm,
    backgroundColor: Colors.border.subtle,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stage: { flexShrink: 1 },
  star: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
