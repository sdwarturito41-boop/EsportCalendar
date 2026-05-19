import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';

import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { LiveChip } from '@/components/ui/LiveChip';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface Tournament {
  id: string;
  name: string;
  image_url?: string;
}

interface GameDetail {
  id: number;
  game_number: number;
  map_name: string | null;
  score1: number;
  score2: number;
  winner_id: number | null;
}

interface PlayerRoster {
  id: number;
  team_side: number;
  player_name: string;
  player_image: string | null;
  hero_name: string | null;
  kills: number;
  deaths: number;
  assists: number;
}

interface MatchDetail {
  id: string;
  tournament_id: string;
  begin_at: string;
  status: 'not_started' | 'running' | 'finished';
  best_of: number;
  opponent1_name: string;
  opponent1_logo: string | null;
  opponent1_score: number;
  opponent2_name: string;
  opponent2_logo: string | null;
  opponent2_score: number;
  stream_url: string | null;
  tournaments: Tournament;
  games: GameDetail[];
  rosters: PlayerRoster[];
}

type TabKey = 'resume' | 'maps' | 'rosters';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [matchData, setMatchData] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('resume');

  const fetchMatchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id) throw new Error('ID du match manquant');
      if (!supabase) throw new Error('Supabase non configuré');

      const { data, error: sbError } = await supabase
        .from('matches')
        .select(`*, tournaments(*), games(*), rosters(*)`)
        .eq('id', id)
        .single();

      if (sbError) throw sbError;
      if (!data) throw new Error('Match non trouvé');

      if (data.games) data.games.sort((a: any, b: any) => a.game_number - b.game_number);

      setMatchData(data as MatchDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatchDetail();
  }, [fetchMatchDetail]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent.indigo} />
          <Text variant="ui.caption" tone="muted" style={{ marginTop: Spacing.md }}>
            Chargement…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !matchData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
          <MaterialCommunityIcons name="alert-circle-outline" size={44} color={Colors.semantic.loss} />
          <Text variant="ui.title" tone="primary">Erreur</Text>
          <Text variant="ui.caption" tone="muted" style={{ textAlign: 'center' }}>
            {error || 'Match introuvable'}
          </Text>
          <Pressable style={styles.retryButton} onPress={fetchMatchDetail}>
            <Text variant="ui.label" tone="primary">Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const timeDisplay = new Date(matchData.begin_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isFinished = matchData.status === 'finished';
  const isLive = matchData.status === 'running';
  const showScore = isFinished || isLive;
  const winner = isFinished
    ? matchData.opponent1_score > matchData.opponent2_score
      ? 1
      : matchData.opponent1_score < matchData.opponent2_score
      ? 2
      : 0
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
          <Text variant="ui.label" tone="muted" numberOfLines={1} style={styles.tournamentText}>
            {matchData.tournaments?.name}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.scoreSection}>
          <View style={styles.teamHero}>
            <TeamLogo uri={matchData.opponent1_logo} name={matchData.opponent1_name} size={72} />
            <Text variant="ui.teamName" numberOfLines={2} style={styles.teamHeroName}>
              {matchData.opponent1_name}
            </Text>
          </View>

          <View style={styles.scoreCenter}>
            <Text variant="ui.label" tone="muted">{`BO${matchData.best_of}`}</Text>
            {showScore ? (
              <View style={styles.scoreRow}>
                <Text variant="display.big" tone={winner === 2 ? 'muted' : 'primary'}>
                  {matchData.opponent1_score}
                </Text>
                <Text variant="display.big" tone="muted" style={styles.scoreSep}>–</Text>
                <Text variant="display.big" tone={winner === 1 ? 'muted' : 'primary'}>
                  {matchData.opponent2_score}
                </Text>
              </View>
            ) : (
              <Text variant="display.big" tone="primary">{timeDisplay}</Text>
            )}
            {isLive && <View style={styles.liveWrap}><LiveChip /></View>}
          </View>

          <View style={styles.teamHero}>
            <TeamLogo uri={matchData.opponent2_logo} name={matchData.opponent2_name} size={72} />
            <Text variant="ui.teamName" numberOfLines={2} style={styles.teamHeroName}>
              {matchData.opponent2_name}
            </Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {(['resume', 'maps', 'rosters'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable key={tab} style={styles.tabButton} onPress={() => setActiveTab(tab)}>
                <Text variant="ui.label" tone={active ? 'accent' : 'muted'}>
                  {tab === 'resume' ? 'Résumé' : tab === 'maps' ? 'Parties' : 'Rosters'}
                </Text>
                {active && <View style={styles.tabUnderline} />}
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'resume' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text variant="ui.label" tone="muted">Statut</Text>
              <Text variant="ui.body" tone="primary" style={{ marginTop: Spacing.xs }}>
                {matchData.status === 'not_started'
                  ? 'À venir'
                  : matchData.status === 'running'
                  ? 'En direct'
                  : 'Terminé'}
              </Text>
            </View>

            {matchData.stream_url && (
              <View style={{ marginTop: Spacing.md }}>
                <Text variant="ui.label" tone="muted" style={{ marginBottom: Spacing.md }}>
                  Diffusion
                </Text>
                <Pressable
                  style={styles.streamButton}
                  onPress={() => Linking.openURL(matchData.stream_url!)}
                >
                  <MaterialCommunityIcons name="play-circle-outline" size={20} color={Colors.text.primary} />
                  <Text variant="ui.body" tone="primary" style={{ flex: 1 }}>
                    Voir le stream
                  </Text>
                  <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.text.muted} />
                </Pressable>
              </View>
            )}
          </View>
        )}

        {activeTab === 'maps' && (
          <View style={styles.tabContent}>
            {matchData.games?.length ? (
              matchData.games.map((game) => (
                <View key={game.id} style={styles.mapCard}>
                  <View style={styles.mapTeamInfo}>
                    <Text variant="ui.caption" tone="primary" numberOfLines={1}>
                      {matchData.opponent1_name}
                    </Text>
                    {game.winner_id === 1 && (
                      <MaterialCommunityIcons name="check-circle" size={14} color={Colors.semantic.live} />
                    )}
                  </View>
                  <View style={styles.mapCenter}>
                    <Text variant="ui.label" tone="muted">
                      {game.map_name || `Game ${game.game_number}`}
                    </Text>
                    <Text variant="display.score" tone="primary" style={{ marginTop: 2 }}>
                      {game.score1} – {game.score2}
                    </Text>
                  </View>
                  <View style={[styles.mapTeamInfo, { justifyContent: 'flex-end' }]}>
                    {game.winner_id === 2 && (
                      <MaterialCommunityIcons name="check-circle" size={14} color={Colors.semantic.live} />
                    )}
                    <Text variant="ui.caption" tone="primary" numberOfLines={1} style={{ textAlign: 'right' }}>
                      {matchData.opponent2_name}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="map-outline" size={40} color={Colors.text.muted} />
                <Text variant="ui.body" tone="muted">Aucune donnée de partie</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'rosters' && (
          <View style={styles.tabContent}>
            {matchData.rosters?.length ? (
              <View style={styles.rosterCols}>
                <View style={styles.rosterCol}>
                  {matchData.rosters.filter((r) => r.team_side === 1).map((p) => (
                    <RosterRow key={p.id} player={p} alignRight={false} />
                  ))}
                </View>
                <View style={styles.rosterCol}>
                  {matchData.rosters.filter((r) => r.team_side === 2).map((p) => (
                    <RosterRow key={p.id} player={p} alignRight />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group-outline" size={40} color={Colors.text.muted} />
                <Text variant="ui.body" tone="muted">Rosters non disponibles</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const RosterRow: React.FC<{ player: PlayerRoster; alignRight: boolean }> = ({ player, alignRight }) => {
  const initial = player.player_name?.charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.rosterRow, alignRight && { flexDirection: 'row-reverse' }]}>
      <View style={styles.rosterAvatar}>
        {player.player_image ? (
          <Image source={{ uri: player.player_image }} style={styles.rosterAvatarImg} />
        ) : (
          <Text variant="ui.label" tone="primary">{initial}</Text>
        )}
      </View>
      <View style={{ flex: 1, alignItems: alignRight ? 'flex-end' : 'flex-start' }}>
        <Text variant="ui.caption" tone="primary">{player.player_name}</Text>
        {!!player.hero_name && (
          <Text variant="ui.caption" tone="muted">{player.hero_name}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorWrap: {
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
  retryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.accent.indigo,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  tournamentText: { flex: 1, textAlign: 'center' },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  teamHero: { flex: 1, alignItems: 'center' },
  teamHeroName: { marginTop: Spacing.md, textAlign: 'center' },
  scoreCenter: { minWidth: 110, alignItems: 'center', gap: Spacing.xs },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreSep: { marginHorizontal: Spacing.sm },
  liveWrap: { marginTop: Spacing.xs },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    marginHorizontal: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabUnderline: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: -1,
    height: 2,
    backgroundColor: Colors.accent.indigo,
    borderRadius: 2,
  },
  tabContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg },
  infoCard: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    padding: Spacing.lg,
  },
  streamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  mapCard: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  mapTeamInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  mapCenter: { width: 90, alignItems: 'center' },
  emptyState: { paddingVertical: 64, alignItems: 'center', gap: Spacing.md },
  rosterCols: { flexDirection: 'row', gap: Spacing.md },
  rosterCol: { flex: 1, gap: Spacing.sm },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.surface,
    padding: Spacing.sm + 2,
    borderRadius: Radii.md,
  },
  rosterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rosterAvatarImg: { width: 32, height: 32, borderRadius: 16 },
});
