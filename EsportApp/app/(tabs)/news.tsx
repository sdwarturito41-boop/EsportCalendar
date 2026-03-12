import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function NewsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ACTUS</Text>
        </View>
        <View style={styles.content}>
          <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color={Colors.text.tertiary} />
          <Text style={styles.placeholder}>Suivez l'actualité esport ici prochainement.</Text>
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  content: {
    paddingVertical: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  placeholder: {
    color: Colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
