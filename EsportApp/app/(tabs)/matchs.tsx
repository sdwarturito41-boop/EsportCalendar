import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/ui/Text';
import { PageHeader } from '@/components/ui/PageHeader';
import { MatchRow, MatchRowMatch } from '@/components/ui/MatchRow';
import { LeagueHeader } from '@/components/ui/LeagueHeader';
import { FilterTabs, FilterKey } from '@/components/ui/FilterTabs';
import { GameFilter, GameKey } from '@/components/ui/GameFilter';
import { DateBar } from '@/components/ui/DateBar';

interface Tournament {
  id: string;
  name: string;
  game: string;
  tier?: string;
  image_url?: string;
}

interface Match extends MatchRowMatch {
  tournament_id: string;
  tournaments: Tournament | Tournament[] | null;
}

interface TournamentGroup {
  leagueName: string;
  imageUrl: string | null;
  tier: string;
  game: string;
  matches: Match[];
}

const tierPriority: Record<string, number> = {
  s: 1,
  a: 2,
  b: 3,
  c: 4,
  d: 5,
  unranked: 6,
};

const getTournament = (match: Match): Tournament | null => {
  if (!match.tournaments) return null;
  return Array.isArray(match.tournaments) ? match.tournaments[0] : match.tournaments;
};

export default function MatchsScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [groupedMatches, setGroupedMatches] = useState<TournamentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [game, setGame] = useState<GameKey>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('matches')
        .select('*, tournaments(*)')
        .gte('begin_at', start.toISOString())
        .lte('begin_at', end.toISOString())
        .order('begin_at', { ascending: true });

      if (!data) return;

      const grouped: Record<string, Match[]> = {};
      data.forEach((m: any) => {
        const t = getTournament(m);
        const key = t?.name || 'Inconnu';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
      });

      const sorted = Object.entries(grouped)
        .map(([leagueName, matches]) => {
          const t = getTournament(matches[0]);
          return {
            leagueName,
            imageUrl: t?.image_url || null,
            tier: (t?.tier || 'unranked').toLowerCase(),
            game: (t?.game || 'unknown').toLowerCase(),
            matches,
          };
        })
        .sort((a, b) => {
          const pa = tierPriority[a.tier] || 999;
          const pb = tierPriority[b.tier] || 999;
          return pa !== pb ? pa - pb : a.leagueName.localeCompare(b.leagueName);
        });

      setGroupedMatches(sorted);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const filteredGroups = useMemo(() => {
    return groupedMatches
      .filter((g) => game === 'all' || g.game === game)
      .map((g) => ({
        ...g,
        matches:
          filter === 'all'
            ? g.matches
            : g.matches.filter((m) => {
                if (filter === 'live') return m.status === 'running';
                if (filter === 'upcoming') return m.status === 'not_started';
                if (filter === 'finished') return m.status === 'finished';
                if (filter === 'favorites') return favorites.has(g.leagueName);
                return true;
              }),
      }))
      .filter((g) => g.matches.length > 0);
  }, [groupedMatches, filter, game, favorites]);

  const toggleFavorite = (leagueName: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(leagueName)) next.delete(leagueName);
      else next.add(leagueName);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        rightAction={
          <MaterialCommunityIcons name="calendar-blank" size={20} color={Colors.text.primary} />
        }
      />

      <GameFilter value={game} onChange={setGame} />
      <FilterTabs value={filter} onChange={setFilter} />
      <View style={styles.hairline} />

      <DateBar date={selectedDate} onChange={setSelectedDate} />
      <View style={styles.hairline} />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.accent.indigo} size="large" />
      ) : filteredGroups.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="inbox-outline" size={40} color={Colors.text.muted} />
          <Text variant="ui.body" tone="muted" style={styles.emptyText}>
            Aucun match
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredGroups.map((group) => (
            <View key={group.leagueName}>
              <LeagueHeader
                name={group.leagueName}
                imageUrl={group.imageUrl}
                isFavorite={favorites.has(group.leagueName)}
                hasLive={group.matches.some((m) => m.status === 'running')}
                onToggleFavorite={() => toggleFavorite(group.leagueName)}
              />
              {group.matches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  hairline: { height: 1, backgroundColor: Colors.border.subtle },
  scrollContent: { paddingBottom: 80 },
  loader: { marginTop: 40 },
  empty: { paddingVertical: 80, alignItems: 'center', gap: Spacing.sm },
  emptyText: { marginTop: Spacing.xs },
});
