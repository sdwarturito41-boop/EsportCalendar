import React from 'react';
import { Text } from './Text';

export interface WordmarkProps {
  size?: 'big' | 'small';
}

export const Wordmark: React.FC<WordmarkProps> = ({ size = 'small' }) => {
  const variant = size === 'big' ? 'display.big' : 'display.wordmark';
  return (
    <Text variant={variant}>
      LOBBY<Text variant={variant} tone="accent">.</Text>
    </Text>
  );
};
