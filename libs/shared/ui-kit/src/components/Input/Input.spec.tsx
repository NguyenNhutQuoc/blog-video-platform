import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email..." />);
    expect(screen.getByPlaceholderText('Enter email...')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<Input label="Name" onChange={handleChange} />);

    await user.type(screen.getByLabelText('Name'), 'John');
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows helper text', () => {
    render(<Input label="Email" helperText="We will not share your email" />);
    expect(
      screen.getByText('We will not share your email')
    ).toBeInTheDocument();
  });

  it('shows error state', () => {
    const { container } = render(
      <Input label="Email" error helperText="Invalid email" />
    );
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(container.querySelector('.Mui-error')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Input label="Disabled" disabled />);
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });

  it('renders as multiline when specified', () => {
    render(<Input label="Description" multiline rows={4} />);
    expect(screen.getByLabelText('Description').tagName).toBe('TEXTAREA');
  });

  it('uses outlined variant by default', () => {
    const { container } = render(<Input label="Test" />);
    expect(
      container.querySelector('.MuiOutlinedInput-root')
    ).toBeInTheDocument();
  });
});
