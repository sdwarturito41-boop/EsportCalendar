import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from './Text';

const DAYS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatLabel = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return "AUJOURD'HUI";
  if (sameDay(date, tomorrow)) return 'DEMAIN';
  if (sameDay(date, yesterday)) return 'HIER';
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

const addDays = (date: Date, n: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

export interface DateBarProps {
  date: Date;
  onChange: (date: Date) => void;
}

export const DateBar: React.FC<DateBarProps> = ({ date, onChange }) => (
  <View style={styles.row}>
    <Pressable onPress={() => onChange(addDays(date, -1))} hitSlop={8} style={styles.iconBtn}>
      <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.text.primary} />
    </Pressable>
    <Pressable onPress={() => onChange(new Date(new Date().setHours(0, 0, 0, 0)))} style={styles.label}>
      <Text variant="ui.label" tone="primary">{formatLabel(date)}</Text>
    </Pressable>
    <Pressable onPress={() => onChange(addDays(date, 1))} hitSlop={8} style={styles.iconBtn}>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.text.primary} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    alignItems: 'center',
  },
});
