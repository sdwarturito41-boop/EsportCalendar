import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from './Text';
import { TeamLogo } from './TeamLogo';
import { LiveChip } from './LiveChip';
import { MatchRowMatch } from './MatchRow';

export interface CompactMatchCardProps {
  match: MatchRowMatch & { tournament_name: string };
}

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const CompactMatchCard: React.FC<CompactMatchCardProps> = ({ match }) => {
  const router = useRouter();
  const isLive = match.status === 'running';
  const isFinished = match.status === 'finished';
  const showScore = isLive || isFinished;

  return (
    <Pressable onPress={() => router.push(`/match/${match.id}`)} style={styles.card}>
      <View style={styles.top}>
        <Text variant="ui.caption" tone="muted" numberOfLines={1} style={styles.tourn}>
          {match.tournament_name}
        </Text>
        {isLive ? (
          <LiveChip />
        ) : (
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.text.muted} />
            <Text variant="ui.caption" tone="muted">
              {showScore ? `${match.opponent1_score} – ${match.opponent2_score}` : formatTime(match.begin_at)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.bottom}>
        <View style={styles.teamsRow}>
          <View style={styles.team}>
            <TeamLogo uri={match.opponent1_logo} name={match.opponent1_name} size={20} />
            <Text variant="ui.body" tone="primary" numberOfLines={1} style={styles.teamName}>
              {match.opponent1_name || 'TBD'}
            </Text>
          </View>
          <Text variant="ui.caption" tone="muted">vs</Text>
          <View style={styles.team}>
            <TeamLogo uri={match.opponent2_logo} name={match.opponent2_name} size={20} />
            <Text variant="ui.body" tone="primary" numberOfLines={1} style={styles.teamName}>
              {match.opponent2_name || 'TBD'}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.text.muted} />
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
    padding: Spacing.md + 1,
    gap: Spacing.sm + 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tourn: { flex: 1, paddingRight: Spacing.sm },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  teamsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  team: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1 },
  teamName: { flexShrink: 1 },
});
