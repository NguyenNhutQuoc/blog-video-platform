import React from 'react';
import { AppBar, Toolbar, Skeleton, Stack } from '@mui/material';

export const NavigationBarSkeleton: React.FC = () => {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        {/* Title Skeleton */}
        <Skeleton variant="text" width={150} height={32} sx={{ mr: 4 }} />

        {/* Search Bar Skeleton */}
        <Skeleton
          variant="rounded"
          sx={{
            marginRight: 'auto',
            width: { xs: 0, sm: 400 },
            height: 40,
            borderRadius: 20,
            display: { xs: 'none', sm: 'block' },
          }}
        />

        {/* Right Side Actions Skeleton */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton
            variant="rounded"
            width={100}
            height={36}
            sx={{ borderRadius: 18, display: { xs: 'none', sm: 'block' } }}
          />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={36} height={36} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBarSkeleton;
