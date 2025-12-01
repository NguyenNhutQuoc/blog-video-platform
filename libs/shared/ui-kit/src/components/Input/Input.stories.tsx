import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Stack, InputAdornment } from '@mui/material';
import { Search, Visibility, Email } from '@mui/icons-material';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
    error: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: 'Label',
    placeholder: 'Enter text...',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    helperText: 'We will never share your email',
  },
};

export const Error: Story = {
  args: {
    label: 'Email',
    value: 'invalid-email',
    error: true,
    helperText: 'Please enter a valid email address',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    value: 'Cannot edit this',
    disabled: true,
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const WithStartAdornment: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    InputProps: {
      startAdornment: (
        <InputAdornment position="start">
          <Search />
        </InputAdornment>
      ),
    },
  },
};

export const WithEndAdornment: Story = {
  args: {
    label: 'Password',
    type: 'password',
    InputProps: {
      endAdornment: (
        <InputAdornment position="end">
          <Visibility />
        </InputAdornment>
      ),
    },
  },
};

export const Multiline: Story = {
  args: {
    label: 'Description',
    multiline: true,
    rows: 4,
    placeholder: 'Enter a description...',
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 300 }}>
      <Input label="Small" size="small" />
      <Input label="Medium" size="medium" />
    </Stack>
  ),
};

export const FormExample: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 350 }}>
      <Input label="Full Name" placeholder="John Doe" />
      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email />
            </InputAdornment>
          ),
        }}
      />
      <Input label="Password" type="password" placeholder="••••••••" />
      <Input
        label="Bio"
        multiline
        rows={3}
        placeholder="Tell us about yourself..."
      />
    </Stack>
  ),
};
