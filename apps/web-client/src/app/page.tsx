'use client';

import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
} from '@mui/material';
import { NavigationBar, PostCard } from '@blog/shared-ui-kit';
import { useInfinitePosts } from '@blog/shared-data-access';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfinitePosts({
      limit: 10,
    });

  // Backend returns cursor-based pagination with 'posts' array
  const posts = data?.pages.flatMap((page) => page.posts) || [];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <NavigationBar
        user={user || undefined}
        notificationCount={0}
        onProfileClick={() => user && router.push(`/users/${user.username}`)}
        onLoginClick={() => router.push('/auth/login')}
        onCreatePostClick={() => router.push('/posts/new')}
        onLogoutClick={handleLogout}
      />

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Welcome to Blog Platform
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover amazing stories and insights from our community
          </Typography>
        </Box>

        {/* Tabs */}
        <Box mb={3}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab label="For You" />
            <Tab label="Following" disabled={!isAuthenticated} />
            <Tab label="Trending" />
          </Tabs>
        </Box>

        {/* Posts Feed */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : posts.length > 0 ? (
          <Stack spacing={3}>
            {posts.map((post) => (
              <Box
                key={post.id}
                onClick={() => router.push(`/posts/${post.slug}`)}
                sx={{ cursor: 'pointer' }}
              >
                <PostCard
                  id={post.id}
                  title={post.title}
                  excerpt={post.excerpt || ''}
                  featuredImageUrl={post.featuredImageUrl}
                  author={{
                    username: post.author.username,
                    fullName: post.author.fullName,
                    avatarUrl: post.author.avatarUrl,
                  }}
                  tags={[]} // PostSummary doesn't include tags
                  likeCount={post.likeCount}
                  commentCount={post.commentCount}
                  createdAt={post.createdAt}
                />
              </Box>
            ))}

            {hasNextPage && (
              <Box display="flex" justifyContent="center" py={2}>
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '20px',
                    cursor: isFetchingNextPage ? 'not-allowed' : 'pointer',
                    backgroundColor: '#6750A4',
                    color: 'white',
                  }}
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </button>
              </Box>
            )}
          </Stack>
        ) : (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              No posts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Be the first to create a post!
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
}
