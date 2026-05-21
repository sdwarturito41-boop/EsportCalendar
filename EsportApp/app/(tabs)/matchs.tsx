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
import { Image } from 'expo-image';

import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Text } from '@/components/ui/Text';
import { PageHeader } from '@/components/ui/PageHeader';
import { MatchRow, MatchRowMatch } from '@/components/ui/MatchRow';
import { LeagueHeader } from '@/components/ui/LeagueHeader';
import { GameFilter, GameKey } from '@/components/ui/GameFilter';
import { LiveChip } from '@/components/ui/LiveChip';
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

// Ordre stratégique LOBBY (cible FR/EU, EWC focus) :
// 1. Valorant — EWC flagship + base FR
// 2. LoL — plus grande base fans FR/EU
// 3. CS2 — core gaming FR (KC, Vitality)
// 4. Rocket League — très suivi FR
// 5. Dota 2 — EWC majeur, prize pool
// 6. Rainbow Six — grosse scène FR (Vitality, BDS)
// 7. Overwatch
const GAME_PRIORITY: Record<string, number> = {
  valorant: 1,
  lol: 2,
  cs2: 3,
  rl: 4,
  dota2: 5,
  r6: 6,
  ow: 7,
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

// Logos PNG/WebP locaux dans assets/images/logo-jeux/.
// Si dispo on les utilise, sinon fallback sur GAME_ICON (MaterialCommunityIcons).
const GAME_LOGO: Record<string, any> = {
  valorant: require('@/assets/images/logo-jeux/valorant-logo.png'),
  cs2: require('@/assets/images/logo-jeux/cs2.webp'),
  lol: require('@/assets/images/logo-jeux/lol-logo.png'),
  rl: require('@/assets/images/logo-jeux/rl-logo.png'),
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
  const [favOnly, setFavOnly] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);

  // Si l'utilisateur a un seul jeu favori, pré-sélectionne ; sinon 'all'.
  const initialGame: GameKey =
    profile?.favorite_games?.length === 1
      ? (profile.favorite_games[0] as GameKey)
      : 'all';
  const [game, setGame] = useState<GameKey>(initialGame);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [collapsedGames, setCollapsedGames] = useState<Set<string>>(new Set());

  const toggleGameCollapse = (g: string) => {
    setCollapsedGames((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

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

      const statusRank: Record<string, number> = { running: 0, not_started: 1, finished: 2 };
      const sortMatches = (arr: Match[]) =>
        [...arr].sort((a, b) => {
          const sa = statusRank[a.status] ?? 3;
          const sb = statusRank[b.status] ?? 3;
          if (sa !== sb) return sa - sb;
          return new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime();
        });
      const sorted = Object.entries(grouped)
        .map(([leagueName, matches]) => {
          const t = getTournament(matches[0]);
          return {
            leagueName,
            imageUrl: t?.image_url || null,
            tier: (t?.tier || 'unranked').toLowerCase(),
            game: (t?.game || 'unknown').toLowerCase(),
            matches: sortMatches(matches),
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
        matches: g.matches.filter((m) => {
          if (liveOnly && m.status !== 'running') return false;
          if (favOnly) {
            const gameMatch = favoriteGames.has(g.game);
            const teamMatch =
              favoriteTeams.has(m.opponent1_name) || favoriteTeams.has(m.opponent2_name);
            const leagueMatch = favorites.has(g.leagueName);
            if (!(gameMatch || teamMatch || leagueMatch)) return false;
          }
          return true;
        }),
      }))
      .filter((g) => g.matches.length > 0);
  }, [groupedMatches, favOnly, liveOnly, game, favorites, favoriteTeams, favoriteGames]);

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

      <View style={styles.quickFilters}>
        <Pressable
          onPress={() => setFavOnly((v) => !v)}
          style={[styles.toggle, favOnly && styles.toggleActive]}
        >
          <MaterialCommunityIcons
            name={favOnly ? 'star' : 'star-outline'}
            size={14}
            color={favOnly ? Colors.accent.indigo : Colors.text.muted}
          />
          <Text variant="ui.label" tone={favOnly ? 'accent' : 'muted'}>Favoris</Text>
        </Pressable>
        <Pressable
          onPress={() => setLiveOnly((v) => !v)}
          style={[styles.toggle, liveOnly && styles.toggleLiveActive]}
        >
          <View style={[styles.dot, liveOnly && styles.dotActive]} />
          <Text variant="ui.label" tone={liveOnly ? 'live' : 'muted'}>Live</Text>
        </Pressable>
      </View>
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
            const isCollapsed = collapsedGames.has(group.game);
            return (
              <View key={group.leagueName}>
                {showGameHeader && (
                  <Pressable
                    style={styles.gameSection}
                    onPress={() => toggleGameCollapse(group.game)}
                  >
                    {GAME_LOGO[group.game] ? (
                      <Image source={GAME_LOGO[group.game]} style={styles.gameLogo} contentFit="contain" />
                    ) : (
                      <MaterialCommunityIcons
                        name={GAME_ICON[group.game] || 'gamepad-variant'}
                        size={22}
                        color={Colors.text.primary}
                      />
                    )}
                    <Text variant="display.wordmark" tone="primary" style={styles.gameLabel}>
                      {GAME_LABEL[group.game] || group.game.toUpperCase()}
                    </Text>
                    <MaterialCommunityIcons
                      name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                      size={20}
                      color={Colors.text.muted}
                    />
                  </Pressable>
                )}
                {!isCollapsed &&
                  group.matches.map((m) => (
                    <MatchRow
                      key={m.id}
                      match={m}
                      tournamentName={group.leagueName}
                      tournamentLogo={group.imageUrl}
                    />
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
  tournamentBlock: {
    marginTop: Spacing.md,
  },
  tournamentDivider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: 'transparent',
  },
  toggleActive: {
    borderColor: Colors.accent.indigo,
    backgroundColor: 'rgba(92, 92, 232, 0.12)',
  },
  toggleLiveActive: {
    borderColor: Colors.semantic.live,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.text.muted },
  dotActive: { backgroundColor: Colors.semantic.live },
  gameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: Spacing.xs,
  },
  gameLabel: { flex: 1, fontSize: 22, letterSpacing: 2 },
  gameLogo: { width: 24, height: 24 },
  scrollContent: { paddingBottom: 80 },
  loader: { marginTop: 40 },
  empty: { paddingVertical: 80, alignItems: 'center', gap: Spacing.sm },
  emptyText: { marginTop: Spacing.xs },
});
