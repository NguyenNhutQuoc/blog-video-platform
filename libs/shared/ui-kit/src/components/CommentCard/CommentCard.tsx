import React from 'react';
import { Box, Typography, Stack, IconButton } from '@mui/material';
import { FavoriteBorder, Favorite, MoreVert } from '@mui/icons-material';
import { Avatar } from '../Avatar';

export interface CommentCardProps {
  id: string;
  content: string;
  author: {
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  likeCount: number;
  isLiked?: boolean;
  onLike?: () => void;
  onReply?: () => void;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  content,
  author,
  createdAt,
  likeCount,
  isLiked = false,
  onLike,
  onReply,
}) => {
  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" spacing={2}>
        <Avatar
          src={author.avatarUrl}
          name={author.fullName}
          sx={{ width: 36, height: 36 }}
        />

        <Box flex={1}>
          {/* Author and Time */}
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              {author.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{author.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ·
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(createdAt).toLocaleDateString()}
            </Typography>
          </Stack>

          {/* Comment Content */}
          <Typography variant="body2" paragraph sx={{ mb: 1 }}>
            {content}
          </Typography>

          {/* Actions */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton
                size="small"
                onClick={onLike}
                color={isLiked ? 'error' : 'default'}
              >
                {isLiked ? (
                  <Favorite sx={{ fontSize: 16 }} />
                ) : (
                  <FavoriteBorder sx={{ fontSize: 16 }} />
                )}
              </IconButton>
              {likeCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {likeCount}
                </Typography>
              )}
            </Stack>

            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={onReply}
            >
              Reply
            </Typography>
          </Stack>
        </Box>

        <IconButton size="small">
          <MoreVert fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default CommentCard;
