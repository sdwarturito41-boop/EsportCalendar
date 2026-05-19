import React from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from './Text';

export type FilterKey = 'favorites' | 'all' | 'live' | 'upcoming' | 'finished';

const OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'favorites', label: 'Favoris' },
  { key: 'all', label: 'Tous' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'À venir' },
  { key: 'finished', label: 'Terminés' },
];

export interface FilterTabsProps {
  value: FilterKey;
  onChange: (key: FilterKey) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ value, onChange }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.container}
  >
    {OPTIONS.map((opt) => {
      const active = opt.key === value;
      return (
        <Pressable key={opt.key} onPress={() => onChange(opt.key)} style={styles.tab}>
          <Text variant="ui.label" tone={active ? 'accent' : 'muted'}>
            {opt.label}
          </Text>
          {active && <View style={styles.underline} />}
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    paddingHorizontal: Spacing.md + 2,
    paddingTop: 12,
    paddingBottom: 10,
    position: 'relative',
  },
  underline: {
    position: 'absolute',
    left: Spacing.md + 2,
    right: Spacing.md + 2,
    bottom: 0,
    height: 2,
    backgroundColor: Colors.accent.indigo,
    borderRadius: 2,
  },
});
