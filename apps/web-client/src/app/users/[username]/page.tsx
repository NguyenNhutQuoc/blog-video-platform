'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Stack,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { PersonAdd, PersonRemove } from '@mui/icons-material';
import { NavigationBar, PostCard, UserProfileCard } from '@blog/shared-ui-kit';
import { useAuth } from '../../../providers/AuthProvider';
import {
  useUser,
  useUserPosts,
  useFollowUser,
  useUnfollowUser,
  useUserFollowers,
  useUserFollowing,
} from '@blog/shared-data-access';

function UserProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const username = params.username as string;

  const { data: profileUser, isLoading: userLoading } = useUser(username);
  const { data: postsData, isLoading: postsLoading } = useUserPosts(username);
  const { data: followersData } = useUserFollowers(username);
  const { data: followingData } = useUserFollowing(username);
  const followUserMutation = useFollowUser();
  const unfollowUserMutation = useUnfollowUser();

  const isOwnProfile = currentUser?.username === username;
  const isFollowing = false; // TODO: Implement following state from API

  const handleFollowToggle = async () => {
    if (!profileUser) return;

    try {
      if (isFollowing) {
        await unfollowUserMutation.mutateAsync(profileUser.id);
      } else {
        await followUserMutation.mutateAsync(profileUser.id);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (userLoading) {
    return (
      <>
        <NavigationBar
          user={currentUser || undefined}
          notificationCount={0}
          onProfileClick={() =>
            currentUser && router.push(`/users/${currentUser.username}`)
          }
          onLoginClick={() => router.push('/auth/login')}
          onCreatePostClick={() => router.push('/posts/new')}
          onLogoutClick={handleLogout}
        />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (!profileUser) {
    return (
      <>
        <NavigationBar
          user={currentUser || undefined}
          notificationCount={0}
          onProfileClick={() =>
            currentUser && router.push(`/users/${currentUser.username}`)
          }
          onLoginClick={() => router.push('/auth/login')}
          onCreatePostClick={() => router.push('/posts/new')}
          onLogoutClick={handleLogout}
        />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Typography variant="h5" textAlign="center">
            User not found
          </Typography>
        </Container>
      </>
    );
  }

  const posts = postsData?.pages.flatMap((page) => page.data) || [];
  const followers = followersData?.pages.flatMap((page) => page.data) || [];
  const following = followingData?.pages.flatMap((page) => page.data) || [];

  return (
    <>
      <NavigationBar
        user={currentUser || undefined}
        notificationCount={0}
        onProfileClick={() =>
          currentUser && router.push(`/users/${currentUser.username}`)
        }
        onLoginClick={() => router.push('/auth/login')}
        onCreatePostClick={() => router.push('/posts/new')}
        onLogoutClick={handleLogout}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Profile Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            gap={3}
            mb={3}
          >
            <Avatar
              src={profileUser.avatarUrl}
              alt={profileUser.fullName}
              sx={{ width: 120, height: 120 }}
            />
            <Box flex={1}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {profileUser.fullName}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                @{profileUser.username}
              </Typography>
              {profileUser.bio && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  {profileUser.bio}
                </Typography>
              )}
            </Box>
            {!isOwnProfile && currentUser && (
              <Button
                variant={isFollowing ? 'outlined' : 'contained'}
                startIcon={isFollowing ? <PersonRemove /> : <PersonAdd />}
                onClick={handleFollowToggle}
                disabled={
                  followUserMutation.isPending || unfollowUserMutation.isPending
                }
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </Box>

          {/* Stats */}
          <Stack direction="row" spacing={4}>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={700}>
                {posts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Posts
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={700}>
                {followers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Followers
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={700}>
                {following.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Following
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Tabs */}
        <Box mb={3}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab label="Posts" />
            <Tab label="Followers" />
            <Tab label="Following" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            {postsLoading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress />
              </Box>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  excerpt={post.excerpt || ''}
                  featuredImageUrl={post.featuredImageUrl}
                  author={{
                    username: post.author.username,
                    fullName: post.author.fullName,
                    avatarUrl: post.author.avatarUrl,
                  }}
                  tags={post.tags.map((tag) => tag.name)}
                  likeCount={post.likeCount}
                  commentCount={post.commentCount}
                  createdAt={post.createdAt}
                />
              ))
            ) : (
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary">
                  No posts yet
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {followers.length > 0 ? (
              followers.map((follower) => (
                <UserProfileCard
                  key={follower.id}
                  username={follower.username}
                  fullName={follower.fullName}
                  bio={follower.bio || ''}
                  avatarUrl={follower.avatarUrl}
                  postsCount={0}
                  followersCount={0}
                  followingCount={0}
                />
              ))
            ) : (
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary">
                  No followers yet
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {following.length > 0 ? (
              following.map((followedUser) => (
                <UserProfileCard
                  key={followedUser.id}
                  username={followedUser.username}
                  fullName={followedUser.fullName}
                  bio={followedUser.bio || ''}
                  avatarUrl={followedUser.avatarUrl}
                  postsCount={0}
                  followersCount={0}
                  followingCount={0}
                />
              ))
            ) : (
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary">
                  Not following anyone yet
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Container>
    </>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
