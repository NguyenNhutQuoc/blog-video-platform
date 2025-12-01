import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders with label', () => {
    render(<Tag label="React" />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('uses filled variant by default', () => {
    const { container } = render(<Tag label="Test" />);
    expect(container.querySelector('.MuiChip-filled')).toBeInTheDocument();
  });

  it('applies outlined variant', () => {
    const { container } = render(<Tag label="Test" variant="outlined" />);
    expect(container.querySelector('.MuiChip-outlined')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Tag label="Clickable" onClick={handleClick} />);

    await user.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows delete button when onDelete is provided', () => {
    const handleDelete = jest.fn();
    render(<Tag label="Deletable" onDelete={handleDelete} />);

    expect(screen.getByTestId('CancelIcon')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const handleDelete = jest.fn();
    const user = userEvent.setup();

    render(<Tag label="Deletable" onDelete={handleDelete} />);

    await user.click(screen.getByTestId('CancelIcon'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('applies color prop', () => {
    const { container } = render(<Tag label="Primary" color="primary" />);
    expect(
      container.querySelector('.MuiChip-colorPrimary')
    ).toBeInTheDocument();
  });

  it('applies size prop', () => {
    const { container } = render(<Tag label="Small" size="small" />);
    expect(container.querySelector('.MuiChip-sizeSmall')).toBeInTheDocument();
  });
});
