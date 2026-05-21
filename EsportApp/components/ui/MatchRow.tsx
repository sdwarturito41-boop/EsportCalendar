import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Text } from './Text';
import { TeamLogo } from './TeamLogo';

export interface MatchRowMatch {
  id: string;
  begin_at: string;
  status: 'not_started' | 'running' | 'finished';
  best_of?: number;
  opponent1_name: string;
  opponent1_acronym?: string | null;
  opponent1_logo: string | null;
  opponent1_score: number;
  opponent2_name: string;
  opponent2_acronym?: string | null;
  opponent2_logo: string | null;
  opponent2_score: number;
}

export interface MatchRowProps {
  match: MatchRowMatch;
  tournamentName?: string;
  tournamentLogo?: string | null;
}

// Tournaments → logos locaux. Premier match wins.
const TOURNAMENT_LOGO_RULES: { pattern: RegExp; logo: any }[] = [
  { pattern: /^EWC\b|esports world cup/i, logo: require('@/assets/images/logo-jeux/ewc-logo.png') },
  { pattern: /\bGC\b|game changers/i, logo: require('@/assets/images/logo-jeux/gamechangers.png') },
  { pattern: /\bRLCS\b/i, logo: require('@/assets/images/logo-jeux/RLCS.png') },
  { pattern: /cs asia|csasia/i, logo: require('@/assets/images/logo-jeux/csasia.png') },
  { pattern: /dreamleague|\bDDL\b/i, logo: require('@/assets/images/logo-jeux/dotaddl.png') },
];

const resolveTournamentLogo = (name?: string): any | null => {
  if (!name) return null;
  for (const { pattern, logo } of TOURNAMENT_LOGO_RULES) {
    if (pattern.test(name)) return logo;
  }
  return null;
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const computeAcronym = (name: string): string => {
  if (!name || name === 'TBD') return 'TBD';
  const cleaned = name.replace(/\b(Esports?|Gaming|Team|Club|Academy|Aca|Roster)\b/gi, '').trim();
  const finalName = cleaned || name;
  const words = finalName.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
};

export const MatchRow: React.FC<MatchRowProps> = ({ match, tournamentName, tournamentLogo }) => {
  const router = useRouter();
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

  const ac1 = match.opponent1_acronym || computeAcronym(match.opponent1_name);
  const ac2 = match.opponent2_acronym || computeAcronym(match.opponent2_name);
  const bo = match.best_of || 0;
  const localLogo = resolveTournamentLogo(tournamentName);

  const team1Color = winner === 2 ? '#6A6A78' : '#F0F0F5';
  const team2Color = winner === 1 ? '#6A6A78' : '#F0F0F5';

  return (
    <Pressable
      onPress={() => router.push(`/match/${match.id}`)}
      style={[styles.card, isLive && styles.cardLive]}
    >
      <View style={styles.matchupRow}>
        {/* Team 1 */}
        <View style={[styles.teamSide, styles.teamLeft]}>
          <Text numberOfLines={1} style={[styles.acronym, { color: team1Color }]}>{ac1}</Text>
          <TeamLogo uri={match.opponent1_logo} name={match.opponent1_name} size={28} />
        </View>

        {/* Center */}
        <View style={styles.center}>
          {showScore ? (
            <View style={styles.scoreRow}>
              <Text style={[styles.score, winner === 2 && styles.scoreLoser]}>
                {match.opponent1_score}
              </Text>
              <Text style={[styles.score, styles.scoreSep]}>–</Text>
              <Text style={[styles.score, winner === 1 && styles.scoreLoser]}>
                {match.opponent2_score}
              </Text>
            </View>
          ) : (
            <Text style={styles.time}>{formatTime(match.begin_at)}</Text>
          )}
        </View>

        {/* Team 2 */}
        <View style={[styles.teamSide, styles.teamRight]}>
          <TeamLogo uri={match.opponent2_logo} name={match.opponent2_name} size={28} />
          <Text numberOfLines={1} style={[styles.acronym, { color: team2Color }]}>{ac2}</Text>
        </View>
      </View>

      {(tournamentName || bo > 0 || isLive) && (
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {isLive ? (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveLabel}>LIVE</Text>
              </View>
            ) : localLogo ? (
              <Image source={localLogo} style={styles.tournamentLogo} contentFit="contain" />
            ) : tournamentLogo ? (
              <Image source={{ uri: tournamentLogo }} style={styles.tournamentLogo} contentFit="contain" />
            ) : null}
            {!!tournamentName && (
              <Text numberOfLines={1} style={styles.tournamentName}>{tournamentName}</Text>
            )}
          </View>
          {bo > 0 && (
            <View style={styles.boBadge}>
              <Text style={styles.boLabel}>{`BO${bo}`}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141418',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  cardLive: {
    borderWidth: 1,
    borderColor: '#E8404A22',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLeft: { justifyContent: 'flex-end' },
  teamRight: { justifyContent: 'flex-start' },
  acronym: {
    fontFamily: 'Geist-Bold',
    fontSize: 14,
    lineHeight: 16,
  },
  center: {
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontFamily: 'Geist-Bold',
    fontSize: 13,
    lineHeight: 15,
    color: Colors.accent.indigo,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  score: {
    fontFamily: 'Geist-Bold',
    fontSize: 16,
    lineHeight: 18,
    color: '#F0F0F5',
  },
  scoreSep: { color: '#6A6A78', marginHorizontal: 4 },
  scoreLoser: { color: '#6A6A78' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E8404A',
  },
  liveLabel: {
    fontFamily: 'Geist-Bold',
    fontSize: 10,
    lineHeight: 12,
    color: '#E8404A',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tournamentLogo: { width: 12, height: 12 },
  tournamentName: {
    flex: 1,
    fontFamily: 'Geist-Medium',
    fontSize: 9,
    lineHeight: 11,
    color: '#3A3A44',
    letterSpacing: 0.3,
  },
  boBadge: {
    backgroundColor: '#1C1C20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  boLabel: {
    fontFamily: 'Geist-Bold',
    fontSize: 9,
    lineHeight: 11,
    color: '#6A6A78',
    letterSpacing: 0.5,
  },
});
