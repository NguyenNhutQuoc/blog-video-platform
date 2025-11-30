import React from 'react';
import { Chip, ChipProps } from '@mui/material';

export interface TagProps extends Omit<ChipProps, 'variant'> {
  variant?: 'filled' | 'outlined';
}

export const Tag: React.FC<TagProps> = ({ variant = 'filled', ...props }) => {
  return <Chip variant={variant} {...props} />;
};

export default Tag;
