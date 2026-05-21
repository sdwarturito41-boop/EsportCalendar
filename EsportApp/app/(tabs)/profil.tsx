import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Spacing, Radii } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';

let handlerSet = false;

export default function ProfilScreen() {
  const { session, profile, signOut } = useAuth();
  const router = useRouter();

  const requestPermissions = async () => {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      handlerSet = true;
    }
    if (!Device.isDevice) {
      Alert.alert('Erreur', 'Utilisez un appareil physique pour les notifications.');
      return;
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Erreur', "Les notifications ne sont pas autorisées.");
      return;
    }
    Alert.alert('OK', 'Notifications autorisées.');
  };

  const scheduleTestNotification = async () => {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MATCH EN DIRECT',
        body: 'G2 Esports vs Team Vitality vient de commencer.',
        data: { matchId: 123 },
        sound: true,
      },
      trigger: null,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={56} color={Colors.text.muted} />
        </View>
        <Text variant="ui.title" tone="primary" style={{ marginTop: Spacing.md }}>
          {session?.user?.email || 'Utilisateur'}
        </Text>

        <View style={styles.section}>
          <Text variant="ui.label" tone="muted" style={styles.sectionTitle}>
            Notifications
          </Text>
          <Pressable onPress={requestPermissions} style={({ pressed }) => [pressed && styles.pressed]}>
            <Surface level="surface" radius="md" padding="md" bordered style={styles.row}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={Colors.text.primary} />
              <Text variant="ui.body" tone="primary" style={{ flex: 1 }}>
                Autoriser les alertes
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.text.muted} />
            </Surface>
          </Pressable>
          <Pressable onPress={scheduleTestNotification} style={({ pressed }) => [pressed && styles.pressed]}>
            <Surface level="elevated" radius="md" padding="md" style={[styles.row, styles.rowAccent]}>
              <MaterialCommunityIcons name="bell-ring-outline" size={20} color={Colors.text.primary} />
              <Text variant="ui.body" tone="primary" style={{ flex: 1 }}>
                Tester une alerte match
              </Text>
            </Surface>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text variant="ui.label" tone="muted" style={styles.sectionTitle}>
            Préférences
          </Text>
          <Pressable
            onPress={() => router.push('/games')}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Surface level="surface" radius="md" padding="md" bordered style={styles.row}>
              <MaterialCommunityIcons name="gamepad-variant" size={20} color={Colors.text.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="ui.body" tone="primary">Jeux & équipes favoris</Text>
                {profile && (
                  <Text variant="ui.caption" tone="muted">
                    {profile.favorite_games.length} jeu(x) · {profile.favorite_teams.length} équipe(s)
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.text.muted} />
            </Surface>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text variant="ui.label" tone="muted" style={styles.sectionTitle}>
            Compte
          </Text>
          <Pressable onPress={signOut} style={({ pressed }) => [pressed && styles.pressed]}>
            <Surface level="surface" radius="md" padding="md" bordered style={styles.row}>
              <MaterialCommunityIcons name="logout" size={20} color={Colors.semantic.loss} />
              <Text variant="ui.body" tone="loss" style={{ flex: 1 }}>
                Se déconnecter
              </Text>
            </Surface>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.bg.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  section: {
    width: '100%',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  sectionTitle: { paddingLeft: Spacing.xs, marginBottom: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowAccent: {
    backgroundColor: Colors.accent.indigo,
  },
  pressed: { opacity: 0.85 },
  empty: { alignItems: 'center' },
});
