import React from 'react';
import {
  Card,
  CardContent,
  Skeleton,
  Stack,
  Box,
  Divider,
} from '@mui/material';

export const UserProfileCardSkeleton: React.FC = () => {
  return (
    <Card sx={{ maxWidth: 400 }}>
      <CardContent>
        <Stack spacing={2} alignItems="center">
          {/* Avatar Skeleton */}
          <Skeleton variant="circular" width={80} height={80} />

          {/* Name and Username Skeleton */}
          <Box textAlign="center" width="100%">
            <Skeleton
              variant="text"
              width="60%"
              height={32}
              sx={{ mx: 'auto' }}
            />
            <Skeleton
              variant="text"
              width="40%"
              height={24}
              sx={{ mx: 'auto' }}
            />
          </Box>

          {/* Bio Skeleton */}
          <Box width="100%">
            <Skeleton variant="text" width="100%" sx={{ mx: 'auto' }} />
            <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
          </Box>

          {/* Stats Skeleton */}
          <Stack
            direction="row"
            spacing={4}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Box textAlign="center">
              <Skeleton variant="text" width={40} height={32} />
              <Skeleton variant="text" width={40} height={18} />
            </Box>
            <Box textAlign="center">
              <Skeleton variant="text" width={40} height={32} />
              <Skeleton variant="text" width={60} height={18} />
            </Box>
            <Box textAlign="center">
              <Skeleton variant="text" width={40} height={32} />
              <Skeleton variant="text" width={60} height={18} />
            </Box>
          </Stack>

          {/* Button Skeleton */}
          <Skeleton
            variant="rounded"
            width="100%"
            height={40}
            sx={{ borderRadius: 20 }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default UserProfileCardSkeleton;
