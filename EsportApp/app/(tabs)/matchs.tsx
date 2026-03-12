import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ==================== API CONFIGURATION ====================

const PANDASCORE_API_KEY = process.env.EXPO_PUBLIC_PANDASCORE_KEY;
const PANDASCORE_BASE_URL = 'https://api.pandascore.co';

// ==================== TYPES ====================

interface Opponent {
  opponent: {
    name: string;
    acronym?: string | null;
    image_url: string | null;
  };
}

interface Match {
  id: number;
  opponents: Opponent[];
  league: { name: string; tier?: string };
  tournament?: { tier?: string };
  serie?: { full_name: string };
  begin_at: string;
  status: 'not_started' | 'running' | 'finished' | 'canceled';
  results?: { score: number }[];
  isLive?: boolean;
}

interface TournamentGroup {
  leagueName: string;
  tier: string;
  matches: Match[];
}

// ==================== TIER PRIORITY ====================

const tierPriority: Record<string, number> = {
  's': 1,
  'a': 2,
  'b': 3,
  'c': 4,
  'd': 5,
  'unranked': 6,
};

/**
 * Extract tier from match - Le tier est dans match.tournament.tier
 */
const getMatchTier = (match: Match): string => {
  // Le tier se trouve dans tournament.tier
  const tier = (match.tournament as any)?.tier?.toLowerCase();
  if (tier) return tier;

  // Fallback
  return 'unranked';
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format date to YYYY-MM-DD
 */
const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get day abbreviation (LUN, MAR, MER, etc.)
 */
const getDayAbbr = (date: Date): string => {
  const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  return days[date.getDay()];
};

/**
 * Format ISO 8601 timestamp to HH:mm
 */
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get display text based on match status
 */
const getStatusDisplay = (match: Match): { text: string; isLive: boolean } => {
  if (match.status === 'running') {
    return { text: 'EN DIRECT', isLive: true };
  }
  if (match.status === 'finished') {
    return { text: 'TERMINÉ', isLive: false };
  }
  if (match.status === 'canceled') {
    return { text: 'ANNULÉ', isLive: false };
  }
  return { text: formatTime(match.begin_at), isLive: false };
};

/**
 * Get score display from match results
 */
const getScoreDisplay = (match: Match): string => {
  if (!match.results || match.results.length < 2) return 'VS';
  return `${match.results[0].score}-${match.results[1].score}`;
};

/**
 * Group matches by league and create tournament groups with tier info
 * TRI : On s'assure que les matchs dans chaque groupe sont triés par heure
 */
const groupMatchesByLeague = (matches: Match[]): TournamentGroup[] => {
  const grouped: Record<string, Match[]> = {};
  
  for (const match of matches) {
    const leagueName = match.league.name;
    if (!grouped[leagueName]) {
      grouped[leagueName] = [];
    }
    grouped[leagueName].push(match);
  }

  const groups: TournamentGroup[] = Object.entries(grouped).map(([leagueName, leagueMatches]) => {
    // Tri chronologique à l'intérieur de la compétition
    const sortedMatches = [...leagueMatches].sort((a, b) => 
      new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime()
    );

    return {
      leagueName,
      tier: getMatchTier(sortedMatches[0]),
      matches: sortedMatches,
    };
  });

  return groups;
};

/**
 * Sort tournament groups by tier priority, then alphabetically
 * ÉTAPE 3 : Trier les groupes (S→A→B→C→D→unranked), puis alphabétiquement
 */
const sortTournamentGroups = (groups: TournamentGroup[]): TournamentGroup[] => {
  return groups.sort((a, b) => {
    const priorityA = tierPriority[a.tier] || 999;
    const priorityB = tierPriority[b.tier] || 999;

    // Primary sort: by tier priority (S=1, A=2, etc.)
    if (priorityA !== priorityB) return priorityA - priorityB;

    // Secondary sort: alphabetical by league name
    return a.leagueName.localeCompare(b.leagueName);
  });
};

/**
 * Get team display text: use acronym if available, else truncate name
 * Affiche l'acronyme (ex: "G2", "KCB") ou le nom tronqué à 12 caractères
 */
const getTeamDisplayName = (opponent: Opponent['opponent']): string => {
  // Si acronyme existe, utilise-le (en majuscules au cas où)
  if (opponent.acronym) {
    return opponent.acronym.toUpperCase();
  }

  // Sinon, utilise le nom tronqué à 12 caractères
  const maxLength = 12;
  if (opponent.name.length > maxLength) {
    return opponent.name.substring(0, maxLength) + '...';
  }

  return opponent.name;
};

// ==================== ANIMATED LIVE BADGE ====================

const LiveBadge: React.FC = () => {
  const animatedValue = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  return (
    <Animated.View style={[{ opacity: animatedValue }]}>
      <View style={styles.liveDot} />
    </Animated.View>
  );
};

// ==================== DATE SELECTOR COMPONENT ====================

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateSelect }) => {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 7 previous + today + 7 next
  for (let i = -7; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateSelectorContainer}
      scrollEventThrottle={16}
    >
      {dates.map((date) => {
        const dateStr = formatDateISO(date);
        const selectedStr = formatDateISO(selectedDate);
        const isSelected = dateStr === selectedStr;

        return (
          <TouchableOpacity
            key={dateStr}
            style={[styles.dateBubble, isSelected && styles.dateBubbleActive]}
            onPress={() => onDateSelect(date)}
          >
            <Text style={[styles.dateDayText, isSelected && styles.dateDayTextActive]}>
              {getDayAbbr(date)}
            </Text>
            <Text style={[styles.dateNumberText, isSelected && styles.dateNumberTextActive]}>
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ==================== MATCH ROW COMPONENT ====================

interface MatchRowProps {
  match: Match & {
    isLive: boolean;
  };
}

const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
  const router = useRouter();
  const opponentA = match.opponents[0]?.opponent;
  const opponentB = match.opponents[1]?.opponent;
  const { isLive } = getStatusDisplay(match);
  const scoreDisplay = getScoreDisplay(match);
  const matchTime = formatTime(match.begin_at);

  // Déterminer ce qui s'affiche au centre: heure, score, ou LIVE
  const getCenterDisplay = () => {
    if (isLive) return { type: 'live', text: 'LIVE' };
    if (match.status === 'not_started') return { type: 'time', text: matchTime };
    return { type: 'score', text: scoreDisplay };
  };

  const centerDisplay = getCenterDisplay();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.matchRow,
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => router.push(`/match/${match.id}`)}
    >
      {/* LEFT: TEAM A (flex: 1) - Texte puis logo */}
      <View style={styles.teamAContainer}>
        <Text style={styles.teamNameText} numberOfLines={1}>
          {getTeamDisplayName(opponentA || { name: 'Unknown', image_url: null })}
        </Text>
        <GlowImage uri={opponentA?.image_url || null} size={24} />
      </View>

      {/* CENTER: HEURE / SCORE / LIVE (70px) */}
      <View style={styles.centerSection}>
        {centerDisplay.type === 'live' ? (
          <LiveBadge />
        ) : (
          <Text
            style={[
              styles.centerText,
              centerDisplay.type === 'time' && styles.centerTimeText,
            ]}
          >
            {centerDisplay.text}
          </Text>
        )}
      </View>

      {/* RIGHT: TEAM B (flex: 1) - Logo puis texte */}
      <View style={styles.teamBContainer}>
        <GlowImage uri={opponentB?.image_url || null} size={24} />
        <Text style={styles.teamNameText} numberOfLines={1}>
          {getTeamDisplayName(opponentB || { name: 'Unknown', image_url: null })}
        </Text>
      </View>

      {/* FAR RIGHT: FAVORITE ICON (40px) */}
      <View style={styles.favoriteSection}>
        <MaterialCommunityIcons name="heart-outline" size={18} color="#666" />
      </View>
    </Pressable>
  );
};

// ==================== MAIN SCREEN ====================

export default function MatchsScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [groupedMatches, setGroupedMatches] = useState<TournamentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set());

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!PANDASCORE_API_KEY) {
        throw new Error('Clé API PandaScore non configurée');
      }

      // Build date range for the selected day
      const dateStr = formatDateISO(selectedDate);
      const beginTime = `${dateStr}T00:00:00Z`;
      const endTime = `${dateStr}T23:59:59Z`;

      const response = await fetch(
        `${PANDASCORE_BASE_URL}/matches?` +
          `range[begin_at]=${beginTime},${endTime}&` +
          `filter[status]=not_started,running,finished&` +
          `filter[videogame]=league-of-legends,cs-go,valorant,rocket-league&` +
          `sort=begin_at&` +
          `per_page=100`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${PANDASCORE_API_KEY}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const matchesArray = Array.isArray(data) ? data : data.data || [];

      // Debug: Log la structure du premier match
      if (matchesArray.length > 0) {
        console.log('Structure du premier match:', JSON.stringify(matchesArray[0], null, 2));
      }

      // Enrich with status info
      const enrichedMatches = matchesArray.map((match: Match) => {
        const { isLive } = getStatusDisplay(match);
        return {
          ...match,
          isLive,
        };
      });

      // ÉTAPE 1 & 2 : Regrouper par league.name
      const groupedByLeague = groupMatchesByLeague(enrichedMatches);

      // Debug: Log les groupes avec leurs tiers
      console.log('Groupes créés:', groupedByLeague.map(g => ({ name: g.leagueName, tier: g.tier, priority: tierPriority[g.tier] })));

      // ÉTAPE 3 : Trier les groupes par tier
      const sortedGroups = sortTournamentGroups(groupedByLeague);

      // Debug: Log après tri
      console.log('Groupes triés:', sortedGroups.map(g => ({ name: g.leagueName, tier: g.tier, priority: tierPriority[g.tier] })));

      setGroupedMatches(sortedGroups);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch matches when date changes
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4444" />
          <Text style={styles.loadingText}>Chargement des matchs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>STRAFE</Text>
        </View>

        {/* DATE SELECTOR */}
        <DateSelector selectedDate={selectedDate} onDateSelect={setSelectedDate} />

        {/* ERROR STATE */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#FF4444" />
            <Text style={styles.errorTitle}>Erreur</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMatches}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TOURNAMENTS & MATCHES */}
        {groupedMatches.length > 0 ? (
          groupedMatches.map((group: TournamentGroup) => {
            const isCollapsed = collapsedLeagues.has(group.leagueName);
            const toggleCollapsed = () => {
              const newCollapsed = new Set(collapsedLeagues);
              if (isCollapsed) {
                newCollapsed.delete(group.leagueName);
              } else {
                newCollapsed.add(group.leagueName);
              }
              setCollapsedLeagues(newCollapsed);
            };

            return (
              <View key={group.leagueName}>
                {/* TOURNAMENT HEADER - PRESSABLE */}
                <Pressable
                  style={({ pressed }) => [
                    styles.tournamentHeader,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={toggleCollapsed}
                >
                  <MaterialCommunityIcons
                    name="trophy"
                    size={14}
                    color={COLORS.textMain}
                    style={styles.trophyIcon}
                  />
                  <Text style={styles.tournamentTitle}>{group.leagueName}</Text>
                  <View style={{ marginLeft: 'auto' }}>
                    <MaterialCommunityIcons
                      name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                      size={18}
                      color={COLORS.textMain}
                    />
                  </View>
                </Pressable>

                {/* MATCH ROWS - CONDITIONNELS */}
                {!isCollapsed &&
                  group.matches.map((match: Match) => (
                    <MatchRow key={match.id} match={match as any} />
                  ))}
              </View>
            );
          })
        ) : (
          <View style={styles.noMatchesContainer}>
            <MaterialCommunityIcons
              name="inbox-outline"
              size={48}
              color="#555"
            />
            <Text style={styles.noMatchesText}>Aucun match ce jour</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== DESIGN SYSTEM ====================

const COLORS = {
  bg: '#09090B',           // Fond app
  bgHeader: '#18181B',     // Fond headers
  border: '#27272A',       // Bordures
  textMain: '#FAFAFA',     // Texte principal
  textSecondary: '#A1A1AA',// Texte secondaire
  accent: '#FF4444',       // Accent rouge
};

// ==================== GLOW IMAGE COMPONENT ====================

interface GlowImageProps {
  uri: string | null;
  size: number;
  borderRadius?: number;
}

const GlowImage: React.FC<GlowImageProps> = ({ uri, size, borderRadius = 0 }) => {
  if (!uri) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          backgroundColor: COLORS.bgHeader,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: size * 0.5 }}>🎮</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  // GLOBAL LAYOUT
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flex: 1,
  },

  // HEADER
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textMain,
    letterSpacing: 2,
  },

  // DATE SELECTOR
  dateSelectorContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateBubble: {
    width: 50,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateBubbleActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  dateDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dateDayTextActive: {
    color: COLORS.textMain,
  },
  dateNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  dateNumberTextActive: {
    color: COLORS.textMain,
  },

  // TOURNAMENT HEADER
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bgHeader,
    marginTop: 16,
  },
  trophyIcon: {
    marginRight: 8,
    color: COLORS.textMain,
  },
  tournamentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMain,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // MATCH ROW (Flexbox strict)
  matchRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },

  // LIVE DOT ANIMATION
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },

  // TEAM A CONTAINER (Équipe A : texte puis logo à droite)
  teamAContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
  },
  teamNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
    maxWidth: 80,
    textTransform: 'uppercase',
  },

  // CENTER SECTION (Heure / Score / LIVE) - 70px
  centerSection: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  centerText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accent,
    textAlign: 'center',
  },
  centerTimeText: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },

  // TEAM B CONTAINER (Logo à gauche puis texte : Équipe B)
  teamBContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
  },

  // RIGHT: FAVORITE SECTION (40px)
  favoriteSection: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // LOADING & ERROR
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textMain,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },

  // NO MATCHES
  noMatchesContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  noMatchesText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // BOTTOM PADDING
  bottomPadding: {
    height: 100,
  },
});
