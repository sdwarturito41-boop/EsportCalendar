import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radii } from '@/constants/theme';
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

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const EWC_LOGO = require('@/assets/images/logo-jeux/ewc-logo.png');
const isEWC = (name?: string) =>
  !!name && (/^EWC\b/i.test(name) || /esports world cup/i.test(name));

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

  return (
    <Pressable onPress={() => router.push(`/match/${match.id}`)} style={styles.card}>
      <View style={styles.matchupRow}>
        {/* Team 1 */}
        <View style={[styles.teamSide, styles.teamLeft]}>
          <Text variant="display.score" tone="primary" numberOfLines={1} style={styles.acronym}>
            {ac1}
          </Text>
          <TeamLogo uri={match.opponent1_logo} name={match.opponent1_name} size={40} />
        </View>

        {/* Center : score si joué, sinon heure */}
        <View style={styles.center}>
          {showScore ? (
            <View style={styles.scoreRow}>
              <Text variant="display.score" tone={winner === 2 ? 'muted' : 'primary'} style={styles.bigText}>
                {match.opponent1_score}
              </Text>
              <Text variant="display.score" tone="muted" style={styles.scoreSep}>–</Text>
              <Text variant="display.score" tone={winner === 1 ? 'muted' : 'primary'} style={styles.bigText}>
                {match.opponent2_score}
              </Text>
            </View>
          ) : (
            <Text variant="display.score" tone="primary" style={styles.bigText}>
              {formatTime(match.begin_at)}
            </Text>
          )}
        </View>

        {/* Team 2 */}
        <View style={[styles.teamSide, styles.teamRight]}>
          <TeamLogo uri={match.opponent2_logo} name={match.opponent2_name} size={40} />
          <Text variant="display.score" tone="primary" numberOfLines={1} style={styles.acronym}>
            {ac2}
          </Text>
        </View>
      </View>

      {(tournamentName || bo > 0 || isLive) && (
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {isLive ? (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text variant="ui.label" tone="live" style={styles.liveLabel}>LIVE</Text>
              </View>
            ) : isEWC(tournamentName) ? (
              <Image source={EWC_LOGO} style={styles.tournamentLogo} contentFit="contain" />
            ) : tournamentLogo ? (
              <Image source={{ uri: tournamentLogo }} style={styles.tournamentLogo} contentFit="contain" />
            ) : (
              <View style={styles.tournamentLogoPlaceholder} />
            )}
            {!!tournamentName && (
              <Text variant="ui.caption" tone="muted" numberOfLines={1} style={styles.tournamentName}>
                {tournamentName}
              </Text>
            )}
          </View>
          {bo > 0 && (
            <Text variant="ui.label" tone="muted">{`BO${bo}`}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    minHeight: 80,
  },
  teamSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  teamLeft: { justifyContent: 'flex-end' },
  teamRight: { justifyContent: 'flex-start' },
  acronym: {
    fontSize: 20,
    lineHeight: 24,
  },
  center: {
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreSep: { marginHorizontal: 6, fontSize: 22 },
  bigText: { fontSize: 26, lineHeight: 28 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    gap: Spacing.sm,
  },
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.semantic.live },
  liveLabel: { fontSize: 10, letterSpacing: 1.5 },
  tournamentLogo: { width: 16, height: 16 },
  tournamentLogoPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: Radii.sm,
    backgroundColor: Colors.border.subtle,
  },
  tournamentName: { flex: 1 },
});
