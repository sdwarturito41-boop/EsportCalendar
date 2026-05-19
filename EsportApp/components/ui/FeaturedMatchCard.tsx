import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from './Text';
import { TeamLogo } from './TeamLogo';
import { MatchRowMatch } from './MatchRow';

export interface FeaturedMatchProps {
  match: MatchRowMatch & { tournament_name: string; tournament_stage?: string; best_of?: number };
}

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const FeaturedMatchCard: React.FC<FeaturedMatchProps> = ({ match }) => {
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
    <Pressable onPress={() => router.push(`/match/${match.id}`)} style={styles.card}>
      <View style={styles.header}>
        <Text variant="ui.body" tone="accent" numberOfLines={1} style={styles.tournamentName}>
          {match.tournament_name}
        </Text>
        {match.tournament_stage ? (
          <Text variant="ui.caption" tone="muted">
            {match.tournament_stage}
            {match.best_of ? ` · BO${match.best_of}` : ''}
          </Text>
        ) : match.best_of ? (
          <Text variant="ui.caption" tone="muted">{`BO${match.best_of}`}</Text>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.teamRow}>
          <TeamLogo uri={match.opponent1_logo} name={match.opponent1_name} size={40} />
          <Text variant="ui.title" numberOfLines={1} style={styles.name}>
            {match.opponent1_name || 'TBD'}
          </Text>
          {showScore ? (
            <Text variant="display.big" tone={winner === 2 ? 'muted' : 'primary'} style={styles.score}>
              {match.opponent1_score}
            </Text>
          ) : (
            <Text variant="display.time" tone="muted">{formatTime(match.begin_at)}</Text>
          )}
        </View>
        <View style={styles.teamRow}>
          <TeamLogo uri={match.opponent2_logo} name={match.opponent2_name} size={40} />
          <Text variant="ui.title" numberOfLines={1} style={styles.name}>
            {match.opponent2_name || 'TBD'}
          </Text>
          {showScore && (
            <Text variant="display.big" tone={winner === 1 ? 'muted' : 'primary'} style={styles.score}>
              {match.opponent2_score}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    gap: 2,
  },
  tournamentName: { fontFamily: 'Geist-Bold' },
  body: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  name: { flex: 1 },
  score: { fontSize: 32 },
});
