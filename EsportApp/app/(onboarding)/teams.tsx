import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { useAuth } from '@/lib/auth';
import { listTeamsForGames, saveOnboarding } from '@/lib/profile';

export default function TeamsScreen() {
  const router = useRouter();
  const { games: gamesParam } = useLocalSearchParams<{ games: string }>();
  const { session, profile, refreshProfile } = useAuth();
  const games = useMemo(() => (gamesParam || '').split(',').filter(Boolean), [gamesParam]);

  const [teams, setTeams] = useState<{ name: string; logo: string | null; game: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(profile?.favorite_teams || []),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    listTeamsForGames(games).then((t) => {
      setTeams(t);
      setLoading(false);
    });
  }, [games]);

  const filtered = useMemo(() => {
    if (!query) return teams;
    const q = query.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, query]);

  const toggle = (name: string) => {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    setSelected(next);
  };

  const handleFinish = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    const { error } = await saveOnboarding(session.user.id, games, Array.from(selected));
    setSaving(false);
    if (error) {
      console.warn('save onboarding:', error);
      return;
    }
    await refreshProfile();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Wordmark size="big" />
        <Text variant="ui.body" tone="muted" style={styles.subtitle}>
          Choisis tes équipes favorites. (2/2)
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color={Colors.text.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une équipe…"
          placeholderTextColor={Colors.text.muted}
          style={styles.search}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent.indigo} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text variant="ui.body" tone="muted">Aucune équipe trouvée.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.map((t) => {
            const active = selected.has(t.name);
            return (
              <Pressable
                key={`${t.game}:${t.name}`}
                onPress={() => toggle(t.name)}
                style={[styles.row, active && styles.rowActive]}
              >
                <TeamLogo uri={t.logo} name={t.name} size={28} />
                <View style={{ flex: 1 }}>
                  <Text variant="ui.body" tone="primary" numberOfLines={1}>{t.name}</Text>
                  <Text variant="ui.caption" tone="muted">
                    {t.game === 'cs2' ? 'CS2' : t.game.charAt(0).toUpperCase() + t.game.slice(1)}
                  </Text>
                </View>
                <View style={[styles.check, active && styles.checkActive]}>
                  {active && <MaterialCommunityIcons name="check" size={14} color={Colors.text.primary} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="ui.label" tone="muted">‹ Précédent</Text>
        </Pressable>
        <Pressable
          onPress={handleFinish}
          disabled={saving}
          style={({ pressed }) => [styles.cta, (saving || pressed) && styles.ctaPressed]}
        >
          {saving ? (
            <ActivityIndicator color={Colors.text.primary} />
          ) : (
            <Text variant="ui.label" tone="primary">
              {selected.size > 0 ? `Terminer (${selected.size})` : 'Passer'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  hero: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.xs },
  subtitle: { marginTop: Spacing.xs, marginBottom: Spacing.lg },
  searchWrap: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  search: {
    flex: 1,
    fontFamily: 'Geist-Medium',
    fontSize: 14,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  rowActive: {
    borderColor: Colors.accent.indigo,
    backgroundColor: 'rgba(92, 92, 232, 0.08)',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { borderColor: Colors.accent.indigo, backgroundColor: Colors.accent.indigo },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    gap: Spacing.md,
  },
  cta: {
    backgroundColor: Colors.accent.indigo,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 120,
  },
  ctaPressed: { opacity: 0.85 },
});
