import { StyleSheet } from 'react-native';

// Color Palette
export const Colors = {
  // Primary Colors - Enhanced with more vibrant blues
  primary: '#2563EB',
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',
  primaryBackground: '#EFF6FF',
  primaryGradient: ['#2563EB', '#3B82F6'],
  
  // Secondary Colors - Enhanced greens
  secondary: '#059669',
  secondaryLight: '#10B981',
  secondaryDark: '#047857',
  secondaryBackground: '#ECFDF5',
  secondaryGradient: ['#059669', '#10B981'],
  
  // Accent Colors - New vibrant accents
  accent: '#7C3AED',
  accentLight: '#A78BFA',
  accentDark: '#6D28D9',
  accentBackground: '#F3E8FF',
  accentGradient: ['#7C3AED', '#A78BFA'],
  
  // Warm Colors - For highlights and CTAs
  orange: '#EA580C',
  orangeLight: '#FB923C',
  orangeDark: '#C2410C',
  orangeBackground: '#FFF7ED',
  orangeGradient: ['#EA580C', '#FB923C'],
  
  // Neutral Colors - Enhanced with better contrast
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
  
  // Status Colors - More vibrant and modern
  success: '#059669',
  successLight: '#D1FAE5',
  successDark: '#047857',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningDark: '#B45309',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  errorDark: '#B91C1C',
  info: '#0284C7',
  infoLight: '#E0F2FE',
  infoDark: '#0369A1',
  
  // Shadows
  shadowColor: '#000000',
  shadowColorLight: '#64748B',
};

// Typography
export const Typography = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  
  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Border Radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadows - Enhanced with more depth and color
export const Shadows = {
  sm: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  // Colored shadows for special elements
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  secondary: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Common Styles
export const CommonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  
  // Typography
  heading1: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.gray900,
    lineHeight: Typography['3xl'] * Typography.lineHeight.tight,
  },
  
  heading2: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.gray900,
    lineHeight: Typography['2xl'] * Typography.lineHeight.tight,
  },
  
  heading3: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    color: Colors.gray900,
    lineHeight: Typography.xl * Typography.lineHeight.tight,
  },
  
  heading4: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.gray900,
    lineHeight: Typography.lg * Typography.lineHeight.normal,
  },
  
  bodyLarge: {
    fontSize: Typography.base,
    fontWeight: Typography.regular,
    color: Colors.gray700,
    lineHeight: Typography.base * Typography.lineHeight.normal,
  },
  
  body: {
    fontSize: Typography.sm,
    fontWeight: Typography.regular,
    color: Colors.gray600,
    lineHeight: Typography.sm * Typography.lineHeight.normal,
  },
  
  caption: {
    fontSize: Typography.xs,
    fontWeight: Typography.regular,
    color: Colors.gray500,
    lineHeight: Typography.xs * Typography.lineHeight.normal,
  },
  
  // Buttons - Enhanced with better shadows and gradients
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  
  buttonPrimary: {
    backgroundColor: Colors.primary,
    ...Shadows.primary,
  },
  
  buttonSecondary: {
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  
  buttonSuccess: {
    backgroundColor: Colors.success,
    ...Shadows.secondary,
  },
  
  buttonError: {
    backgroundColor: Colors.error,
  },
  
  buttonAccent: {
    backgroundColor: Colors.accent,
    ...Shadows.accent,
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Text Inputs
  input: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.gray900,
    backgroundColor: Colors.white,
  },
  
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: Colors.error,
  },
  
  // Labels
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
  },
  
  labelRequired: {
    color: Colors.error,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
  },
  
  // Utility Classes
  row: {
    flexDirection: 'row',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  spaceAround: {
    justifyContent: 'space-around',
  },
  
  flex1: {
    flex: 1,
  },
  
  // Margins
  mt1: { marginTop: Spacing.xs },
  mt2: { marginTop: Spacing.sm },
  mt3: { marginTop: Spacing.md },
  mt4: { marginTop: Spacing.lg },
  mt5: { marginTop: Spacing.xl },
  mt6: { marginTop: Spacing['2xl'] },
  
  mb1: { marginBottom: Spacing.xs },
  mb2: { marginBottom: Spacing.sm },
  mb3: { marginBottom: Spacing.md },
  mb4: { marginBottom: Spacing.lg },
  mb5: { marginBottom: Spacing.xl },
  mb6: { marginBottom: Spacing['2xl'] },
  
  ml1: { marginLeft: Spacing.xs },
  ml2: { marginLeft: Spacing.sm },
  ml3: { marginLeft: Spacing.md },
  ml4: { marginLeft: Spacing.lg },
  
  mr1: { marginRight: Spacing.xs },
  mr2: { marginRight: Spacing.sm },
  mr3: { marginRight: Spacing.md },
  mr4: { marginRight: Spacing.lg },
  
  // Paddings
  p1: { padding: Spacing.xs },
  p2: { padding: Spacing.sm },
  p3: { padding: Spacing.md },
  p4: { padding: Spacing.lg },
  p5: { padding: Spacing.xl },
  p6: { padding: Spacing['2xl'] },
  
  px1: { paddingHorizontal: Spacing.xs },
  px2: { paddingHorizontal: Spacing.sm },
  px3: { paddingHorizontal: Spacing.md },
  px4: { paddingHorizontal: Spacing.lg },
  px5: { paddingHorizontal: Spacing.xl },
  
  py1: { paddingVertical: Spacing.xs },
  py2: { paddingVertical: Spacing.sm },
  py3: { paddingVertical: Spacing.md },
  py4: { paddingVertical: Spacing.lg },
  py5: { paddingVertical: Spacing.xl },
});

// Button Text Styles
export const ButtonTextStyles = StyleSheet.create({
  primary: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.white,
  },
  
  secondary: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.gray700,
  },
  
  success: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.white,
  },
  
  error: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.white,
  },
  
  outline: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.gray700,
  },
});