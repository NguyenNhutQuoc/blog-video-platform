import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders with image src', () => {
    render(<Avatar src="https://example.com/avatar.jpg" alt="User" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('generates initials from full name', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('generates initials from single name', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(<Avatar>AB</Avatar>);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('uses children over name when both provided', () => {
    render(<Avatar name="John Doe">XY</Avatar>);
    expect(screen.getByText('XY')).toBeInTheDocument();
    expect(screen.queryByText('JD')).not.toBeInTheDocument();
  });

  it('applies custom sx styles', () => {
    const { container } = render(
      <Avatar name="Test" sx={{ width: 100, height: 100 }} />
    );
    const avatar = container.querySelector('.MuiAvatar-root');
    expect(avatar).toHaveStyle({ width: '100px', height: '100px' });
  });
});
