import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
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
}

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Fallback acronym si Pandascore n'en a pas : 4 premières lettres uppercase
// (sans les espaces, en virant les mots type "Esports", "Team", etc.)
const computeAcronym = (name: string): string => {
  if (!name || name === 'TBD') return 'TBD';
  const cleaned = name
    .replace(/\b(Esports?|Gaming|Team|Club|Academy|Aca|Roster)\b/gi, '')
    .trim();
  const finalName = cleaned || name;
  const words = finalName.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
};

export const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
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
  const bo = match.best_of ? `BO${match.best_of}` : '/';

  return (
    <Pressable onPress={() => router.push(`/match/${match.id}`)} style={styles.row}>
      <View style={styles.left}>
        <Text variant="display.score" tone="primary" style={styles.time}>
          {formatTime(match.begin_at)}
        </Text>
        {isLive && (
          <View style={styles.liveDotRow}>
            <View style={styles.liveDot} />
            <Text variant="ui.label" tone="live" style={styles.liveLabel}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.matchup}>
        <Text variant="display.score" tone="primary" numberOfLines={1} style={styles.acronym}>
          {ac1}
        </Text>
        <TeamLogo uri={match.opponent1_logo} name={match.opponent1_name} size={28} />
        {showScore ? (
          <View style={styles.scoreCenter}>
            <Text variant="display.score" tone={winner === 2 ? 'muted' : 'primary'} style={styles.scoreNum}>
              {match.opponent1_score}
            </Text>
            <Text variant="display.score" tone="muted" style={styles.scoreSep}>–</Text>
            <Text variant="display.score" tone={winner === 1 ? 'muted' : 'primary'} style={styles.scoreNum}>
              {match.opponent2_score}
            </Text>
          </View>
        ) : (
          <Text variant="ui.label" tone="muted" style={styles.bo}>{bo}</Text>
        )}
        <TeamLogo uri={match.opponent2_logo} name={match.opponent2_name} size={28} />
        <Text variant="display.score" tone="primary" numberOfLines={1} style={styles.acronym}>
          {ac2}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    gap: Spacing.md,
  },
  left: {
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  time: { fontSize: 22, lineHeight: 24 },
  scoreCenter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 56,
    justifyContent: 'center',
  },
  scoreNum: { fontSize: 22, lineHeight: 24 },
  scoreSep: { marginHorizontal: 4 },
  liveDotRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.semantic.live },
  liveLabel: { fontSize: 9, letterSpacing: 1 },
  matchup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm + 2,
  },
  acronym: {
    fontSize: 20,
    lineHeight: 24,
    minWidth: 44,
    textAlign: 'center',
  },
  bo: {
    minWidth: 28,
    textAlign: 'center',
  },
});
