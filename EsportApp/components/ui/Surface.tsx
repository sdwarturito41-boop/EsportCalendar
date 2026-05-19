import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors, Spacing, Radii } from '@/constants/theme';

type Level = 'page' | 'surface' | 'elevated';
type Radius = keyof typeof Radii | 'none';
type Padding = keyof typeof Spacing | 0;

const LEVEL_TO_BG: Record<Level, string> = {
  page: Colors.bg.page,
  surface: Colors.bg.surface,
  elevated: Colors.bg.elevated,
};

export interface SurfaceProps extends ViewProps {
  level?: Level;
  radius?: Radius;
  padding?: Padding;
  bordered?: boolean;
}

export const Surface: React.FC<SurfaceProps> = ({
  level = 'page',
  radius = 'none',
  padding = 0,
  bordered = false,
  style,
  children,
  ...rest
}) => {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        { backgroundColor: LEVEL_TO_BG[level] },
        radius !== 'none' && { borderRadius: Radii[radius] },
        padding !== 0 && { padding: Spacing[padding] },
        bordered && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {},
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
