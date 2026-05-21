import React from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from './Text';

export type GameKey =
  | 'all'
  | 'valorant'
  | 'cs2'
  | 'lol'
  | 'rl'
  | 'cod'
  | 'dota2'
  | 'ow'
  | 'r6';

const OPTIONS: { key: GameKey; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'valorant', label: 'Valorant' },
  { key: 'lol', label: 'LoL' },
  { key: 'cs2', label: 'CS2' },
  { key: 'rl', label: 'Rocket League' },
  { key: 'cod', label: 'Call of Duty' },
  { key: 'dota2', label: 'Dota 2' },
  { key: 'r6', label: 'Rainbow Six' },
  { key: 'ow', label: 'Overwatch' },
];

export interface GameFilterProps {
  value: GameKey;
  onChange: (key: GameKey) => void;
}

export const GameFilter: React.FC<GameFilterProps> = ({ value, onChange }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.scroll}
    contentContainerStyle={styles.container}
  >
    {OPTIONS.map((opt) => {
      const active = opt.key === value;
      return (
        <Pressable
          key={opt.key}
          onPress={() => onChange(opt.key)}
          style={[styles.pill, active && styles.pillActive]}
        >
          <Text variant="ui.label" tone={active ? 'primary' : 'muted'}>
            {opt.label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  pill: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.surface,
  },
  pillActive: {
    backgroundColor: Colors.accent.indigo,
    borderColor: Colors.accent.indigo,
  },
});
