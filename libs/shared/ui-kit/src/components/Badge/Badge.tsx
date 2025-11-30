import React from 'react';
import { Badge as MuiBadge, BadgeProps as MuiBadgeProps } from '@mui/material';

export type BadgeProps = MuiBadgeProps;

export const Badge: React.FC<BadgeProps> = (props) => {
  return <MuiBadge {...props} />;
};

export default Badge;
