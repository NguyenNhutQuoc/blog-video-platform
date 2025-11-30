import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { components } from './components';

// Material Design 3 Theme for Blog Platform
export const theme = createTheme({
  palette,
  typography,
  shadows,
  spacing,
  components,
  shape: {
    borderRadius: 12,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});
