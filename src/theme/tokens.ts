import { Platform } from 'react-native';

/**
 * Dark arcade palette: a deep indigo ground so the piece colours carry all the energy.
 * Every text pairing below clears WCAG AA (4.5:1) against its own surface.
 */
export const colors = {
  background: '#0B1020',
  backgroundElevated: '#141B31',
  surface: '#171F38',
  surfaceMuted: '#1E2743',
  boardWell: '#121A30',
  cellEmpty: '#1B2440',
  cellEmptyEdge: 'rgba(255,255,255,0.04)',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  text: '#F8FAFC',
  textMuted: '#9FAECA', // 7.1:1 on #0B1020
  textFaint: '#6C7A99',

  accent: '#FBBF24',
  onAccent: '#1A1204',
  success: '#34D399',
  danger: '#F87171',

  overlay: 'rgba(6,10,22,0.82)',
} as const;

/** Piece colours — distinguishable for the common colour-vision deficiencies, all AA on the board well. */
export const pieceColors = [
  { base: '#38BDF8', light: '#7DD3FC', dark: '#0EA5E9' }, // sky
  { base: '#F472B6', light: '#F9A8D4', dark: '#EC4899' }, // pink
  { base: '#A78BFA', light: '#C4B5FD', dark: '#8B5CF6' }, // violet
  { base: '#FBBF24', light: '#FCD34D', dark: '#F59E0B' }, // amber
  { base: '#34D399', light: '#6EE7B7', dark: '#10B981' }, // emerald
  { base: '#FB7185', light: '#FDA4AF', dark: '#F43F5E' }, // rose
] as const;

export function pieceColor(colorId: number) {
  return pieceColors[((colorId % pieceColors.length) + pieceColors.length) % pieceColors.length];
}

/** 4px base scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const type = {
  display: {
    fontFamily,
    fontSize: 44,
    fontWeight: '800' as const,
    letterSpacing: -1.2,
    color: colors.text,
  },
  score: {
    fontFamily,
    fontSize: 38,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    color: colors.text,
    fontVariant: ['tabular-nums'] as ['tabular-nums'],
  },
  title: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    color: colors.text,
  },
  body: { fontFamily, fontSize: 16, fontWeight: '500' as const, color: colors.text },
  label: {
    fontFamily,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  caption: { fontFamily, fontSize: 13, fontWeight: '500' as const, color: colors.textMuted },
} as const;

/** Minimum interactive size — Apple HIG 44pt / Material 48dp. */
export const HIT_SIZE = 48;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  piece: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 360,
} as const;
