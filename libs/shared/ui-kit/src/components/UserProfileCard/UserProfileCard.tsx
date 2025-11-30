import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Divider,
} from '@mui/material';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Badge } from '../Badge';

export interface UserProfileCardProps {
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onEdit?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  username,
  fullName,
  bio,
  avatarUrl,
  postsCount,
  followersCount,
  followingCount,
  isFollowing = false,
  isOwnProfile = false,
  onFollow,
  onUnfollow,
  onEdit,
}) => {
  return (
    <Card sx={{ maxWidth: 400 }}>
      <CardContent>
        <Stack spacing={2} alignItems="center">
          {/* Avatar */}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              isOwnProfile ? (
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    border: '2px solid white',
                  }}
                />
              ) : null
            }
          >
            <Avatar
              src={avatarUrl}
              name={fullName}
              sx={{ width: 80, height: 80 }}
            />
          </Badge>

          {/* Name and Username */}
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600}>
              {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{username}
            </Typography>
          </Box>

          {/* Bio */}
          {bio && (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              {bio}
            </Typography>
          )}

          {/* Stats */}
          <Stack
            direction="row"
            spacing={4}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={600}>
                {postsCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posts
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={600}>
                {followersCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Followers
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={600}>
                {followingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Following
              </Typography>
            </Box>
          </Stack>

          {/* Action Button */}
          {isOwnProfile ? (
            <Button variant="outlined" fullWidth onClick={onEdit}>
              Edit Profile
            </Button>
          ) : (
            <Button
              variant={isFollowing ? 'outlined' : 'filled'}
              fullWidth
              onClick={isFollowing ? onUnfollow : onFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
