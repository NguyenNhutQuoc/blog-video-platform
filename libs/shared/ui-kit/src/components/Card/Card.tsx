import React from 'react';
import { Card as MuiCard, CardProps as MuiCardProps } from '@mui/material';

export interface CardProps extends MuiCardProps {
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  elevation = 1,
  children,
  ...props
}) => {
  return (
    <MuiCard elevation={elevation} {...props}>
      {children}
    </MuiCard>
  );
};

export default Card;
