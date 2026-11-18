export const Colors = {
  // Backgrounds
  background: '#0f0f0f',
  surface: '#1a1a1a',
  surface2: '#242424',
  surface3: '#2e2e2e',

  // Brand
  primary: '#6C63FF',
  primaryDark: '#5A52E0',
  primaryLight: '#8B84FF',
  secondary: '#FF6584',
  accent: '#43E97B',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textMuted: '#606060',

  // Border
  border: '#2e2e2e',
  borderLight: '#3e3e3e',

  // Status
  error: '#FF4D4D',
  warning: '#FFB347',
  success: '#43E97B',
  info: '#4FC3F7',

  // Misc
  overlay: 'rgba(0,0,0,0.7)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof Colors;
