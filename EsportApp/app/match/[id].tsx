import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors, Spacing, Radii } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/ui/Text';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { StreamEmbed } from '@/components/ui/StreamEmbed';

interface Tournament {
  id: string;
  name: string;
  image_url?: string;
  game?: string;
}

interface MatchDetail {
  id: string;
  tournament_id: string;
  begin_at: string;
  status: 'not_started' | 'running' | 'finished';
  best_of: number;
  opponent1_name: string;
  opponent1_acronym?: string | null;
  opponent1_logo: string | null;
  opponent1_score: number;
  opponent2_name: string;
  opponent2_acronym?: string | null;
  opponent2_logo: string | null;
  opponent2_score: number;
  stream_url: string | null;
  tournaments: Tournament;
}

const ExternalStatsButton: React.FC<{ source: string; url: string }> = ({ source, url }) => (
  <Pressable
    onPress={() => Linking.openURL(url).catch(() => {})}
    style={({ pressed }) => [styles.externalBtn, pressed && { opacity: 0.85 }]}
  >
    <MaterialCommunityIcons name="chart-bar" size={18} color={Colors.text.primary} />
    <Text variant="ui.body" tone="primary" style={{ flex: 1 }}>
      Stats complètes sur {source}
    </Text>
    <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.text.muted} />
  </Pressable>
);

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
};
const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

type TabKey = 'resume' | 'parties' | 'rosters';

// Pour chaque jeu : URL externe vers les stats complètes (map names,
// scores per map, K/D/A/ACS). Free plan Pandascore ne les expose pas,
// donc on délègue au site de référence de la communauté.
const buildStatsUrl = (game: string | undefined, team1: string, team2: string): string => {
  const q = encodeURIComponent(`${team1} ${team2}`);
  switch ((game || '').toLowerCase()) {
    case 'valorant':
      return `https://www.vlr.gg/search?q=${q}`;
    case 'cs2':
      return `https://www.hltv.org/search?query=${q}`;
    case 'lol':
      return `https://liquipedia.net/leagueoflegends/index.php?search=${q}`;
    case 'rl':
      return `https://liquipedia.net/rocketleague/index.php?search=${q}`;
    case 'dota2':
      return `https://liquipedia.net/dota2/index.php?search=${q}`;
    case 'ow':
      return `https://liquipedia.net/overwatch/index.php?search=${q}`;
    case 'r6':
      return `https://liquipedia.net/rainbowsix/index.php?search=${q}`;
    case 'cod':
      return `https://liquipedia.net/callofduty/index.php?search=${q}`;
    default:
      return `https://liquipedia.net/index.php?search=${q}`;
  }
};

const statsSourceLabel = (game: string | undefined): string => {
  switch ((game || '').toLowerCase()) {
    case 'valorant': return 'VLR.gg';
    case 'cs2': return 'HLTV.org';
    default: return 'Liquipedia';
  }
};

interface MatchMap {
  position: number;
  map_name: string | null;
  score1: number;
  score2: number;
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [maps, setMaps] = useState<MatchMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('resume');

  const fetchMatch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase
        .from('matches')
        .select('*, tournaments(*)')
        .eq('id', id)
        .single();
      if (e) throw e;
      setMatch(data as MatchDetail);
      const { data: mapRows } = await supabase
        .from('match_maps')
        .select('position, map_name, score1, score2')
        .eq('match_id', id)
        .order('position', { ascending: true });
      setMaps((mapRows || []) as MatchMap[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent.indigo} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !match) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
          <MaterialCommunityIcons name="alert-circle-outline" size={44} color={Colors.semantic.loss} />
          <Text variant="ui.title" tone="primary">Erreur</Text>
          <Text variant="ui.caption" tone="muted">{error || 'Match introuvable'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFinished = match.status === 'finished';
  const isLive = match.status === 'running';
  const showScore = isFinished || isLive;
  const winner = isFinished
    ? match.opponent1_score > match.opponent2_score
      ? 1
      : match.opponent1_score < match.opponent2_score
      ? 2
      : 0
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text variant="ui.label" tone="muted" numberOfLines={1}>
              {match.tournaments?.name || 'Match'}
            </Text>
            <Text variant="ui.caption" tone="muted" style={{ marginTop: 2 }}>
              BO{match.best_of} · {formatDate(match.begin_at)} · {formatTime(match.begin_at)}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Stream (live) */}
        {isLive && match.stream_url && <StreamEmbed url={match.stream_url} />}

