import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { useAuth } from '@/lib/auth';

interface GameOption {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const TIER1: GameOption[] = [
  { key: 'valorant', label: 'Valorant', icon: 'pistol' },
  { key: 'cs2', label: 'Counter-Strike 2', icon: 'target' },
  { key: 'lol', label: 'League of Legends', icon: 'sword' },
  { key: 'rl', label: 'Rocket League', icon: 'rocket-launch' },
];

const TIER2: GameOption[] = [
  { key: 'dota2', label: 'Dota 2', icon: 'shield-sword' },
  { key: 'ow', label: 'Overwatch', icon: 'crosshairs' },
  { key: 'r6', label: 'Rainbow Six', icon: 'security' },
];

export default function GamesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(profile?.favorite_games || []),
  );

  const toggle = (key: string) => {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelected(next);
  };

  const handleContinue = () => {
    if (selected.size === 0) return;
    router.push({
      pathname: '/teams',
      params: { games: Array.from(selected).join(',') },
    });
  };

  const renderGame = (g: GameOption) => {
    const active = selected.has(g.key);
    return (
      <Pressable
        key={g.key}
        onPress={() => toggle(g.key)}
        style={[styles.card, active && styles.cardActive]}
      >
        <MaterialCommunityIcons
          name={g.icon}
          size={24}
          color={active ? Colors.accent.indigo : Colors.text.muted}
        />
        <Text variant="ui.body" tone={active ? 'accent' : 'primary'} style={styles.cardLabel}>
          {g.label}
        </Text>
        <View style={[styles.check, active && styles.checkActive]}>
          {active && <MaterialCommunityIcons name="check" size={14} color={Colors.text.primary} />}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Wordmark size="big" />
          <Text variant="ui.body" tone="muted" style={styles.subtitle}>
            {profile?.onboarded_at
              ? 'Modifie les jeux que tu suis. (1/2)'
              : 'Choisis les jeux que tu suis. (1/2)'}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="ui.label" tone="muted">Tier 1 · Les grands</Text>
        </View>
        <View style={styles.grid}>{TIER1.map(renderGame)}</View>

        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <Text variant="ui.label" tone="muted">Tier 2 · Autres compétitifs</Text>
        </View>
        <View style={styles.grid}>{TIER2.map(renderGame)}</View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleContinue}
          disabled={selected.size === 0}
          style={({ pressed }) => [
            styles.cta,
            selected.size === 0 && styles.ctaDisabled,
            pressed && styles.ctaPressed,
          ]}
        >
          <Text variant="ui.label" tone="primary">Continuer ({selected.size})</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  hero: { marginBottom: Spacing.xl, gap: Spacing.xs },
  subtitle: { marginTop: Spacing.xs },
  sectionHeader: { marginBottom: Spacing.md },
  grid: { gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  cardActive: {
    borderColor: Colors.accent.indigo,
    backgroundColor: 'rgba(92, 92, 232, 0.08)',
  },
  cardLabel: { flex: 1 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { borderColor: Colors.accent.indigo, backgroundColor: Colors.accent.indigo },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  cta: {
    backgroundColor: Colors.accent.indigo,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  ctaDisabled: { backgroundColor: Colors.bg.elevated, opacity: 0.6 },
  ctaPressed: { opacity: 0.85 },
});
