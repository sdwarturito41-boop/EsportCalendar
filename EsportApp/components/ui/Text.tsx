import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { Colors, Typo } from '@/constants/theme';

type DisplayVariant = `display.${keyof typeof Typo.display}`;
type UIVariant = `ui.${keyof typeof Typo.ui}`;
export type TextVariant = DisplayVariant | UIVariant;
export type TextTone = 'primary' | 'muted' | 'accent' | 'live' | 'loss';

const TONE_TO_COLOR: Record<TextTone, string> = {
  primary: Colors.text.primary,
  muted: Colors.text.muted,
  accent: Colors.accent.indigo,
  live: Colors.semantic.live,
  loss: Colors.semantic.loss,
};

const resolveVariant = (variant: TextVariant): TextStyle => {
  const [group, key] = variant.split('.') as ['display' | 'ui', string];
  return (Typo[group] as Record<string, TextStyle>)[key];
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  uppercase?: boolean;
}

export const Text: React.FC<TextProps> = ({
  variant = 'ui.body',
  tone = 'primary',
  uppercase,
  style,
  children,
  ...rest
}) => {
  const variantStyle = resolveVariant(variant);
  const isLabel = variant === 'ui.label';
  return (
    <RNText
      {...rest}
      style={[
        variantStyle,
        { color: TONE_TO_COLOR[tone] },
        (uppercase || isLabel) && styles.upper,
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  upper: { textTransform: 'uppercase' },
});
