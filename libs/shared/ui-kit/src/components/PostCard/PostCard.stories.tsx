import type { Meta, StoryObj } from '@storybook/react';
import { PostCard } from './PostCard';
import { Stack } from '@mui/material';

const meta: Meta<typeof PostCard> = {
  title: 'Components/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onLike: { action: 'liked' },
    onComment: { action: 'commented' },
    onBookmark: { action: 'bookmarked' },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof PostCard>;

export const Default: Story = {
  args: {
    id: '1',
    title: 'Getting Started with React and TypeScript',
    excerpt:
      'Learn how to set up a new React project with TypeScript from scratch. This guide covers everything you need to know to get started.',
    featuredImageUrl: 'https://picsum.photos/600/240',
    author: {
      username: 'johndoe',
      fullName: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    tags: ['React', 'TypeScript', 'Tutorial'],
    likeCount: 42,
    commentCount: 8,
    isLiked: false,
    createdAt: new Date().toISOString(),
  },
};

export const Liked: Story = {
  args: {
    ...Default.args,
    isLiked: true,
  },
};

export const WithoutImage: Story = {
  args: {
    id: '2',
    title: 'Understanding CSS Grid Layout',
    excerpt:
      'CSS Grid is a powerful layout system that allows you to create complex layouts with ease. Discover the fundamentals in this comprehensive guide.',
    author: {
      username: 'janedoe',
      fullName: 'Jane Doe',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
    },
    tags: ['CSS', 'Web Design'],
    likeCount: 128,
    commentCount: 24,
    createdAt: '2024-11-15T10:30:00Z',
  },
};

export const WithoutTags: Story = {
  args: {
    id: '3',
    title: 'My First Blog Post',
    excerpt:
      'Welcome to my blog! This is my first post where I share my thoughts on software development.',
    featuredImageUrl: 'https://picsum.photos/600/241',
    author: {
      username: 'newuser',
      fullName: 'New User',
    },
    tags: [],
    likeCount: 5,
    commentCount: 2,
    createdAt: '2024-12-01T08:00:00Z',
  },
};

export const HighEngagement: Story = {
  args: {
    id: '4',
    title: '10 Tips for Better Code Reviews',
    excerpt:
      'Code reviews are essential for maintaining code quality. Here are 10 tips that will help you become a better code reviewer.',
    featuredImageUrl: 'https://picsum.photos/600/242',
    author: {
      username: 'seniordev',
      fullName: 'Senior Developer',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    },
    tags: ['Best Practices', 'Code Review', 'Team', 'Collaboration'],
    likeCount: 1250,
    commentCount: 156,
    createdAt: '2024-10-20T14:00:00Z',
  },
};

export const LongTitle: Story = {
  args: {
    id: '5',
    title:
      'A Comprehensive Guide to Building Scalable Microservices Architecture with Node.js, Docker, and Kubernetes',
    excerpt:
      'This in-depth guide covers everything from basic concepts to advanced deployment strategies.',
    author: {
      username: 'architect',
      fullName: 'System Architect',
      avatarUrl: 'https://i.pravatar.cc/150?img=8',
    },
    tags: ['Microservices', 'Docker', 'Kubernetes'],
    likeCount: 89,
    commentCount: 12,
    createdAt: '2024-11-01T09:00:00Z',
  },
};

export const ManyTags: Story = {
  args: {
    id: '6',
    title: 'Full Stack Development in 2024',
    excerpt:
      'An overview of the technologies you should learn for full stack development.',
    featuredImageUrl: 'https://picsum.photos/600/243',
    author: {
      username: 'fullstack',
      fullName: 'Full Stack Dev',
    },
    tags: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS'],
    likeCount: 234,
    commentCount: 45,
    createdAt: '2024-11-28T16:00:00Z',
  },
};

export const Feed: Story = {
  render: () => (
    <Stack spacing={3} sx={{ width: 600 }}>
      <PostCard
        id="1"
        title="Introduction to Machine Learning"
        excerpt="Discover the basics of machine learning and how to get started with your first ML project."
        featuredImageUrl="https://picsum.photos/600/244"
        author={{
          username: 'mlexpert',
          fullName: 'ML Expert',
          avatarUrl: 'https://i.pravatar.cc/150?img=20',
        }}
        tags={['Machine Learning', 'AI', 'Python']}
        likeCount={567}
        commentCount={89}
        createdAt="2024-11-25T12:00:00Z"
      />
      <PostCard
        id="2"
        title="The Future of Web Development"
        excerpt="Exploring upcoming trends and technologies that will shape the future of web development."
        author={{
          username: 'webguru',
          fullName: 'Web Guru',
          avatarUrl: 'https://i.pravatar.cc/150?img=15',
        }}
        tags={['Web Development', 'Trends']}
        likeCount={234}
        commentCount={34}
        isLiked
        createdAt="2024-11-20T10:00:00Z"
      />
    </Stack>
  ),
};
