import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { Stack, IconButton } from '@mui/material';
import {
  Mail,
  Notifications as NotificationsIcon,
  ShoppingCart,
} from '@mui/icons-material';
import { Avatar } from '../Avatar';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    badgeContent: {
      control: 'number',
    },
    color: {
      control: 'select',
      options: [
        'default',
        'primary',
        'secondary',
        'error',
        'info',
        'success',
        'warning',
      ],
    },
    max: {
      control: 'number',
    },
    invisible: {
      control: 'boolean',
    },
    showZero: {
      control: 'boolean',
    },
    variant: {
      control: 'select',
      options: ['standard', 'dot'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    badgeContent: 4,
    color: 'primary',
    children: (
      <IconButton>
        <Mail />
      </IconButton>
    ),
  },
};

export const NotificationsBadge: Story = {
  render: () => (
    <Badge badgeContent={17} color="error">
      <IconButton>
        <NotificationsIcon />
      </IconButton>
    </Badge>
  ),
};

export const MaxValue: Story = {
  render: () => (
    <Stack direction="row" spacing={4}>
      <Badge badgeContent={99} max={99} color="error">
        <IconButton>
          <Mail />
        </IconButton>
      </Badge>
      <Badge badgeContent={100} max={99} color="error">
        <IconButton>
          <Mail />
        </IconButton>
      </Badge>
      <Badge badgeContent={1000} max={999} color="error">
        <IconButton>
          <Mail />
        </IconButton>
      </Badge>
    </Stack>
  ),
};

export const Dot: Story = {
  render: () => (
    <Stack direction="row" spacing={4}>
      <Badge variant="dot" color="primary">
        <IconButton>
          <Mail />
        </IconButton>
      </Badge>
      <Badge variant="dot" color="error">
        <IconButton>
          <NotificationsIcon />
        </IconButton>
      </Badge>
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <Badge badgeContent={1} color="primary">
        <Mail />
      </Badge>
      <Badge badgeContent={2} color="secondary">
        <Mail />
      </Badge>
      <Badge badgeContent={3} color="error">
        <Mail />
      </Badge>
      <Badge badgeContent={4} color="warning">
        <Mail />
      </Badge>
      <Badge badgeContent={5} color="info">
        <Mail />
      </Badge>
      <Badge badgeContent={6} color="success">
        <Mail />
      </Badge>
    </Stack>
  ),
};

export const OnAvatar: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        color="success"
      >
        <Avatar name="John Doe" />
      </Badge>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent=" "
        sx={{
          '& .MuiBadge-badge': {
            bgcolor: 'grey.400',
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px solid white',
          },
        }}
      >
        <Avatar name="Jane Smith" />
      </Badge>
    </Stack>
  ),
};

export const ShowZero: Story = {
  render: () => (
    <Stack direction="row" spacing={4}>
      <Badge badgeContent={0} color="primary">
        <Mail />
      </Badge>
      <Badge badgeContent={0} color="primary" showZero>
        <Mail />
      </Badge>
    </Stack>
  ),
};

export const CartExample: Story = {
  render: () => (
    <IconButton aria-label="cart">
      <Badge badgeContent={4} color="primary">
        <ShoppingCart />
      </Badge>
    </IconButton>
  ),
};
