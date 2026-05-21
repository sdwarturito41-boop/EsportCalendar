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
import { useAuth } from '@/lib/auth';
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

const GAME_PRIORITY: Record<string, number> = {
  valorant: 1,
  cs2: 2,
  lol: 3,
  rl: 4,
  dota2: 5,
  ow: 6,
  r6: 7,
};

const GAME_LABEL: Record<string, string> = {
  valorant: 'VALORANT',
  cs2: 'COUNTER-STRIKE 2',
  lol: 'LEAGUE OF LEGENDS',
  rl: 'ROCKET LEAGUE',
  dota2: 'DOTA 2',
  ow: 'OVERWATCH',
  r6: 'RAINBOW SIX',
};

const GAME_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  valorant: 'pistol',
  cs2: 'target',
  lol: 'sword',
  rl: 'rocket-launch',
  dota2: 'shield-sword',
  ow: 'crosshairs',
  r6: 'security',
};

const getTournament = (match: Match): Tournament | null => {
  if (!match.tournaments) return null;
  return Array.isArray(match.tournaments) ? match.tournaments[0] : match.tournaments;
};

export default function MatchsScreen() {
  const { profile } = useAuth();
  const favoriteTeams = useMemo(() => new Set(profile?.favorite_teams || []), [profile]);
  const favoriteGames = useMemo(() => new Set(profile?.favorite_games || []), [profile]);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [groupedMatches, setGroupedMatches] = useState<TournamentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  // Si l'utilisateur a un seul jeu favori, pré-sélectionne ; sinon 'all'.
  const initialGame: GameKey =
    profile?.favorite_games?.length === 1
      ? (profile.favorite_games[0] as GameKey)
      : 'all';
  const [game, setGame] = useState<GameKey>(initialGame);
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
        ;

      setGroupedMatches(sorted);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const filteredGroups = useMemo(() => {
    return [...groupedMatches]
      .sort((a, b) => {
        const aFav = favoriteGames.has(a.game) ? 0 : 1;
        const bFav = favoriteGames.has(b.game) ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
        const ga = GAME_PRIORITY[a.game] || 99;
        const gb = GAME_PRIORITY[b.game] || 99;
        if (ga !== gb) return ga - gb;
        const pa = tierPriority[a.tier] || 999;
        const pb = tierPriority[b.tier] || 999;
        if (pa !== pb) return pa - pb;
        return a.leagueName.localeCompare(b.leagueName);
      })
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
                if (filter === 'favorites') {
                  // Englobe : match dans un jeu favori OU avec une team
                  // favorite OU dans une league marquée en session.
                  const gameMatch = favoriteGames.has(g.game);
                  const teamMatch =
                    favoriteTeams.has(m.opponent1_name) ||
                    favoriteTeams.has(m.opponent2_name);
                  return gameMatch || teamMatch || favorites.has(g.leagueName);
                }
                return true;
              }),
      }))
      .filter((g) => g.matches.length > 0);
  }, [groupedMatches, filter, game, favorites, favoriteTeams, favoriteGames]);

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
          {filteredGroups.map((group, idx) => {
            const prevGame = idx > 0 ? filteredGroups[idx - 1].game : null;
            const showGameHeader = group.game !== prevGame;
            return (
              <View key={group.leagueName}>
                {showGameHeader && (
                  <View style={styles.gameSection}>
                    <MaterialCommunityIcons
                      name={GAME_ICON[group.game] || 'gamepad-variant'}
                      size={20}
                      color={Colors.text.primary}
                    />
                    <Text variant="display.wordmark" tone="primary" style={styles.gameLabel}>
                      {GAME_LABEL[group.game] || group.game.toUpperCase()}
                    </Text>
                  </View>
                )}
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
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  hairline: { height: 1, backgroundColor: Colors.border.subtle },
  gameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  gameLabel: { fontSize: 22, letterSpacing: 2 },
  scrollContent: { paddingBottom: 80 },
  loader: { marginTop: 40 },
  empty: { paddingVertical: 80, alignItems: 'center', gap: Spacing.sm },
  emptyText: { marginTop: Spacing.xs },
});
