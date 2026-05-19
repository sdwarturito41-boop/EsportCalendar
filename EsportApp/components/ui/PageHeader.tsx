import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Wordmark } from './Wordmark';

export interface PageHeaderProps {
  rightAction?: React.ReactNode;
  onPressRight?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ rightAction, onPressRight }) => {
  return (
    <View style={styles.row}>
      <Wordmark />
      {rightAction ? (
        <Pressable onPress={onPressRight} hitSlop={8} style={styles.action}>
          {rightAction}
        </Pressable>
      ) : (
        <View style={styles.actionSpacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bg.page,
  },
  action: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  actionSpacer: { width: 36, height: 36 },
});
