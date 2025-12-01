import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  Box,
  Stack,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  BookmarkBorder,
  MoreVert,
} from '@mui/icons-material';
import { Avatar } from '../Avatar';
import { Tag } from '../Tag';

export interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  featuredImageUrl?: string | null;
  author: {
    username: string;
    fullName: string | null;
    avatarUrl?: string | null;
  };
  tags?: string[];
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onClick?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  title,
  excerpt,
  featuredImageUrl,
  author,
  tags = [],
  likeCount,
  commentCount,
  isLiked = false,
  createdAt,
  onLike,
  onComment,
  onBookmark,
  onClick,
}) => {
  return (
    <Card sx={{ maxWidth: 600, cursor: onClick ? 'pointer' : 'default' }}>
      {/* Author Header */}
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={author.avatarUrl ?? undefined}
            name={author.fullName || author.username}
            sx={{ width: 40, height: 40 }}
          />
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {author.fullName || author.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{author.username} · {new Date(createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <IconButton size="small">
            <MoreVert fontSize="small" />
          </IconButton>
        </Stack>
      </CardContent>

      {/* Featured Image */}
      {featuredImageUrl && (
        <CardMedia
          component="img"
          height="240"
          image={featuredImageUrl}
          alt={title}
          sx={{ cursor: 'pointer' }}
          onClick={onClick}
        />
      )}

      {/* Content */}
      <CardContent sx={{ cursor: 'pointer' }} onClick={onClick}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {excerpt}
        </Typography>

        {/* Tags */}
        {tags.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {tags.slice(0, 3).map((tag) => (
              <Tag key={tag} label={tag} size="small" />
            ))}
          </Stack>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" flex={1}>
          <IconButton
            size="small"
            onClick={onLike}
            color={isLiked ? 'error' : 'default'}
          >
            {isLiked ? (
              <Favorite fontSize="small" />
            ) : (
              <FavoriteBorder fontSize="small" />
            )}
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            {likeCount}
          </Typography>

          <IconButton size="small" onClick={onComment} sx={{ ml: 2 }}>
            <ChatBubbleOutline fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            {commentCount}
          </Typography>
        </Stack>

        <IconButton size="small" onClick={onBookmark}>
          <BookmarkBorder fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default PostCard;
