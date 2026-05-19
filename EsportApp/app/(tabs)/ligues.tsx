import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';

export default function LiguesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Wordmark />
      </View>
      <View style={styles.empty}>
        <MaterialCommunityIcons name="trophy-outline" size={56} color={Colors.text.muted} />
        <Text variant="ui.body" tone="muted" style={styles.placeholder}>
          Les classements et ligues arrivent bientôt.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  placeholder: { textAlign: 'center' },
});
