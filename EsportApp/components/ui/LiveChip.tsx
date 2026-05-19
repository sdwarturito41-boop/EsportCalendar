import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { Text } from './Text';

export const LiveChip: React.FC = () => (
  <View style={styles.row}>
    <View style={styles.dot} />
    <Text variant="ui.label" tone="live">LIVE</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.semantic.live,
  },
});
