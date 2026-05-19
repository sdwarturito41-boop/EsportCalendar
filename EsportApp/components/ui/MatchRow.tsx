import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from './Text';
import { TeamLogo } from './TeamLogo';
import { LiveChip } from './LiveChip';

export interface MatchRowMatch {
  id: string;
  begin_at: string;
  status: 'not_started' | 'running' | 'finished';
  opponent1_name: string;
  opponent1_logo: string | null;
  opponent1_score: number;
  opponent2_name: string;
  opponent2_logo: string | null;
  opponent2_score: number;
}

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export interface MatchRowProps {
  match: MatchRowMatch;
}

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

  return (
    <Pressable onPress={() => router.push(`/match/${match.id}`)} style={styles.container}>
      <View style={styles.teamRow}>
        <TeamLogo uri={match.opponent1_logo} name={match.opponent1_name} size={28} />
        <Text variant="ui.teamName" numberOfLines={1} style={styles.name}>
          {match.opponent1_name || 'TBD'}
        </Text>
        {showScore ? (
          <Text variant="display.score" tone={winner === 2 ? 'muted' : 'primary'}>
            {match.opponent1_score}
          </Text>
        ) : (
          <Text variant="display.time" tone="muted">{formatTime(match.begin_at)}</Text>
        )}
      </View>
      <View style={styles.teamRow}>
        <TeamLogo uri={match.opponent2_logo} name={match.opponent2_name} size={28} />
        <Text variant="ui.teamName" numberOfLines={1} style={styles.name}>
          {match.opponent2_name || 'TBD'}
        </Text>
        {showScore && (
          <Text variant="display.score" tone={winner === 1 ? 'muted' : 'primary'}>
            {match.opponent2_score}
          </Text>
        )}
      </View>
      {isLive && (
        <View style={styles.liveContainer}>
          <LiveChip />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    gap: Spacing.md,
  },
  name: {
    flex: 1,
    color: Colors.text.primary,
  },
  liveContainer: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
});
