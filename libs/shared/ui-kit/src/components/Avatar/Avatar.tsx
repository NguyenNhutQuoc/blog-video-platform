import React from 'react';
import {
  Avatar as MuiAvatar,
  AvatarProps as MuiAvatarProps,
} from '@mui/material';

export interface AvatarProps extends MuiAvatarProps {
  name?: string;
}

// Helper to get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({ name, children, ...props }) => {
  return (
    <MuiAvatar {...props}>
      {children || (name ? getInitials(name) : undefined)}
    </MuiAvatar>
  );
};

export default Avatar;
