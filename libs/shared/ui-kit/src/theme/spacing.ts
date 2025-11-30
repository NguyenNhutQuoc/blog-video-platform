// Material Design 3 Spacing System - 8dp Grid
export const spacing = 8;

// Helper function for consistent spacing
export const getSpacing = (multiplier: number): number => spacing * multiplier;

// Common spacing values
export const spacingValues = {
  xs: spacing * 0.5, // 4px
  sm: spacing, // 8px
  md: spacing * 2, // 16px
  lg: spacing * 3, // 24px
  xl: spacing * 4, // 32px
  xxl: spacing * 6, // 48px
} as const;
