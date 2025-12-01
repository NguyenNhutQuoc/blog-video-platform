import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('applies filled variant by default', () => {
    render(<Button>Filled</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('MuiButton-contained');
  });

  it('applies outlined variant', () => {
    render(<Button variant="outlined">Outlined</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('MuiButton-outlined');
  });

  it('applies text variant', () => {
    render(<Button variant="text">Text</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('MuiButton-text');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with start icon', () => {
    render(<Button startIcon={<span data-testid="icon">+</span>}>Add</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders full width when specified', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('MuiButton-fullWidth');
  });
});
