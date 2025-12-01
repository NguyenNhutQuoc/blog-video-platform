import type { Meta, StoryObj } from '@storybook/react';
import { UserProfileCard } from './UserProfileCard';
import { Stack } from '@mui/material';

const meta: Meta<typeof UserProfileCard> = {
  title: 'Components/UserProfileCard',
  component: UserProfileCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onFollow: { action: 'followed' },
    onUnfollow: { action: 'unfollowed' },
    onEdit: { action: 'edited' },
  },
};

export default meta;
type Story = StoryObj<typeof UserProfileCard>;

export const Default: Story = {
  args: {
    username: 'johndoe',
    fullName: 'John Doe',
    bio: 'Full-stack developer passionate about creating great user experiences. Writing about web development and software engineering.',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    postsCount: 42,
    followersCount: 1250,
    followingCount: 350,
  },
};

export const NotFollowing: Story = {
  args: {
    ...Default.args,
    isFollowing: false,
  },
};

export const Following: Story = {
  args: {
    ...Default.args,
    isFollowing: true,
  },
};

export const OwnProfile: Story = {
  args: {
    ...Default.args,
    isOwnProfile: true,
  },
};

export const NoBio: Story = {
  args: {
    username: 'newdev',
    fullName: 'New Developer',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    postsCount: 3,
    followersCount: 28,
    followingCount: 150,
  },
};

export const NoAvatar: Story = {
  args: {
    username: 'anonymous',
    fullName: 'Anonymous User',
    bio: 'I prefer to keep a low profile.',
    postsCount: 10,
    followersCount: 50,
    followingCount: 25,
  },
};

export const HighFollowers: Story = {
  args: {
    username: 'influencer',
    fullName: 'Tech Influencer',
    bio: '🚀 Building the future | 500K+ followers on Twitter | Author of "Modern Web Development"',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    postsCount: 245,
    followersCount: 125000,
    followingCount: 800,
    isFollowing: true,
  },
};

export const NewUser: Story = {
  args: {
    username: 'justjoined',
    fullName: 'Just Joined',
    bio: 'Excited to start sharing my journey!',
    postsCount: 0,
    followersCount: 0,
    followingCount: 5,
  },
};

export const ProfileCards: Story = {
  render: () => (
    <Stack direction="row" spacing={3} flexWrap="wrap">
      <UserProfileCard
        username="developer1"
        fullName="Alice Developer"
        bio="Frontend specialist"
        avatarUrl="https://i.pravatar.cc/150?img=20"
        postsCount={15}
        followersCount={230}
        followingCount={180}
      />
      <UserProfileCard
        username="developer2"
        fullName="Bob Engineer"
        bio="Backend wizard"
        avatarUrl="https://i.pravatar.cc/150?img=15"
        postsCount={28}
        followersCount={450}
        followingCount={220}
        isFollowing
      />
    </Stack>
  ),
};
