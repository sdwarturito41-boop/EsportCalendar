import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

// ==================== API CONFIGURATION ====================

const PANDASCORE_API_KEY = process.env.EXPO_PUBLIC_PANDASCORE_KEY;
const PANDASCORE_BASE_URL = 'https://api.pandascore.co';

// ==================== TYPES ====================

interface Player {
  id: number;
  name: string;
  image_url?: string | null;
}

interface TeamWithPlayers {
  id: number;
  name: string;
  image_url: string | null;
  players: Player[];
}

interface Opponent {
  opponent: {
    id: number;
    name: string;
    acronym?: string | null;
    image_url: string | null;
    players?: Player[];
  };
}

interface GameResult {
  team_id: number;
  score: number;
}

interface GameMap {
  id: number;
  name: string;
  image_url?: string | null;
}

interface Game {
  id: number;
  position: number;
  status: 'not_started' | 'running' | 'finished' | 'canceled';
  results?: GameResult[];
  winner?: {
    id: number;
    name: string;
  } | null;
  map?: GameMap;
}

interface MatchDetail {
  id: number;
  opponents: Opponent[];
  league: { name: string };
  serie?: { full_name: string };
  begin_at: string;
  status: 'not_started' | 'running' | 'finished' | 'canceled';
  number_of_games: number;
  results?: { score: number }[];
  games: Game[];
  streams_list?: { platform: string; url: string }[];
}

// ==================== DESIGN SYSTEM ====================

const COLORS = {
  bg: '#09090B',
  bgHeader: '#18181B',
  border: '#27272A',
  textMain: '#FAFAFA',
  textSecondary: '#A1A1AA',
  accent: '#FF4444',
  success: '#4ADE80',
};

// ==================== LOGO COMPONENT (SANS CADRE) ====================

interface TeamLogoProps {
  uri: string | null;
  size: number;
}

const TeamLogo: React.FC<TeamLogoProps> = ({ uri, size }) => {
  if (!uri) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: size * 0.4 }}>🎮</Text>
      </View>
    );
  }

  return (
    <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />
  );
};

