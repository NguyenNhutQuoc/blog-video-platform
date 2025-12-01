import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

export const CommentCardSkeleton: React.FC = () => {
  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" spacing={2}>
        {/* Avatar Skeleton */}
        <Skeleton variant="circular" width={36} height={36} />

        <Box flex={1}>
          {/* Author and Time Skeleton */}
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
            <Skeleton variant="text" width={100} height={24} />
            <Skeleton variant="text" width={80} height={18} />
            <Skeleton variant="text" width={60} height={18} />
          </Stack>

          {/* Comment Content Skeleton */}
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="70%" sx={{ mb: 1 }} />

          {/* Actions Skeleton */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={20} />
            </Stack>
            <Skeleton variant="text" width={40} height={18} />
          </Stack>
        </Box>

        {/* More Button Skeleton */}
        <Skeleton variant="circular" width={24} height={24} />
      </Stack>
    </Box>
  );
};

export default CommentCardSkeleton;
