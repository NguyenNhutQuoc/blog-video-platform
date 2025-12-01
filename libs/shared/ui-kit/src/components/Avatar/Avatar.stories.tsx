import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';
import { Stack } from '@mui/material';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Name to generate initials from',
    },
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'User avatar',
  },
};

export const WithInitials: Story = {
  args: {
    name: 'John Doe',
  },
};

export const SingleName: Story = {
  args: {
    name: 'John',
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar
        name="Small"
        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
      />
      <Avatar name="Medium" sx={{ width: 40, height: 40 }} />
      <Avatar name="Large" sx={{ width: 56, height: 56 }} />
      <Avatar name="XL" sx={{ width: 80, height: 80, fontSize: '1.5rem' }} />
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Avatar name="AB" sx={{ bgcolor: 'primary.main' }} />
      <Avatar name="CD" sx={{ bgcolor: 'secondary.main' }} />
      <Avatar name="EF" sx={{ bgcolor: 'error.main' }} />
      <Avatar name="GH" sx={{ bgcolor: 'warning.main' }} />
      <Avatar name="IJ" sx={{ bgcolor: 'success.main' }} />
    </Stack>
  ),
};

export const Fallback: Story = {
  args: {
    src: 'invalid-url.jpg',
    name: 'Jane Smith',
  },
};

export const Group: Story = {
  render: () => (
    <Stack direction="row" spacing={-1}>
      <Avatar
        src="https://i.pravatar.cc/150?img=1"
        sx={{ border: '2px solid white' }}
      />
      <Avatar
        src="https://i.pravatar.cc/150?img=2"
        sx={{ border: '2px solid white' }}
      />
      <Avatar
        src="https://i.pravatar.cc/150?img=3"
        sx={{ border: '2px solid white' }}
      />
      <Avatar
        name="+5"
        sx={{ border: '2px solid white', bgcolor: 'grey.300' }}
      />
    </Stack>
  ),
};