// ==================== MAIN COMPONENT ====================

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [matchData, setMatchData] = useState<MatchDetail | null>(null);
  const [rosterData, setRosterData] = useState<TeamWithPlayers[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'maps' | 'rosters'>('resume');

  const fetchMatchDetail = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!PANDASCORE_API_KEY) throw new Error('Clé API PandaScore non configurée');
      if (!id) throw new Error('ID du match manquant');

      const [matchRes, rostersRes] = await Promise.all([
        fetch(`${PANDASCORE_BASE_URL}/matches/${id}`, {
          headers: { 'Authorization': `Bearer ${PANDASCORE_API_KEY}` },
        }),
        fetch(`${PANDASCORE_BASE_URL}/matches/${id}/opponents`, {
          headers: { 'Authorization': `Bearer ${PANDASCORE_API_KEY}` },
        })
      ]);

      if (!matchRes.ok) throw new Error(`Erreur API: ${matchRes.status}`);

      const matchJson = await matchRes.json();
      setMatchData(matchJson);

      if (rostersRes.ok) {
        const rostersJson = await rostersRes.json();
        if (rostersJson.opponents) setRosterData(rostersJson.opponents);
      }
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.textMain} />
          <Text style={styles.loadingText}>Chargement du match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !matchData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textMain} />
          </Pressable>
          <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.accent} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error || 'Match non trouvé'}</Text>
          <Pressable style={styles.retryButton} onPress={fetchMatchDetail}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const opponentA = matchData.opponents[0]?.opponent;
  const opponentB = matchData.opponents[1]?.opponent;
  const timeDisplay = new Date(matchData.begin_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const scoreDisplay = matchData.results?.length === 2 ? `${matchData.results[0].score}-${matchData.results[1].score}` : 'VS';
  const centerDisplay = matchData.status === 'not_started' ? timeDisplay : scoreDisplay;

  const teamARoster = rosterData?.find(t => t.id === opponentA?.id);
  const teamBRoster = rosterData?.find(t => t.id === opponentB?.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ==================== HERO HEADER ==================== */}
        <View style={styles.heroHeader}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textMain} />
            </Pressable>
            <Text style={styles.tournamentText} numberOfLines={1}>{matchData.serie?.full_name || matchData.league?.name}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scoreSection}>
            <View style={styles.teamHeroContainer}>
              <TeamLogo uri={opponentA?.image_url || null} size={80} />
              <Text style={styles.teamHeroName} numberOfLines={2}>{opponentA?.name || 'TBD'}</Text>
            </View>

            <View style={styles.scoreCenterContainer}>
              <Text style={styles.formatText}>{matchData.number_of_games > 0 ? `BO${matchData.number_of_games}` : 'BO?'}</Text>
              <Text style={styles.scoreTextHero}>{centerDisplay}</Text>
            </View>

            <View style={styles.teamHeroContainer}>
              <TeamLogo uri={opponentB?.image_url || null} size={80} />
              <Text style={styles.teamHeroName} numberOfLines={2}>{opponentB?.name || 'TBD'}</Text>
            </View>
          </View>
        </View>

        {/* ==================== TABS ==================== */}
        <View style={styles.tabsContainer}>
          {(['resume', 'maps', 'rosters'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                {tab === 'resume' ? 'Résumé' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ==================== TAB CONTENT ==================== */}
        
        {activeTab === 'resume' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>État du match</Text>
              <Text style={styles.infoValue}>
                {matchData.status === 'not_started' ? 'À venir' : matchData.status === 'running' ? 'En cours' : 'Terminé'}
              </Text>
            </View>

            {matchData.streams_list && matchData.streams_list.length > 0 && (
              <View style={styles.streamsContainer}>
                <Text style={styles.streamsTitle}>Regarder en direct</Text>
                {matchData.streams_list.map((stream, index) => (
                  <Pressable key={index} style={styles.streamButton} onPress={() => stream.url && Linking.openURL(stream.url)}>
                    <MaterialCommunityIcons
                      name={stream.platform?.toLowerCase().includes('twitch') ? 'twitch' : 'youtube'}
                      size={18}
                      color={COLORS.textMain}
                    />
                    <Text style={styles.streamButtonText}>{stream.platform || 'Stream'}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'maps' && (
          <View style={styles.tabContent}>
            {matchData.games && matchData.games.length > 0 ? (
              matchData.games.map((game, index) => {
                const isFinished = game.status === 'finished';
                const winnerId = game.winner?.id;
                const isTeamAWinner = winnerId === opponentA?.id;
                const isTeamBWinner = winnerId === opponentB?.id;

                return (
                  <View key={game.id} style={styles.mapCard}>
                    {/* Team A */}
                    <View style={[styles.mapTeamInfo, isFinished && !isTeamAWinner && { opacity: 0.4 }]}>
                      <Image source={{ uri: opponentA?.image_url || '' }} style={styles.mapTeamLogo} />
                      <Text style={styles.mapTeamName} numberOfLines={1}>{opponentA?.name}</Text>
                      {isTeamAWinner && <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />}
                    </View>

                    {/* Center */}
                    <View style={styles.mapCenterInfo}>
                      <Text style={styles.mapGameLabel}>{game.map?.name || `Map ${index + 1}`}</Text>
                      {isFinished && game.results && game.results.length >= 2 && (
                        <Text style={styles.mapGameScore}>
                          {game.results.find(r => r.team_id === opponentA?.id)?.score || 0} - {game.results.find(r => r.team_id === opponentB?.id)?.score || 0}
                        </Text>
                      )}
                      {!isFinished && <Text style={styles.mapStatusBadge}>{game.status === 'running' ? 'LIVE' : 'À VENIR'}</Text>}
                    </View>

                    {/* Team B */}
                    <View style={[styles.mapTeamInfo, isFinished && !isTeamBWinner && { opacity: 0.4 }, { justifyContent: 'flex-end' }]}>
                      {isTeamBWinner && <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />}
                      <Text style={[styles.mapTeamName, { textAlign: 'right' }]} numberOfLines={1}>{opponentB?.name}</Text>
                      <Image source={{ uri: opponentB?.image_url || '' }} style={styles.mapTeamLogo} />
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="map-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.noDataText}>Aucune map disponible</Text>
              </View>
            )}
            <Text style={styles.statsDisclaimer}>Source des données : PandaScore</Text>
          </View>
        )}

        {activeTab === 'rosters' && (
          <View style={styles.tabContent}>
            {(!teamARoster?.players?.length && !teamBRoster?.players?.length) ? (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="account-group-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.noDataText}>Roster non disponible pour ce match</Text>
              </View>
            ) : (
              <View style={styles.rosterColumnsContainer}>
                <View style={styles.rosterColumn}>
                  {teamARoster?.players?.map((p) => (
                    <View key={p.id} style={styles.rosterPlayerRow}>
                      {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.rosterPlayerAvatar} /> : (
                        <View style={styles.rosterPlayerAvatarPlaceholder}><Text style={styles.rosterPlayerInitial}>{p.name.charAt(0)}</Text></View>
                      )}
                      <Text style={styles.rosterPlayerName} numberOfLines={1}>{p.name}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.rosterColumn}>
                  {teamBRoster?.players?.map((p) => (
                    <View key={p.id} style={[styles.rosterPlayerRow, { justifyContent: 'flex-end' }]}>
                      <Text style={[styles.rosterPlayerName, { textAlign: 'right' }]} numberOfLines={1}>{p.name}</Text>
                      {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.rosterPlayerAvatar} /> : (
                        <View style={styles.rosterPlayerAvatarPlaceholder}><Text style={styles.rosterPlayerInitial}>{p.name.charAt(0)}</Text></View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 24 },
  errorTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textMain },
  errorMessage: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.bgHeader, justifyContent: 'center', alignItems: 'center' },
  retryButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 8 },
  retryButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  heroHeader: { backgroundColor: COLORS.bg },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  tournamentText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center', textTransform: 'uppercase' },
  scoreSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  teamHeroContainer: { flex: 1, alignItems: 'center' },
  teamHeroName: { marginTop: 8, fontSize: 14, fontWeight: '700', color: COLORS.textMain, textAlign: 'center' },
  scoreCenterContainer: { minWidth: 100, alignItems: 'center' },
  formatText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  scoreTextHero: { fontSize: 36, fontWeight: '900', color: COLORS.textMain, textAlign: 'center' },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginHorizontal: 12 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: COLORS.accent },
  tabButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabButtonTextActive: { color: COLORS.textMain },
  tabContent: { paddingHorizontal: 12, paddingVertical: 16 },
  infoCard: { backgroundColor: COLORS.bgHeader, borderRadius: 8, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  infoLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
  infoValue: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  streamsContainer: { marginTop: 8 },
  streamsTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 12 },
  streamButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgHeader, borderRadius: 8, padding: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  streamButtonText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  mapCard: { backgroundColor: '#18181B', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mapTeamInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapTeamLogo: { width: 24, height: 24, resizeMode: 'contain' },
  mapTeamName: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.textMain },
  mapCenterInfo: { width: 80, alignItems: 'center' },
  mapGameLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase' },
  mapGameScore: { fontSize: 14, fontWeight: '800', color: COLORS.textMain, marginVertical: 2 },
  mapStatusBadge: { fontSize: 10, fontWeight: '800', color: COLORS.accent, marginTop: 4 },
  statsDisclaimer: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
  rosterColumnsContainer: { flexDirection: 'row', gap: 12 },
  rosterColumn: { flex: 1, gap: 8 },
  rosterPlayerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgHeader, padding: 8, borderRadius: 8 },
  rosterPlayerAvatar: { width: 32, height: 32, borderRadius: 16 },
  rosterPlayerAvatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  rosterPlayerInitial: { fontSize: 12, fontWeight: '700', color: COLORS.textMain },
  rosterPlayerName: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.textMain },
  noDataContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 64, gap: 16 },
  noDataText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
});
