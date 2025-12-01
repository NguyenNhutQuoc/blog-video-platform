import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Skeleton,
  Stack,
  Box,
} from '@mui/material';

export interface PostCardSkeletonProps {
  hasImage?: boolean;
}

export const PostCardSkeleton: React.FC<PostCardSkeletonProps> = ({
  hasImage = true,
}) => {
  return (
    <Card sx={{ maxWidth: 600 }}>
      {/* Author Header Skeleton */}
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} />
          <Box flex={1}>
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="30%" height={18} />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Stack>
      </CardContent>

      {/* Featured Image Skeleton */}
      {hasImage && (
        <Skeleton
          variant="rectangular"
          height={240}
          sx={{ width: '100%' }}
          animation="wave"
        />
      )}

      {/* Content Skeleton */}
      <CardContent>
        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />

        {/* Tags Skeleton */}
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={50} height={24} />
        </Stack>
      </CardContent>

      {/* Actions Skeleton */}
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flex={1}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={24} />
          <Skeleton variant="circular" width={28} height={28} sx={{ ml: 2 }} />
          <Skeleton variant="text" width={24} />
        </Stack>
        <Skeleton variant="circular" width={28} height={28} />
      </CardActions>
    </Card>
  );
};

export default PostCardSkeleton;
