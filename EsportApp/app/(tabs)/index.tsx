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
import { useRouter } from 'expo-router';

import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Text } from '@/components/ui/Text';
import { PageHeader } from '@/components/ui/PageHeader';
import { LiveChip } from '@/components/ui/LiveChip';
import { FeaturedMatchCard } from '@/components/ui/FeaturedMatchCard';
import { CompactMatchCard } from '@/components/ui/CompactMatchCard';
import { NewsCard, NewsItem } from '@/components/ui/NewsCard';
import { MatchRowMatch } from '@/components/ui/MatchRow';
import { fetchNews } from '@/lib/news';

interface Tournament {
  id: string;
  name: string;
  tier: string | null;
  game: string | null;
}

interface MatchWithTournament extends MatchRowMatch {
  best_of: number;
  tournaments: Tournament | Tournament[] | null;
}

const getTournament = (m: MatchWithTournament): Tournament | null => {
  if (!m.tournaments) return null;
  return Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;
};

const tierRank: Record<string, number> = { s: 1, a: 2, b: 3, c: 4, d: 5 };

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const favoriteTeams = useMemo(() => new Set(profile?.favorite_teams || []), [profile]);
  const favoriteGames = useMemo(() => new Set(profile?.favorite_games || []), [profile]);

  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<MatchWithTournament | null>(null);
  const [todayMatches, setTodayMatches] = useState<MatchWithTournament[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const { data } = await supabase
        .from('matches')
        .select('*, tournaments(id, name, tier, game)')
        .gte('begin_at', start.toISOString())
        .lt('begin_at', end.toISOString())
        .order('begin_at', { ascending: true });

      if (!data) return;

      const matches = data as MatchWithTournament[];

      // Priorité au featured : (1) LIVE d'une team favorite > (2) LIVE quelconque
      // > (3) upcoming d'une team favorite top-tier > (4) upcoming top-tier
      const involvesFavTeam = (m: MatchWithTournament) =>
        favoriteTeams.has(m.opponent1_name) || favoriteTeams.has(m.opponent2_name);
      const live = matches.find((m) => m.status === 'running');
      const liveFav = matches.find((m) => m.status === 'running' && involvesFavTeam(m));
      const upcomings = matches.filter((m) => m.status === 'not_started').sort((a, b) => {
        const ra = tierRank[(getTournament(a)?.tier || 'z').toLowerCase()] || 99;
        const rb = tierRank[(getTournament(b)?.tier || 'z').toLowerCase()] || 99;
        return ra - rb;
      });
      const upcomingFav = upcomings.find(involvesFavTeam);
      setFeatured(liveFav || live || upcomingFav || upcomings[0] || matches[0] || null);

      // Today list : si l'utilisateur a des jeux favoris, on filtre dessus.
      const todayFiltered = favoriteGames.size > 0
        ? matches.filter((m) => {
            const g = getTournament(m)?.game;
            return g ? favoriteGames.has(g) : true;
          })
        : matches;
      setTodayMatches(todayFiltered.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, [favoriteGames, favoriteTeams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchNews().then(setNews);
  }, []);

  const featuredHasLive = featured?.status === 'running';

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.intro}>
          <Text variant="ui.body" tone="muted">Your esports companion</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.accent.indigo} style={{ marginTop: 60 }} />
        ) : (
          <>
            {featured && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="ui.label" tone="muted">MATCH À LA UNE</Text>
                  {featuredHasLive && <LiveChip />}
                </View>
                <FeaturedMatchCard
                  match={{
                    ...featured,
                    tournament_name: getTournament(featured)?.name || 'Tournament',
                    tournament_stage: undefined,
                    best_of: featured.best_of,
                  }}
                />
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="ui.label" tone="muted">ACTUALITÉS</Text>
                <Pressable onPress={() => router.push('/news')} hitSlop={8}>
                  <Text variant="ui.label" tone="accent">Voir tout</Text>
                </Pressable>
              </View>
              {news.length === 0 ? (
                <Text variant="ui.caption" tone="muted" style={styles.empty}>
                  Chargement des actualités…
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.newsScroll}
                >
                  {news.slice(0, 8).map((n) => (
                    <NewsCard key={n.id} item={n} />
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="ui.label" tone="muted">MATCHS DU JOUR</Text>
                <Pressable
                  onPress={() => router.push('/matchs')}
                  hitSlop={8}
                  style={styles.viewAllBtn}
                >
                  <Text variant="ui.label" tone="accent">Tout voir</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.accent.indigo} />
                </Pressable>
              </View>
              <View style={styles.compactList}>
                {todayMatches.length === 0 ? (
                  <Text variant="ui.body" tone="muted" style={styles.empty}>
                    Aucun match aujourd'hui
                  </Text>
                ) : (
                  todayMatches.map((m) => (
                    <CompactMatchCard
                      key={m.id}
                      match={{ ...m, tournament_name: getTournament(m)?.name || 'Tournament' }}
                    />
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  scroll: { paddingBottom: 80 },
  intro: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  compactList: {
    gap: Spacing.sm,
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  empty: { textAlign: 'center', paddingVertical: Spacing.xl },
});
