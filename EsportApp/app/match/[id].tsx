import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Image } from 'expo-image';
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
  opponent1_id: number | null;
  opponent1_name: string;
  opponent1_acronym?: string | null;
  opponent1_logo: string | null;
  opponent1_score: number;
  opponent2_id: number | null;
  opponent2_name: string;
  opponent2_acronym?: string | null;
  opponent2_logo: string | null;
  opponent2_score: number;
  stream_url: string | null;
  tournaments: Tournament;
}

interface MatchMap {
  position: number;
  map_name: string | null;
  score1: number;
  score2: number;
}

interface MapPlayerStat {
  map_position: number;
  team_side: number;
  player_name: string;
  agent: string | null;
  rating: number | null;
  acs: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  kast: string | null;
  adr: number | null;
  hs_pct: string | null;
  fk: number | null;
  fd: number | null;
}

interface OverallPlayerStat {
  team_side: number;
  player_name: string;
  acs: number | null;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
};

const buildStatsUrl = (game: string | undefined, team1: string, team2: string): string => {
  const q = encodeURIComponent(`${team1} ${team2}`);
  switch ((game || '').toLowerCase()) {
    case 'valorant': return `https://www.vlr.gg/search?q=${q}`;
    case 'cs2': return `https://www.hltv.org/search?query=${q}`;
    case 'lol': return `https://liquipedia.net/leagueoflegends/index.php?search=${q}`;
    case 'rl': return `https://liquipedia.net/rocketleague/index.php?search=${q}`;
    case 'dota2': return `https://liquipedia.net/dota2/index.php?search=${q}`;
    case 'ow': return `https://liquipedia.net/overwatch/index.php?search=${q}`;
    case 'r6': return `https://liquipedia.net/rainbowsix/index.php?search=${q}`;
    case 'cod': return `https://liquipedia.net/callofduty/index.php?search=${q}`;
    default: return `https://liquipedia.net/index.php?search=${q}`;
  }
};

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [maps, setMaps] = useState<MatchMap[]>([]);
  const [mapStats, setMapStats] = useState<MapPlayerStat[]>([]);
  const [overallStats, setOverallStats] = useState<OverallPlayerStat[]>([]);
  const [selectedMap, setSelectedMap] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const [mapsRes, mapStatsRes, overallRes] = await Promise.all([
        supabase
          .from('match_maps')
          .select('position, map_name, score1, score2')
          .eq('match_id', id)
          .order('position', { ascending: true }),
        supabase
          .from('match_player_map_stats')
          .select('map_position, team_side, player_name, agent, rating, acs, kills, deaths, assists, kast, adr, hs_pct, fk, fd')
          .eq('match_id', id)
          .order('map_position', { ascending: true }),
        supabase
          .from('match_player_stats')
          .select('team_side, player_name, acs')
          .eq('match_id', id),
      ]);
      setMaps((mapsRes.data || []) as MatchMap[]);
      setMapStats((mapStatsRes.data || []) as MapPlayerStat[]);
      setOverallStats((overallRes.data || []) as OverallPlayerStat[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  // MVP de la série : meilleur ACS overall
  const mvp = useMemo(() => {
    if (!overallStats.length) return null;
    return overallStats.reduce((best, p) => {
      const a = best?.acs ?? -1;
      const b = p.acs ?? -1;
      return b > a ? p : best;
    }, overallStats[0]);
  }, [overallStats]);

  const currentMapStats = useMemo(
    () => mapStats.filter((s) => s.map_position === selectedMap),
    [mapStats, selectedMap],
  );

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
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
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

  const team1NameColor = winner === 2 ? '#6A6A78' : '#F0F0F5';
  const team2NameColor = winner === 1 ? '#6A6A78' : '#F0F0F5';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.text.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.tournamentText} numberOfLines={1}>
              {match.tournaments?.name || 'Match'}
            </Text>
            <Text style={styles.dateText} numberOfLines={1}>
              BO{match.best_of} · {formatDate(match.begin_at)}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Stream live embed */}
        {isLive && match.stream_url && <StreamEmbed url={match.stream_url} />}

        {/* Score hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroTeam}>
            <View style={styles.heroLogoWrap}>
              <TeamLogo uri={match.opponent1_logo} name={match.opponent1_name} size={52} />
            </View>
            <Text numberOfLines={2} style={[styles.heroName, { color: team1NameColor }]}>
              {match.opponent1_name}
            </Text>
          </View>
          <View style={styles.heroScore}>
            {showScore ? (
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreNum, { color: team1NameColor }]}>{match.opponent1_score}</Text>
                <Text style={[styles.scoreNum, styles.scoreSep]}>—</Text>
                <Text style={[styles.scoreNum, { color: team2NameColor }]}>{match.opponent2_score}</Text>
              </View>
            ) : (
              <Text style={styles.scoreNum}>
                {new Date(match.begin_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          <View style={styles.heroTeam}>
            <View style={styles.heroLogoWrap}>
              <TeamLogo uri={match.opponent2_logo} name={match.opponent2_name} size={52} />
            </View>
            <Text numberOfLines={2} style={[styles.heroName, { color: team2NameColor }]}>
              {match.opponent2_name}
            </Text>
          </View>
        </View>

        {/* Map selector */}
        {showScore && maps.length > 0 && (
          <View style={styles.mapSelector}>
            {maps.map((m) => {
              const isActive = m.position === selectedMap;
              return (
                <Pressable
                  key={m.position}
                  onPress={() => setSelectedMap(m.position)}
                  style={[styles.mapBtn, isActive && styles.mapBtnActive]}
                >
                  <Text style={[styles.mapBtnLabel, isActive && styles.mapBtnLabelActive]}>
                    MAP {m.position}
                  </Text>
                  <Text style={[styles.mapBtnName, isActive && styles.mapBtnNameActive]} numberOfLines={1}>
                    {m.map_name || '—'}
                  </Text>
                  <Text style={[styles.mapBtnScore, isActive && styles.mapBtnScoreActive]}>
                    {m.score1}—{m.score2}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Stats tables (par map sélectionnée) */}
        {currentMapStats.length > 0 && (
          <>
            <StatsTable
              teamName={match.opponent1_name}
              teamScore={maps.find((m) => m.position === selectedMap)?.score1 ?? 0}
              isMuted={winner === 2}
              players={currentMapStats.filter((p) => p.team_side === 1)}
            />
            <StatsTable
              teamName={match.opponent2_name}
              teamScore={maps.find((m) => m.position === selectedMap)?.score2 ?? 0}
              isMuted={winner === 1}
              players={currentMapStats.filter((p) => p.team_side === 2)}
            />
          </>
        )}

        {/* MVP card */}
        {mvp && isFinished && (
          <View style={styles.mvpCard}>
            <MaterialCommunityIcons name="star" size={20} color={Colors.accent.indigo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mvpLabel}>MVP SÉRIE</Text>
              <Text style={styles.mvpName}>{mvp.player_name}</Text>
            </View>
            <Text style={styles.mvpAcs}>{mvp.acs ?? '—'}</Text>
            <Text style={styles.mvpAcsLabel}>ACS</Text>
          </View>
        )}

        {/* VOD button */}
        {match.stream_url && (
          <Pressable
            onPress={() => Linking.openURL(match.stream_url!).catch(() => {})}
            style={({ pressed }) => [styles.vodBtn, pressed && { opacity: 0.85 }]}
          >
            <MaterialCommunityIcons
              name={isLive ? 'play-circle' : 'play-circle-outline'}
              size={20}
              color={Colors.text.primary}
            />
            <Text style={styles.vodLabel}>
              {isLive ? 'Regarder le stream live' : 'Voir le replay'}
            </Text>
            <MaterialCommunityIcons name="open-in-new" size={14} color={Colors.text.muted} />
          </Pressable>
        )}

        {/* External fallback */}
        {showScore && currentMapStats.length === 0 && (
          <Pressable
            onPress={() =>
              Linking.openURL(buildStatsUrl(match.tournaments?.game, match.opponent1_name, match.opponent2_name)).catch(() => {})
            }
            style={[styles.vodBtn, { marginTop: Spacing.sm }]}
          >
            <MaterialCommunityIcons name="chart-bar" size={20} color={Colors.text.primary} />
            <Text style={styles.vodLabel}>Stats complètes (source externe)</Text>
            <MaterialCommunityIcons name="open-in-new" size={14} color={Colors.text.muted} />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const StatsTable: React.FC<{
  teamName: string;
  teamScore: number;
  isMuted: boolean;
  players: MapPlayerStat[];
}> = ({ teamName, teamScore, isMuted, players }) => {
  const bestAcs = useMemo(
    () => players.reduce((max, p) => Math.max(max, p.acs ?? 0), 0),
    [players],
  );
  const nameColor = isMuted ? '#6A6A78' : '#F0F0F5';
  return (
    <View style={styles.statsTableWrap}>
      <View style={[styles.teamBar, isMuted && styles.teamBarMuted]} />
      <View style={styles.statsTable}>
        <View style={styles.statsHeader}>
          <Text style={[styles.statsTeamName, { color: nameColor }]} numberOfLines={1}>
            {teamName}
          </Text>
          <Text style={[styles.statsTeamScore, { color: nameColor }]}>{teamScore}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.statsColsHeader}>
              {['JOUEUR', 'AGENT', 'ACS', 'K', 'D', 'A', '+/-', 'ADR', 'HS', 'FK', 'FD', '+/-'].map((c, i) => (
                <Text key={i} style={[styles.colHeader, i === 0 && { width: 90 }, i === 1 && { width: 70 }]}>
                  {c}
                </Text>
              ))}
            </View>
            {players.map((p) => {
              const acsBest = (p.acs ?? 0) === bestAcs && bestAcs > 0;
              const kd = (p.kills ?? 0) - (p.deaths ?? 0);
              const fkd = (p.fk ?? 0) - (p.fd ?? 0);
              return (
                <View key={p.player_name} style={styles.statsRow}>
                  <Text style={[styles.cell, { width: 90, color: nameColor, fontFamily: 'Geist-Bold' }]} numberOfLines={1}>
                    {p.player_name}
                  </Text>
                  <Text style={[styles.cell, { width: 70, textTransform: 'capitalize' }]} numberOfLines={1}>
                    {p.agent || '—'}
                  </Text>
                  <Text style={[styles.cell, acsBest && styles.cellBold, { color: nameColor }]}>
                    {p.acs ?? '—'}
                  </Text>
                  <Text style={[styles.cell, { color: nameColor }]}>{p.kills ?? '—'}</Text>
                  <Text style={[styles.cell, { color: '#E8404A' }]}>{p.deaths ?? '—'}</Text>
                  <Text style={[styles.cell, { color: nameColor }]}>{p.assists ?? '—'}</Text>
                  <Text style={[styles.cell, { color: kd >= 0 ? '#1DB86E' : '#E8404A' }]}>
                    {kd >= 0 ? `+${kd}` : kd}
                  </Text>
                  <Text style={[styles.cell, { color: nameColor }]}>{p.adr ?? '—'}</Text>
                  <Text style={[styles.cell, { color: nameColor }]}>{p.hs_pct || '—'}</Text>
                  <Text style={[styles.cell, { color: nameColor }]}>{p.fk ?? '—'}</Text>
                  <Text style={[styles.cell, { color: nameColor }]}>{p.fd ?? '—'}</Text>
                  <Text style={[styles.cell, { color: fkd >= 0 ? '#1DB86E' : '#E8404A' }]}>
                    {fkd >= 0 ? `+${fkd}` : fkd}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: '#1C1C20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  tournamentText: {
    fontFamily: 'Geist-Bold',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#5C5CE8',
  },
  dateText: {
    fontFamily: 'Geist-Medium',
    fontSize: 11,
    lineHeight: 13,
    color: '#6A6A78',
  },

  // Hero
  heroSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  heroTeam: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  heroLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1C20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    fontFamily: 'Geist-Bold',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  heroScore: { minWidth: 100, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNum: {
    fontFamily: 'BebasNeue',
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: 1,
    color: '#F0F0F5',
  },
  scoreSep: { color: '#6A6A78', marginHorizontal: 4 },

  // Map selector
  mapSelector: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  mapBtn: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#1C1C20',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  mapBtnActive: { backgroundColor: '#5C5CE8' },
  mapBtnLabel: {
    fontFamily: 'Geist-Bold',
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1,
    color: '#6A6A78',
  },
  mapBtnLabelActive: { color: '#F0F0F5' },
  mapBtnName: {
    fontFamily: 'Geist-Bold',
    fontSize: 12,
    lineHeight: 14,
    color: '#6A6A78',
  },
  mapBtnNameActive: { color: '#F0F0F5' },
  mapBtnScore: {
    fontFamily: 'BebasNeue',
    fontSize: 13,
    lineHeight: 15,
    color: '#6A6A78',
  },
  mapBtnScoreActive: { color: '#F0F0F5' },

  // Stats table
  statsTableWrap: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  teamBar: {
    width: 4,
    backgroundColor: '#5C5CE8',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  teamBarMuted: { backgroundColor: '#3A3A44' },
  statsTable: {
    flex: 1,
    backgroundColor: '#141418',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A30',
  },
  statsTeamName: { fontFamily: 'Geist-Bold', fontSize: 13, flex: 1 },
  statsTeamScore: { fontFamily: 'BebasNeue', fontSize: 18, marginLeft: 8 },
  statsColsHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  colHeader: {
    width: 32,
    fontFamily: 'Geist-Bold',
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.5,
    color: '#3A3A44',
    textAlign: 'left',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cell: {
    width: 32,
    fontFamily: 'Geist-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#F0F0F5',
  },
  cellBold: { fontFamily: 'Geist-Bold' },

  // MVP
  mvpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#5C5CE822',
    borderWidth: 1,
    borderColor: '#5C5CE844',
    borderRadius: 10,
  },
  mvpLabel: {
    fontFamily: 'Geist-Bold',
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1.2,
    color: '#5C5CE8',
  },
  mvpName: { fontFamily: 'Geist-Bold', fontSize: 14, lineHeight: 18, color: '#F0F0F5', marginTop: 2 },
  mvpAcs: { fontFamily: 'BebasNeue', fontSize: 24, color: '#F0F0F5' },
  mvpAcsLabel: { fontFamily: 'Geist-Bold', fontSize: 9, color: '#6A6A78', letterSpacing: 1 },

  // VOD button
  vodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#1C1C20',
    borderWidth: 1,
    borderColor: '#2A2A30',
    borderRadius: 10,
  },
  vodLabel: { flex: 1, fontFamily: 'Geist-Medium', fontSize: 14, color: '#F0F0F5' },
});
