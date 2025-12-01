import React from 'react';
import { Box, Skeleton, Stack, Divider } from '@mui/material';

export const PostDetailSkeleton: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      {/* Title Skeleton */}
      <Skeleton variant="text" width="90%" height={48} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={48} sx={{ mb: 3 }} />

      {/* Author Header Skeleton */}
      <Stack direction="row" spacing={2} alignItems="center" mb={4}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box flex={1}>
          <Skeleton variant="text" width={150} height={24} />
          <Skeleton variant="text" width={200} height={20} />
        </Box>
        <Skeleton
          variant="rounded"
          width={100}
          height={36}
          sx={{ borderRadius: 18 }}
        />
      </Stack>

      {/* Featured Image Skeleton */}
      <Skeleton
        variant="rectangular"
        height={400}
        sx={{ width: '100%', borderRadius: 2, mb: 4 }}
        animation="wave"
      />

      {/* Content Skeleton */}
      <Box sx={{ mb: 4 }}>
        {[...Array(8)].map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={i === 7 ? '70%' : '100%'}
            height={24}
            sx={{ mb: 1 }}
          />
        ))}
        <Box sx={{ my: 3 }} />
        {[...Array(6)].map((_, i) => (
          <Skeleton
            key={`p2-${i}`}
            variant="text"
            width={i === 5 ? '50%' : '100%'}
            height={24}
            sx={{ mb: 1 }}
          />
        ))}
      </Box>

      {/* Tags Skeleton */}
      <Stack direction="row" spacing={1} mb={4}>
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={60} height={32} />
      </Stack>

      <Divider sx={{ my: 4 }} />

      {/* Actions Skeleton */}
      <Stack direction="row" spacing={3} alignItems="center" mb={4}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={30} />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={30} />
        </Stack>
        <Skeleton variant="circular" width={40} height={40} />
      </Stack>

      <Divider sx={{ my: 4 }} />

      {/* Comments Section Header Skeleton */}
      <Skeleton variant="text" width={150} height={32} sx={{ mb: 3 }} />

      {/* Comment Input Skeleton */}
      <Stack direction="row" spacing={2} mb={4}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton
          variant="rounded"
          width="100%"
          height={80}
          sx={{ borderRadius: 2 }}
        />
      </Stack>
    </Box>
  );
};

export default PostDetailSkeleton;
