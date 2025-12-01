import type { Meta, StoryObj } from '@storybook/react';
import { Stack, Box, Typography } from '@mui/material';
import { PostCardSkeleton } from './PostCardSkeleton';
import { UserProfileCardSkeleton } from './UserProfileCardSkeleton';
import { CommentCardSkeleton } from './CommentCardSkeleton';
import { NavigationBarSkeleton } from './NavigationBarSkeleton';
import { PostDetailSkeleton } from './PostDetailSkeleton';

const meta: Meta = {
  title: 'Components/Skeleton',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// PostCardSkeleton Stories
export const PostCard: StoryObj<typeof PostCardSkeleton> = {
  render: () => <PostCardSkeleton />,
};

export const PostCardWithoutImage: StoryObj<typeof PostCardSkeleton> = {
  render: () => <PostCardSkeleton hasImage={false} />,
};

export const PostCardList: StoryObj<typeof PostCardSkeleton> = {
  render: () => (
    <Stack spacing={3}>
      <PostCardSkeleton />
      <PostCardSkeleton hasImage={false} />
      <PostCardSkeleton />
    </Stack>
  ),
};

// UserProfileCardSkeleton Stories
export const UserProfileCard: StoryObj<typeof UserProfileCardSkeleton> = {
  render: () => <UserProfileCardSkeleton />,
};

// CommentCardSkeleton Stories
export const CommentCard: StoryObj<typeof CommentCardSkeleton> = {
  render: () => <CommentCardSkeleton />,
};

export const CommentCardList: StoryObj<typeof CommentCardSkeleton> = {
  render: () => (
    <Stack
      spacing={0}
      divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}
    >
      <CommentCardSkeleton />
      <CommentCardSkeleton />
      <CommentCardSkeleton />
    </Stack>
  ),
};

// NavigationBarSkeleton Stories
export const NavigationBar: StoryObj<typeof NavigationBarSkeleton> = {
  render: () => <NavigationBarSkeleton />,
};

// PostDetailSkeleton Stories
export const PostDetail: StoryObj<typeof PostDetailSkeleton> = {
  render: () => <PostDetailSkeleton />,
};

// Full Page Loading Examples
export const FullPageWithPostList: StoryObj = {
  render: () => (
    <Box>
      <NavigationBarSkeleton />
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          {/* Main Content */}
          <Box flex={2}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              <Box component="span" sx={{ visibility: 'hidden' }}>
                Posts
              </Box>
            </Typography>
            <Stack spacing={3}>
              <PostCardSkeleton />
              <PostCardSkeleton hasImage={false} />
              <PostCardSkeleton />
            </Stack>
          </Box>

          {/* Sidebar */}
          <Box flex={1} sx={{ display: { xs: 'none', md: 'block' } }}>
            <UserProfileCardSkeleton />
          </Box>
        </Stack>
      </Box>
    </Box>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const FullPagePostDetail: StoryObj = {
  render: () => (
    <Box>
      <NavigationBarSkeleton />
      <Box sx={{ px: 3 }}>
        <PostDetailSkeleton />
        {/* Comments */}
        <Box sx={{ maxWidth: 800, mx: 'auto', pb: 4 }}>
          <Stack
            spacing={0}
            divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}
          >
            <CommentCardSkeleton />
            <CommentCardSkeleton />
            <CommentCardSkeleton />
          </Stack>
        </Box>
      </Box>
    </Box>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
