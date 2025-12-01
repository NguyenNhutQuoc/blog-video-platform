import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';
import { Stack } from '@mui/material';

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: {
      control: 'text',
    },
    variant: {
      control: 'select',
      options: ['filled', 'outlined'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
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
    onDelete: {
      action: 'deleted',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    label: 'Tag',
  },
};

export const Filled: Story = {
  args: {
    label: 'Filled Tag',
    variant: 'filled',
  },
};

export const Outlined: Story = {
  args: {
    label: 'Outlined Tag',
    variant: 'outlined',
  },
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
      <Tag label="Default" />
      <Tag label="Primary" color="primary" />
      <Tag label="Secondary" color="secondary" />
      <Tag label="Error" color="error" />
      <Tag label="Warning" color="warning" />
      <Tag label="Info" color="info" />
      <Tag label="Success" color="success" />
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tag label="Small" size="small" />
      <Tag label="Medium" size="medium" />
    </Stack>
  ),
};

export const Deletable: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <Tag label="React" onDelete={() => alert('Delete React')} />
      <Tag label="TypeScript" onDelete={() => alert('Delete TypeScript')} />
      <Tag label="JavaScript" onDelete={() => alert('Delete JavaScript')} />
    </Stack>
  ),
};

export const Clickable: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <Tag label="Click me" onClick={() => alert('Clicked!')} />
      <Tag
        label="Filter: Active"
        color="primary"
        onClick={() => alert('Toggle filter')}
      />
    </Stack>
  ),
};

export const BlogTags: Story = {
  render: () => (
    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
      <Tag label="react" variant="outlined" size="small" />
      <Tag label="typescript" variant="outlined" size="small" />
      <Tag label="web-development" variant="outlined" size="small" />
      <Tag label="frontend" variant="outlined" size="small" />
      <Tag label="best-practices" variant="outlined" size="small" />
    </Stack>
  ),
};

export const StatusTags: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <Tag label="Published" color="success" size="small" />
      <Tag label="Draft" color="warning" size="small" />
      <Tag label="Archived" color="default" size="small" />
    </Stack>
  ),
};
