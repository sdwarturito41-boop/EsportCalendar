import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { PageHeader } from '@/components/ui/PageHeader';
import { NewsCard, NewsItem } from '@/components/ui/NewsCard';
import { fetchNews } from '@/lib/news';

export default function NewsScreen() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!force) setLoading(true);
    const data = await fetchNews(force);
    setItems(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent.indigo} size="large" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="newspaper-variant-outline" size={56} color={Colors.text.muted} />
          <Text variant="ui.body" tone="muted" style={styles.placeholder}>
            Aucune actualité pour le moment.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.indigo} />
          }
        >
          {items.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.page },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  placeholder: { textAlign: 'center' },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 80,
    gap: Spacing.md,
  },
});