        {/* Score section */}
        <View style={styles.scoreSection}>
          <View style={styles.teamCol}>
            <TeamLogo uri={match.opponent1_logo} name={match.opponent1_name} size={72} />
            <Text
              variant="ui.body"
              tone={winner === 2 ? 'muted' : 'primary'}
              numberOfLines={2}
              style={styles.teamName}
            >
              {match.opponent1_name}
            </Text>
          </View>

          <View style={styles.scoreCenter}>
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text variant="ui.label" tone="live" style={styles.liveLabel}>LIVE</Text>
              </View>
            )}
            {showScore ? (
              <View style={styles.scoreRow}>
                <Text
                  variant="display.big"
                  tone={winner === 2 ? 'muted' : 'primary'}
                  style={styles.scoreNum}
                >
                  {match.opponent1_score}
                </Text>
                <Text variant="display.big" tone="muted" style={styles.scoreSep}>–</Text>
                <Text
                  variant="display.big"
                  tone={winner === 1 ? 'muted' : 'primary'}
                  style={styles.scoreNum}
                >
                  {match.opponent2_score}
                </Text>
              </View>
            ) : (
              <Text variant="display.big" tone="primary">{formatTime(match.begin_at)}</Text>
            )}
          </View>

          <View style={styles.teamCol}>
            <TeamLogo uri={match.opponent2_logo} name={match.opponent2_name} size={72} />
            <Text
              variant="ui.body"
              tone={winner === 1 ? 'muted' : 'primary'}
              numberOfLines={2}
              style={styles.teamName}
            >
              {match.opponent2_name}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['resume', 'parties', 'rosters'] as const).map((t) => (
            <Pressable key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
              <Text variant="ui.label" tone={tab === t ? 'accent' : 'muted'}>
                {t === 'resume' ? 'Résumé' : t === 'parties' ? 'Parties' : 'Rosters'}
              </Text>
              {tab === t && <View style={styles.tabUnderline} />}
            </Pressable>
          ))}
        </View>

        {tab === 'resume' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text variant="ui.label" tone="muted">Statut</Text>
                <Text variant="ui.body" tone="primary">
                  {isFinished ? 'Terminé' : isLive ? 'En direct' : 'À venir'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text variant="ui.label" tone="muted">Format</Text>
                <Text variant="ui.body" tone="primary">{`Best of ${match.best_of}`}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text variant="ui.label" tone="muted">Date</Text>
                <Text variant="ui.body" tone="primary">
                  {formatDate(match.begin_at)} · {formatTime(match.begin_at)}
                </Text>
              </View>
            </View>

            {match.stream_url && (
              <Pressable
                onPress={() => Linking.openURL(match.stream_url!).catch(() => {})}
                style={styles.streamButton}
              >
                <MaterialCommunityIcons
                  name={isLive ? 'play-circle' : 'video-outline'}
                  size={20}
                  color={Colors.text.primary}
                />
                <Text variant="ui.body" tone="primary" style={{ flex: 1 }}>
                  {isLive ? 'Regarder le stream live' : 'Voir le VOD / replay'}
                </Text>
                <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.text.muted} />
              </Pressable>
            )}
          </View>
        )}

        {tab === 'parties' && (
          <View style={styles.tabContent}>
            {!showScore ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="clock-outline" size={40} color={Colors.text.muted} />
                <Text variant="ui.body" tone="muted">Match pas encore commencé</Text>
              </View>
            ) : maps.length > 0 ? (
              <View style={styles.mapsList}>
                {maps.map((m) => {
                  const won1 = m.score1 > m.score2;
                  const won2 = m.score2 > m.score1;
                  return (
                    <View key={m.position} style={styles.mapCard}>
                      <View style={styles.mapLeft}>
                        <Text variant="ui.label" tone="muted">{`M${m.position}`}</Text>
                        <Text variant="ui.body" tone="primary" style={styles.mapName}>
                          {m.map_name || `Map ${m.position}`}
                        </Text>
                      </View>
                      <View style={styles.mapScore}>
                        <Text
                          variant="display.score"
                          tone={won1 ? 'primary' : 'muted'}
                          style={styles.mapScoreNum}
                        >
                          {m.score1}
                        </Text>
                        <Text variant="display.score" tone="muted">–</Text>
                        <Text
                          variant="display.score"
                          tone={won2 ? 'primary' : 'muted'}
                          style={styles.mapScoreNum}
                        >
                          {m.score2}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text variant="ui.body" tone="primary" style={{ marginBottom: Spacing.sm }}>
                  {`Best of ${match.best_of} · ${match.opponent1_score + match.opponent2_score} parties jouées`}
                </Text>
                {Array.from({ length: match.opponent1_score + match.opponent2_score }).map(
                  (_, i) => (
                    <View key={i} style={styles.gameRow}>
                      <Text variant="ui.caption" tone="muted">Partie {i + 1}</Text>
                      <Text variant="ui.label" tone="muted">—</Text>
                    </View>
                  ),
                )}
                <View style={styles.notice}>
                  <MaterialCommunityIcons name="information-outline" size={14} color={Colors.text.muted} />
                  <Text variant="ui.caption" tone="muted" style={{ flex: 1 }}>
                    Détails par map en cours d'agrégation depuis VLR.gg. Reviens plus tard ou ouvre le lien externe.
                  </Text>
                </View>
              </View>
            )}
            <ExternalStatsButton
              source={statsSourceLabel(match.tournaments?.game)}
              url={buildStatsUrl(match.tournaments?.game, match.opponent1_name, match.opponent2_name)}
            />
          </View>
        )}

        {tab === 'rosters' && (
          <View style={styles.tabContent}>
            <View style={styles.notice}>
              <MaterialCommunityIcons name="information-outline" size={14} color={Colors.text.muted} />
              <Text variant="ui.caption" tone="muted" style={{ flex: 1 }}>
                Compositions et stats joueurs (K/D/A/ACS) pas exposées par Pandascore free.
                Retrouve-les sur {statsSourceLabel(match.tournaments?.game)}.
              </Text>
            </View>
            <ExternalStatsButton
              source={statsSourceLabel(match.tournaments?.game)}
              url={buildStatsUrl(match.tournaments?.game, match.opponent1_name, match.opponent2_name)}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.bg.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  teamCol: { flex: 1, alignItems: 'center', gap: Spacing.md },
  teamName: { textAlign: 'center' },
  scoreCenter: { minWidth: 120, alignItems: 'center', gap: Spacing.xs },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNum: { fontSize: 56, lineHeight: 60 },
  scoreSep: { marginHorizontal: Spacing.sm, fontSize: 48 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.semantic.live },
  liveLabel: { fontSize: 10, letterSpacing: 1.5 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    marginHorizontal: Spacing.lg,
  },
  tabBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', position: 'relative' },
  tabUnderline: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: -1,
    height: 2,
    backgroundColor: Colors.accent.indigo,
    borderRadius: 2,
  },
  tabContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, gap: Spacing.md },
  infoCard: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  divider: { height: 1, backgroundColor: Colors.border.subtle },
  streamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  gameWinner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emptyState: { paddingVertical: 64, alignItems: 'center', gap: Spacing.md },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.accent.indigo,
  },
  mapsList: { gap: Spacing.sm },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    gap: Spacing.md,
  },
  mapLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  mapName: {},
  mapScore: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  mapScoreNum: { fontSize: 20 },
});
