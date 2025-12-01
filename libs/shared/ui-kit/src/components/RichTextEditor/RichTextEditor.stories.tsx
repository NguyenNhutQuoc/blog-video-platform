import type { Meta, StoryObj } from '@storybook/react';
import { RichTextEditor } from './RichTextEditor';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';

const meta: Meta<typeof RichTextEditor> = {
  title: 'Components/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    value: {
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
    onChange: { action: 'changed' },
  },
};

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

export const Default: Story = {
  args: {
    placeholder: 'Start writing your content...',
  },
};

export const WithContent: Story = {
  args: {
    value:
      '<h2>Hello World</h2><p>This is some <strong>rich text</strong> content with <em>formatting</em>.</p><ul><li>First item</li><li>Second item</li></ul>',
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Content is required...',
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    value: '<p>This content cannot be edited.</p>',
    disabled: true,
  },
};

export const BlogPost: Story = {
  args: {
    value: `
      <h1>Getting Started with React</h1>
      <p>React is a powerful JavaScript library for building user interfaces. In this guide, we'll explore the fundamentals.</p>
      <h2>Why React?</h2>
      <p>React offers several advantages:</p>
      <ul>
        <li>Component-based architecture</li>
        <li>Virtual DOM for efficient updates</li>
        <li>Large ecosystem and community</li>
      </ul>
      <blockquote>React makes it painless to create interactive UIs.</blockquote>
      <h2>Code Example</h2>
      <pre><code>const App = () => {
  return <h1>Hello, World!</h1>;
};</code></pre>
      <p>That's all you need to get started!</p>
    `,
    placeholder: 'Write your blog post...',
  },
};

export const Interactive: Story = {
  render: function InteractiveEditor() {
    const [content, setContent] = useState('<p>Start typing...</p>');

    return (
      <Box>
        <RichTextEditor value={content} onChange={setContent} />
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            HTML Output:
          </Typography>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
            }}
          >
            {content}
          </Typography>
        </Box>
      </Box>
    );
  },
};
