import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { Mail } from '@mui/icons-material';

describe('Badge', () => {
  it('renders badge content', () => {
    render(
      <Badge badgeContent={5}>
        <Mail />
      </Badge>
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Badge badgeContent={3}>
        <span data-testid="child">Content</span>
      </Badge>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies color prop', () => {
    const { container } = render(
      <Badge badgeContent={5} color="error">
        <Mail />
      </Badge>
    );
    expect(container.querySelector('.MuiBadge-colorError')).toBeInTheDocument();
  });

  it('respects max value', () => {
    render(
      <Badge badgeContent={100} max={99}>
        <Mail />
      </Badge>
    );
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('hides badge when invisible is true', () => {
    const { container } = render(
      <Badge badgeContent={5} invisible>
        <Mail />
      </Badge>
    );
    expect(container.querySelector('.MuiBadge-invisible')).toBeInTheDocument();
  });

  it('hides badge when badgeContent is 0 by default', () => {
    const { container } = render(
      <Badge badgeContent={0}>
        <Mail />
      </Badge>
    );
    expect(container.querySelector('.MuiBadge-invisible')).toBeInTheDocument();
  });

  it('shows badge when badgeContent is 0 and showZero is true', () => {
    render(
      <Badge badgeContent={0} showZero>
        <Mail />
      </Badge>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders dot variant', () => {
    const { container } = render(
      <Badge variant="dot">
        <Mail />
      </Badge>
    );
    expect(container.querySelector('.MuiBadge-dot')).toBeInTheDocument();
  });
});
