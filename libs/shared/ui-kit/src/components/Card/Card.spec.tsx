import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';
import { CardContent, Typography } from '@mui/material';

describe('Card', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <CardContent>
          <Typography>Card content</Typography>
        </CardContent>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default elevation of 1', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveClass('MuiPaper-elevation1');
  });

  it('applies custom elevation', () => {
    const { container } = render(<Card elevation={4}>Content</Card>);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveClass('MuiPaper-elevation4');
  });

  it('applies custom sx styles', () => {
    const { container } = render(<Card sx={{ maxWidth: 400 }}>Content</Card>);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveStyle({ maxWidth: '400px' });
  });

  it('renders with outlined variant', () => {
    const { container } = render(<Card variant="outlined">Content</Card>);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveClass('MuiPaper-outlined');
  });
});
