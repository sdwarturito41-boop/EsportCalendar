export const Colors = {
  bg: {
    page: '#08080B',
    surface: '#161619',
    elevated: '#1E1E24',
  },
  border: {
    subtle: '#2A2A30',
  },
  text: {
    primary: '#F0F0F5',
    muted: '#6A6A78',
  },
  accent: {
    indigo: '#5C5CE8',
  },
  semantic: {
    live: '#FF3B30',
    loss: '#E8404A',
  },
} as const;

const BEBAS = 'BebasNeue';
const GEIST_MEDIUM = 'Geist-Medium';
const GEIST_BOLD = 'Geist-Bold';

export const Typo = {
  display: {
    score:    { fontFamily: BEBAS, fontSize: 20, letterSpacing: 0.5 },
    time:     { fontFamily: BEBAS, fontSize: 16, letterSpacing: 0.5 },
    wordmark: { fontFamily: BEBAS, fontSize: 28, letterSpacing: 3 },
    big:      { fontFamily: BEBAS, fontSize: 48, letterSpacing: 1 },
  },
  ui: {
    title:    { fontFamily: GEIST_BOLD,   fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
    body:     { fontFamily: GEIST_MEDIUM, fontSize: 15, lineHeight: 20 },
    teamName: { fontFamily: GEIST_MEDIUM, fontSize: 15, lineHeight: 18 },
    label:    { fontFamily: GEIST_BOLD,   fontSize: 11, lineHeight: 13, letterSpacing: 1 },
    caption:  { fontFamily: GEIST_MEDIUM, fontSize: 12, lineHeight: 16 },
  },
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radii = { sm: 6, md: 8, lg: 12, xl: 16, pill: 999 } as const;

export const Fonts = {
  [BEBAS]: require('../assets/fonts/BebasNeue-Regular.ttf'),
  [GEIST_MEDIUM]: require('../assets/fonts/Geist-Medium.ttf'),
  [GEIST_BOLD]: require('../assets/fonts/Geist-Bold.ttf'),
} as const;
