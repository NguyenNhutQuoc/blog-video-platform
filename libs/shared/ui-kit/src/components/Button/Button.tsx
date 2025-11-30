import React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'filled',
  ...props
}) => {
  // Map MD3 variants to MUI variants
  const muiVariant =
    variant === 'filled' || variant === 'elevated' || variant === 'tonal'
      ? 'contained'
      : variant === 'outlined'
      ? 'outlined'
      : 'text';

  const sx = {
    ...(variant === 'tonal' && {
      backgroundColor: 'secondary.light',
      color: 'secondary.dark',
      '&:hover': {
        backgroundColor: 'secondary.main',
        color: 'white',
      },
    }),
    ...(variant === 'elevated' && {
      backgroundColor: 'background.paper',
      color: 'primary.main',
      boxShadow: 1,
      '&:hover': {
        boxShadow: 2,
        backgroundColor: '#F7F2FA',
      },
    }),
    ...props.sx,
  };

  return <MuiButton variant={muiVariant} {...props} sx={sx} />;
};

export default Button;
