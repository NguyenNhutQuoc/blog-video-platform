// Material Design 3 Type Scale - Google Design Language
export const typography = {
  fontFamily: [
    'Roboto',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),

  // MD3 Type Scale
  h1: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '3.5rem', // 56px - Display Large
    lineHeight: 1.167,
    letterSpacing: '-0.015em',
  },
  h2: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '2.813rem', // 45px - Display Medium
    lineHeight: 1.2,
    letterSpacing: 0,
  },
  h3: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '2.25rem', // 36px - Display Small
    lineHeight: 1.167,
    letterSpacing: 0,
  },
  h4: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '2rem', // 32px - Headline Large
    lineHeight: 1.235,
    letterSpacing: '0.0025em',
  },
  h5: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '1.5rem', // 24px - Headline Medium
    lineHeight: 1.334,
    letterSpacing: 0,
  },
  h6: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    fontSize: '1.25rem', // 20px - Headline Small
    lineHeight: 1.6,
    letterSpacing: '0.0015em',
  },
  subtitle1: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    fontSize: '1rem', // 16px - Title Medium
    lineHeight: 1.5,
    letterSpacing: '0.0015em',
  },
  subtitle2: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem', // 14px - Title Small
    lineHeight: 1.57,
    letterSpacing: '0.001em',
  },
  body1: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '1rem', // 16px - Body Large
    lineHeight: 1.5,
    letterSpacing: '0.005em',
  },
  body2: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '0.875rem', // 14px - Body Medium
    lineHeight: 1.43,
    letterSpacing: '0.0025em',
  },
  button: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem', // 14px - Label Large
    lineHeight: 1.75,
    letterSpacing: '0.004em',
    textTransform: 'none' as const,
  },
  caption: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: '0.75rem', // 12px - Body Small
    lineHeight: 1.66,
    letterSpacing: '0.004em',
  },
  overline: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    fontSize: '0.625rem', // 10px - Label Small
    lineHeight: 2.66,
    letterSpacing: '0.015em',
    textTransform: 'uppercase' as const,
  },
};
