import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Stack } from '@mui/material';
import { Add, Send, Delete } from '@mui/icons-material';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'outlined', 'text', 'elevated', 'tonal'],
      description: 'The variant style of the button',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Filled: Story = {
  args: {
    children: 'Filled Button',
    variant: 'filled',
  },
};

export const Outlined: Story = {
  args: {
    children: 'Outlined Button',
    variant: 'outlined',
  },
};

export const Text: Story = {
  args: {
    children: 'Text Button',
    variant: 'text',
  },
};

export const Elevated: Story = {
  args: {
    children: 'Elevated Button',
    variant: 'elevated',
  },
};

export const Tonal: Story = {
  args: {
    children: 'Tonal Button',
    variant: 'tonal',
  },
};

export const AllVariants: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Button variant="filled">Filled</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="text">Text</Button>
      <Button variant="elevated">Elevated</Button>
      <Button variant="tonal">Tonal</Button>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </Stack>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Button startIcon={<Add />}>Add Item</Button>
      <Button endIcon={<Send />}>Send</Button>
      <Button variant="outlined" color="error" startIcon={<Delete />}>
        Delete
      </Button>
    </Stack>
  ),
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};
