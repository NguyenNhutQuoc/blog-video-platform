import type { Meta, StoryObj, Decorator } from '@storybook/react';
import { CommentCard } from './CommentCard';
import { Paper } from '@mui/material';

const meta: Meta<typeof CommentCard> = {
  title: 'Components/CommentCard',
  component: CommentCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onLike: { action: 'liked' },
    onReply: { action: 'replied' },
  },
};

export default meta;
type Story = StoryObj<typeof CommentCard>;

export const Default: Story = {
  args: {
    id: '1',
    content: 'This is a great article! Thanks for sharing your insights.',
    author: {
      username: 'johndoe',
      fullName: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    createdAt: new Date().toISOString(),
    likeCount: 5,
    isLiked: false,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <Paper sx={{ p: 2, width: 500 }}>
        <Story />
      </Paper>
    ),
  ] as Decorator[],
};

export const Liked: Story = {
  args: {
    ...Default.args,
    isLiked: true,
    likeCount: 6,
  },
  decorators: Default.decorators,
};

export const NoLikes: Story = {
  args: {
    id: '2',
    content: "I'm just getting started with this topic. Very helpful!",
    author: {
      username: 'newuser',
      fullName: 'New User',
    },
    createdAt: '2024-12-01T10:00:00Z',
    likeCount: 0,
  },
  decorators: Default.decorators,
};

export const LongComment: Story = {
  args: {
    id: '3',
    content:
      'This is an incredibly comprehensive guide. I especially appreciate how you broke down the complex concepts into digestible chunks. The code examples were particularly helpful in understanding how to implement these patterns in real-world applications. I have been struggling with this topic for weeks, and this article finally made everything click. Thank you so much for taking the time to write this!',
    author: {
      username: 'detailedreader',
      fullName: 'Detailed Reader',
      avatarUrl: 'https://i.pravatar.cc/150?img=10',
    },
    createdAt: '2024-11-28T14:30:00Z',
    likeCount: 42,
    isLiked: true,
  },
  decorators: Default.decorators,
};

export const CommentThread: Story = {
  render: () => (
    <Paper sx={{ p: 2, width: 500 }}>
      <CommentCard
        id="1"
        content="Great tutorial! Do you have any recommendations for learning more about this topic?"
        author={{
          username: 'curious',
          fullName: 'Curious Developer',
          avatarUrl: 'https://i.pravatar.cc/150?img=5',
        }}
        createdAt="2024-11-29T09:00:00Z"
        likeCount={12}
      />
      <CommentCard
        id="2"
        content="I totally agree! This is one of the best explanations I've seen."
        author={{
          username: 'supporter',
          fullName: 'Supporter',
          avatarUrl: 'https://i.pravatar.cc/150?img=8',
        }}
        createdAt="2024-11-29T11:30:00Z"
        likeCount={3}
        isLiked
      />
      <CommentCard
        id="3"
        content="Would love to see a follow-up post on advanced techniques!"
        author={{
          username: 'eager',
          fullName: 'Eager Learner',
        }}
        createdAt="2024-11-30T08:00:00Z"
        likeCount={8}
      />
    </Paper>
  ),
};

export const HighEngagement: Story = {
  args: {
    id: '4',
    content: 'This changed how I think about software architecture. Must-read!',
    author: {
      username: 'influencer',
      fullName: 'Tech Influencer',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    },
    createdAt: '2024-11-20T16:00:00Z',
    likeCount: 156,
    isLiked: true,
  },
  decorators: Default.decorators,
};
