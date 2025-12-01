import type { Meta, StoryObj } from '@storybook/react';
import { NavigationBar } from './NavigationBar';
import { Box } from '@mui/material';

const meta: Meta<typeof NavigationBar> = {
  title: 'Components/NavigationBar',
  component: NavigationBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onMenuClick: { action: 'menuClicked' },
    onSearchChange: { action: 'searchChanged' },
    onNotificationClick: { action: 'notificationClicked' },
    onProfileClick: { action: 'profileClicked' },
    onLoginClick: { action: 'loginClicked' },
    onCreatePostClick: { action: 'createPostClicked' },
    onLogoutClick: { action: 'logoutClicked' },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationBar>;

export const LoggedOut: Story = {
  args: {
    title: 'Blog Platform',
  },
};

export const LoggedIn: Story = {
  args: {
    title: 'Blog Platform',
    user: {
      username: 'johndoe',
      fullName: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    notificationCount: 3,
  },
};

export const NoNotifications: Story = {
  args: {
    title: 'Blog Platform',
    user: {
      username: 'janedoe',
      fullName: 'Jane Doe',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
    },
    notificationCount: 0,
  },
};

export const ManyNotifications: Story = {
  args: {
    title: 'Blog Platform',
    user: {
      username: 'popular',
      fullName: 'Popular User',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    },
    notificationCount: 99,
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Tech Blog',
    user: {
      username: 'techwriter',
      fullName: 'Tech Writer',
    },
  },
};

export const NoAvatar: Story = {
  args: {
    title: 'Blog Platform',
    user: {
      username: 'noavatar',
      fullName: 'No Avatar User',
    },
    notificationCount: 5,
  },
};

export const WithContent: Story = {
  render: () => (
    <Box>
      <NavigationBar
        title="Blog Platform"
        user={{
          username: 'johndoe',
          fullName: 'John Doe',
          avatarUrl: 'https://i.pravatar.cc/150?img=1',
        }}
        notificationCount={3}
      />
      <Box sx={{ p: 4, height: '500px', bgcolor: 'grey.100' }}>
        <Box
          sx={{
            p: 4,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          Page content goes here
        </Box>
      </Box>
    </Box>
  ),
};

export const StickyBehavior: Story = {
  render: () => (
    <Box>
      <NavigationBar
        title="Blog Platform"
        user={{
          username: 'johndoe',
          fullName: 'John Doe',
          avatarUrl: 'https://i.pravatar.cc/150?img=1',
        }}
        notificationCount={3}
      />
      <Box sx={{ p: 4, height: '2000px', bgcolor: 'grey.100' }}>
        <Box sx={{ p: 2, mb: 2, bgcolor: 'white', borderRadius: 2 }}>
          Scroll down to see the sticky navigation bar behavior
        </Box>
        {Array.from({ length: 20 }).map((_, i) => (
          <Box key={i} sx={{ p: 3, mb: 2, bgcolor: 'white', borderRadius: 2 }}>
            Content block {i + 1}
          </Box>
        ))}
      </Box>
    </Box>
  ),
};
